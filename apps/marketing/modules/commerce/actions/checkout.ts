"use server";

import { getSession } from "@auth/lib/server";
import {
	canReadStoreOrder,
	createOrderAccessToken,
} from "@commerce/lib/order-access";
import { formatMoney } from "@repo/commerce";
import { toStoreErrorMessage } from "@repo/commerce/action-errors";
import {
	attachStorePaymentIntent,
	createMockStoreOrder,
	createPendingStoreOrder,
	getRecipientName,
	getStoreOrderById,
	markStoreOrderPaymentFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import {
	createStorePaymentIntent,
	getStorePaymentProvider,
	mapStorePaymentMethod,
} from "@repo/payments";
import { getBaseUrl } from "@repo/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const placeStoreOrderSchema = z.object({
	customer: z.object({
		name: z.string().trim().min(2),
		email: z.string().trim().email(),
		phone: z.string().trim().min(10),
	}),
	address: z.object({
		line1: z.string().trim().min(5),
		line2: z.string().trim().optional(),
		city: z.string().trim().min(2),
		region: z.string().trim().min(2),
	}),
	items: z
		.array(
			z.object({
				productId: z.string().min(1),
				variantId: z.string().optional(),
				quantity: z.number().int().min(1),
			}),
		)
		.min(1),
	customerNote: z.string().trim().max(300).optional(),
	paymentMethod: z.enum([
		"ONLINE",
		"CARD",
		"MOBILE_MONEY",
		"CASH_ON_DELIVERY",
	]),
	// One per checkout attempt. Without it a retried submit — a flaky
	// connection, a second tab, an impatient double-click that beats the
	// disabled state — reserves the stock and bills the customer twice.
	idempotencyKey: z.string().uuid(),
});

export interface PlaceStoreOrderResult {
	success: boolean;
	message?: string;
	order?: {
		id: string;
		orderNumber: string;
		placedAt: string;
		next: "success" | "pay";
		paymentId?: string;
		accessToken: string;
	};
}

export async function placeStoreOrderAction(
	input: z.infer<typeof placeStoreOrderSchema>,
): Promise<PlaceStoreOrderResult> {
	const parsedInput = placeStoreOrderSchema.safeParse(input);

	if (!parsedInput.success) {
		return {
			success: false,
			message: "Check your delivery details and try again.",
		};
	}

	try {
		const session = await getSession();
		const provider = getStorePaymentProvider();

		if (provider === "mock") {
			// Defence in depth. `getStorePaymentProvider` already refuses to
			// return "mock" in production without an explicit opt-in, but this
			// branch hands over stock for free, so it re-checks rather than
			// trusting a single guard upstream.
			if (
				process.env.NODE_ENV === "production" &&
				process.env.ALLOW_MOCK_PAYMENTS !== "true"
			) {
				throw new Error(
					"Refusing to place a mock order in production.",
				);
			}

			const order = await createMockStoreOrder({
				...parsedInput.data,
				userId: session?.user.id,
			});
			await sendOrderConfirmationEmail(order);
			revalidateAdminAndOrders();
			return {
				success: true,
				order: {
					id: order.id,
					orderNumber: order.orderNumber,
					placedAt: order.placedAt.toISOString(),
					next: "success",
					accessToken: createOrderAccessToken(order.id),
				},
			};
		}

		const order = await createPendingStoreOrder({
			...parsedInput.data,
			userId: session?.user.id,
			paymentMethod: parsedInput.data.paymentMethod,
		});

		if (parsedInput.data.paymentMethod === "CASH_ON_DELIVERY") {
			await sendOrderConfirmationEmail(order);
			revalidateAdminAndOrders();
			return {
				success: true,
				order: {
					id: order.id,
					orderNumber: order.orderNumber,
					placedAt: order.placedAt.toISOString(),
					next: "success",
					accessToken: createOrderAccessToken(order.id),
				},
			};
		}

		// `null` here means "no channel pinned", which is what "pay online"
		// wants: Reevit shows mobile money and card and the shopper chooses.
		const reevitMethod = mapStorePaymentMethod(
			parsedInput.data.paymentMethod,
		);

		try {
			const payment = await createStorePaymentIntent({
				amountInPesewas: order.totalInPesewas,
				method: reevitMethod ?? undefined,
				customerId: session?.user.id ?? order.customerEmail,
				orderId: order.id,
				orderNumber: order.orderNumber,
			});
			await attachStorePaymentIntent({
				orderId: order.id,
				providerPaymentId: payment.id,
			});
			revalidateAdminAndOrders();
			return {
				success: true,
				order: {
					id: order.id,
					orderNumber: order.orderNumber,
					placedAt: order.placedAt.toISOString(),
					next: "pay",
					paymentId: payment.id,
					accessToken: createOrderAccessToken(order.id),
				},
			};
		} catch (error) {
			await markStoreOrderPaymentFailed(order.id);
			return {
				success: false,
				message: toStoreErrorMessage(
					error,
					"We couldn’t start payment. Please try again.",
				),
			};
		}
	} catch (error) {
		return {
			success: false,
			message: toStoreErrorMessage(
				error,
				"We couldn’t place the order. Please try again.",
			),
		};
	}
}

