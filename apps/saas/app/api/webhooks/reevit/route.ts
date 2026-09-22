import { formatMoney } from "@repo/commerce";
import {
	getRecipientName,
	hasProcessedWebhookEvent,
	markStoreOrderPaid,
	markStoreOrderPaymentFailed,
	markStoreOrderRefunded,
	recordWebhookEvent,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { verifyReevitWebhook } from "@repo/payments";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
	id: z.string().min(1),
	type: z.string().min(1),
});
const paymentDataSchema = z.object({
	id: z.string().min(1),
	metadata: z.object({ order_id: z.string().min(1).optional() }).optional(),
});
const handledEvents = new Set([
	"payment.succeeded",
	"payment.failed",
	"payment.canceled",
	"payment.refunded",
]);

/**
 * `sendEmail` swallows provider failures, but it renders the template *before*
 * its own try block, so a bad context or a missing translation throws out of it.
 * Completion is already recorded when this runs. Receipts are best-effort
 * side effects and cannot roll back the authoritative payment ledger.
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

	let body: unknown;
	try {
		body = JSON.parse(rawBody);
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const payload = z.record(z.string(), z.json()).safeParse(body);
	const envelope = eventSchema.safeParse(body);
	if (!payload.success || !envelope.success) {
		return NextResponse.json({ error: "Invalid event" }, { status: 400 });
	}
	const event = envelope.data;
	const payment = paymentDataSchema.safeParse(payload.data.data);
	if (handledEvents.has(event.type) && !payment.success) {
		return NextResponse.json(
			{ error: "Invalid payment event" },
			{ status: 400 },
		);
	}

	const orderId = payment.success
		? payment.data.metadata?.order_id
		: undefined;
	try {
		if (await hasProcessedWebhookEvent(event.id)) {
			return NextResponse.json({ received: true, duplicate: true });
		}

		let notification: (() => Promise<unknown>) | undefined;
		let notificationTemplate: string | undefined;
		let ignored =
			!orderId || !payment.success || !handledEvents.has(event.type);
		let reconciliationRequired = false;

		if (orderId && payment.success) {
			if (event.type === "payment.succeeded") {
				const order = await markStoreOrderPaid({
					orderId,
					providerPaymentId: payment.data.id,
					providerPayload: payload.data,
				});
				reconciliationRequired =
					order.paymentTransition === "additional" ||
					order.paymentTransition === "reconciliation";
				if (order.paymentTransition === "confirmed") {
					notificationTemplate = "orderConfirmation";
					notification = () =>
						sendEmail({
							to: order.customerEmail,
							templateId: "orderConfirmation",
							context: {
								name: getRecipientName(order.shippingAddress),
								orderNumber: order.orderNumber,
								totalLabel: formatMoney(order.totalInPesewas),
							},
						});
				}
			} else if (
				event.type === "payment.failed" ||
				event.type === "payment.canceled"
			) {
				const order = await markStoreOrderPaymentFailed(
					orderId,
					payment.data.id,
				);
				ignored = order.failureTransition !== "failed";
				if (!ignored) {
					notificationTemplate = "orderFailed";
					notification = () =>
						sendEmail({
							to: order.customerEmail,
							templateId: "orderFailed",
							context: {
								name: getRecipientName(order.shippingAddress),
								orderNumber: order.orderNumber,
							},
						});
				}
			} else if (event.type === "payment.refunded") {
				const order = await markStoreOrderRefunded(
					orderId,
					payment.data.id,
				);
				ignored = order.refundTransition === "already-refunded";
				if (order.refundTransition === "full") {
					notificationTemplate = "orderRefunded";
					notification = () =>
						sendEmail({
							to: order.customerEmail,
							templateId: "orderRefunded",
							context: {
								name: getRecipientName(order.shippingAddress),
								orderNumber: order.orderNumber,
							},
						});
				}
			}
		}

		// Only completed database work suppresses a retry. A process crash before
		// this write safely replays the idempotent payment handler. Concurrent
		// deliveries may both reach the handler; only the completion winner notifies.
		const recorded = await recordWebhookEvent(
			event.id,
			event.type,
			payload.data,
		);
		if (recorded.duplicate) {
			return NextResponse.json({ received: true, duplicate: true });
		}
		if (notification) {
			await notifyCustomer(notification, {
				eventId: event.id,
				orderId,
				template: notificationTemplate,
			});
		}
		return NextResponse.json({
			received: true,
			...(ignored ? { ignored: true } : {}),
			...(reconciliationRequired ? { reconciliationRequired: true } : {}),
		});
	} catch (error) {
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
}
