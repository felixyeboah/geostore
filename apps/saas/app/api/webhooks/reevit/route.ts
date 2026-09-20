import { formatMoney } from "@repo/commerce";
import {
	getRecipientName,
	markStoreOrderPaid,
	markStoreOrderPaymentFailed,
	markStoreOrderRefunded,
	recordWebhookEvent,
	releaseWebhookEvent,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { verifyReevitWebhook } from "@repo/payments";
import { NextResponse } from "next/server";

interface ReevitWebhookEvent {
	id: string;
	type: string;
	data?: {
		id?: string;
		metadata?: {
			order_id?: string;
		};
	};
}

/**
 * `sendEmail` swallows provider failures, but it renders the template *before*
 * its own try block, so a bad context or a missing translation throws out of it.
 * Letting that escape would release the webhook claim and re-run the payment
 * handler on the provider's retry — undoing a correct database write because a
 * receipt could not be typeset. The ledger is authoritative; the receipt is a
 * side effect.
 */
async function notifyCustomer(send: () => Promise<unknown>, context: object) {
	try {
		await send();
	} catch (error) {
		logger.error("Failed to send store order email", { ...context, error });
	}
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	const signature = request.headers.get("x-reevit-signature");
	const secret = process.env.REEVIT_WEBHOOK_SECRET;

	const verification = await verifyReevitWebhook(rawBody, signature, secret);

	if (!verification.ok) {
		// The reasons mean different things operationally: a run of "stale" is
		// someone replaying a captured delivery, while a run of "signature"
		// usually means a secret rotation went wrong on one side.
		logger.warn("Rejected Reevit webhook", { reason: verification.reason });
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 401 },
		);
	}

	const event = JSON.parse(rawBody) as ReevitWebhookEvent;

	if (!event.id) {
		return NextResponse.json(
			{ error: "Missing event id" },
			{ status: 400 },
		);
	}

	// Claim the event first so two simultaneous deliveries can't both process
	// it. The claim is released again if handling throws — otherwise the
	// provider's retry would be dropped as a duplicate and a customer who was
	// charged would be left sitting on an unpaid order.
	const recorded = await recordWebhookEvent(
		event.id,
		event.type,
		JSON.parse(rawBody) as Record<string, unknown>,
	);
	if (recorded.duplicate) {
		return NextResponse.json({ received: true, duplicate: true });
	}

	const orderId = event.data?.metadata?.order_id;
	if (!orderId) {
		return NextResponse.json({ received: true, ignored: true });
	}

	try {
		if (event.type === "payment.succeeded") {
			const order = await markStoreOrderPaid({
				orderId,
				providerPaymentId: event.data?.id ?? orderId,
				providerPayload: JSON.parse(rawBody),
			});
			await notifyCustomer(
				() =>
					sendEmail({
						to: order.customerEmail,
						templateId: "orderConfirmation",
						context: {
							name: getRecipientName(order.shippingAddress),
							orderNumber: order.orderNumber,
							totalLabel: formatMoney(order.totalInPesewas),
						},
					}),
				{ eventId: event.id, orderId, template: "orderConfirmation" },
			);
		}

		if (
			event.type === "payment.failed" ||
			event.type === "payment.canceled"
		) {
			const order = await markStoreOrderPaymentFailed(orderId);
			await notifyCustomer(
				() =>
					sendEmail({
						to: order.customerEmail,
						templateId: "orderFailed",
						context: {
							name: getRecipientName(order.shippingAddress),
							orderNumber: order.orderNumber,
						},
					}),
				{ eventId: event.id, orderId, template: "orderFailed" },
			);
		}

		if (event.type === "payment.refunded") {
			const order = await markStoreOrderRefunded(orderId);
			await notifyCustomer(
				() =>
					sendEmail({
						to: order.customerEmail,
						templateId: "orderRefunded",
						context: {
							name: getRecipientName(order.shippingAddress),
							orderNumber: order.orderNumber,
						},
					}),
				{ eventId: event.id, orderId, template: "orderRefunded" },
			);
		}
	} catch (error) {
		await releaseWebhookEvent(event.id);
		logger.error("Failed to process Reevit webhook", {
			eventId: event.id,
			eventType: event.type,
			orderId,
			error,
		});
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ received: true });
}