export async function getStoreOrderPaymentState(
	orderId: string,
	accessToken?: string,
) {
	const order = await getStoreOrderById(orderId);
	if (!order) {
		return null;
	}

	const session = await getSession();
	const isAllowed = canReadStoreOrder({
		orderId: order.id,
		orderUserId: order.userId ?? null,
		sessionUserId: session?.user.id,
		sessionUserRole: session?.user.role,
		token: accessToken,
	});

	if (!isAllowed) {
		return null;
	}

	return {
		id: order.id,
		orderNumber: order.orderNumber,
		status: order.status,
		paymentStatus: order.paymentStatus,
		paymentMethod: order.paymentMethod,
		totalInPesewas: order.totalInPesewas,
		customerEmail: order.customerEmail,
	};
}

/**
 * Only the Reevit webhook used to send an order confirmation, so the two paths
 * that finish an order without one — the mock provider and cash on delivery —
 * left the customer with nothing in their inbox. That is worse than it sounds
 * for a guest: with no account and no emailed link, a tokenised order page they
 * navigate away from is unreachable forever, even though the empty order
 * history explicitly tells them to "use the confirmation link we emailed you".
 *
 * Failures are logged, never thrown: the order exists and is paid for, and the
 * customer should not be told it failed because a mail server was down.
 */
async function sendOrderConfirmationEmail(order: {
	id: string;
	orderNumber: string;
	customerEmail: string;
	totalInPesewas: number;
	shippingAddress: unknown;
	paymentMethod: string;
}) {
	try {
		// `/checkout/success` is a route in *this* app, so it is built from
		// the storefront's own URL. It used to read NEXT_PUBLIC_SAAS_URL,
		// which is not set on the storefront Worker — so `getBaseUrl` threw,
		// this try swallowed it, and every order confirmation in production
		// was silently never sent.
		//
		// The env value has to be passed literally — `getBaseUrl()` with no
		// argument falls back to localhost, which would email guests a link
		// only reachable from the server itself.
		const orderUrl = new URL(
			"/checkout/success",
			getBaseUrl(process.env.NEXT_PUBLIC_MARKETING_URL, 3001),
		);
		orderUrl.searchParams.set("order", order.orderNumber);
		orderUrl.searchParams.set("t", createOrderAccessToken(order.id));

		await sendEmail({
			to: order.customerEmail,
			templateId: "orderConfirmation",
			context: {
				name: getRecipientName(order.shippingAddress),
				orderNumber: order.orderNumber,
				totalLabel: formatMoney(order.totalInPesewas),
				isPayOnDelivery: order.paymentMethod === "CASH_ON_DELIVERY",
				orderUrl: orderUrl.toString(),
			},
		});
	} catch (error) {
		logger.error("Failed to send order confirmation email", {
			orderId: order.id,
			error,
		});
	}
}

function revalidateAdminAndOrders() {
	revalidatePath("/admin/overview");
	revalidatePath("/admin/orders");
	revalidatePath("/orders");
}
