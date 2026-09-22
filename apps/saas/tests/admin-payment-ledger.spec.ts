import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { type APIRequestContext, expect, test } from "@playwright/test";

const id = `webhook-qa-${randomUUID()}`;
const client = createClient({
	url: process.env.DATABASE_URL ?? "",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function deliver(
	request: APIRequestContext,
	event: Record<string, unknown>,
	secret = process.env.REEVIT_WEBHOOK_SECRET,
) {
	expect(
		secret,
		"Test server must have a webhook signing secret",
	).toBeTruthy();
	const body = JSON.stringify({
		signature_timestamp: Math.floor(Date.now() / 1000),
		...event,
	});
	const signature = createHmac("sha256", secret ?? "")
		.update(body)
		.digest("hex");
	return request.post("/api/webhooks/reevit", {
		data: body,
		headers: {
			"content-type": "application/json",
			"x-reevit-signature": `sha256=${signature}`,
		},
	});
}

test.afterAll(async () => {
	try {
		await client.batch(
			[
				{
					sql: 'DELETE FROM "store_order" WHERE id LIKE ?',
					args: [`${id}%`],
				},
				{
					sql: 'DELETE FROM "store_webhook_event" WHERE id LIKE ?',
					args: [`${id}%`],
				},
			],
			"write",
		);
	} finally {
		client.close();
	}
});

test("signed payment events preserve retry history and refunded orders", async ({
	request,
}) => {
	const now = new Date().toISOString();
	await client.batch(
		[
			{
				sql: `INSERT INTO store_order (id,orderNumber,paymentMethod,paymentStatus,status,customerEmail,customerPhone,shippingAddress,subtotalInPesewas,deliveryInPesewas,totalInPesewas,placedAt,updatedAt) VALUES (?,?,'ONLINE','PENDING','PENDING','webhook@example.test','0000000000','{}',10000,0,10000,?,?)`,
				args: [id, id, now, now],
			},
			...["FAILED", "PENDING", "PENDING"].map((status, index) => ({
				sql: `INSERT INTO store_transaction (id,orderId,reference,provider,providerPaymentId,paymentMethod,status,amountInPesewas,createdAt,updatedAt) VALUES (?,?,?,'reevit',?,'ONLINE',?,10000,?,?)`,
				args: [
					`${id}-${index}`,
					id,
					`${id}-payment-${index}`,
					`${id}-payment-${index}`,
					status,
					now,
					now,
				],
			})),
		],
		"write",
	);
	const event = (type: string, index: number, suffix: string) => ({
		id: `${id}-${suffix}`,
		type,
		data: { id: `${id}-payment-${index}`, metadata: { order_id: id } },
	});

	const invalid = await deliver(
		request,
		event("payment.succeeded", 1, "invalid"),
		"wrong-secret",
	);
	expect(invalid.status()).toBe(401);
	const malformed = await deliver(request, {
		id: `${id}-malformed`,
		type: "payment.succeeded",
		data: { metadata: { order_id: id } },
	});
	expect(malformed.status()).toBe(400);
	const succeededEvent = event("payment.succeeded", 1, "success");
	expect((await deliver(request, succeededEvent)).ok()).toBeTruthy();
	const duplicate = await deliver(request, succeededEvent);
	expect(await duplicate.json()).toMatchObject({
		received: true,
		duplicate: true,
	});

	// Simulate a process dying after the payment transaction committed but
	// before its completion marker was persisted. Retry must recover the marker
	// without repeating fulfillment or status transitions.
	const transitionsBefore = await client.execute({
		sql: "SELECT COUNT(*) AS count FROM store_order_status_event WHERE orderId = ?",
		args: [id],
	});
	await client.execute({
		sql: "DELETE FROM store_webhook_event WHERE id = ?",
		args: [succeededEvent.id],
	});
	const recovered = await deliver(request, succeededEvent);
	expect(recovered.ok()).toBeTruthy();
	expect(await recovered.json()).not.toMatchObject({ duplicate: true });
	const marker = await client.execute({
		sql: "SELECT COUNT(*) AS count FROM store_webhook_event WHERE id = ?",
		args: [succeededEvent.id],
	});
	expect(Number(marker.rows[0].count)).toBe(1);
	const transitionsAfter = await client.execute({
		sql: "SELECT COUNT(*) AS count FROM store_order_status_event WHERE orderId = ?",
		args: [id],
	});
	expect(transitionsAfter.rows[0].count).toBe(
		transitionsBefore.rows[0].count,
	);
	const replay = await deliver(request, succeededEvent);
	expect(await replay.json()).toMatchObject({ duplicate: true });
	let rows = await client.execute({
		sql: "SELECT status FROM store_transaction WHERE orderId = ? ORDER BY id",
		args: [id],
	});
	expect(rows.rows.map((row) => row.status)).toEqual([
		"FAILED",
		"PAID",
		"PENDING",
	]);
	expect(
		(await deliver(request, event("payment.refunded", 1, "refund"))).ok(),
	).toBeTruthy();
	expect(
		await (
			await deliver(
				request,
				event("payment.refunded", 1, "refund-replay"),
			)
		).json(),
	).toMatchObject({ received: true, ignored: true });
	expect(
		(
			await deliver(request, event("payment.failed", 2, "late-failure"))
		).ok(),
	).toBeTruthy();
	rows = await client.execute({
		sql: "SELECT status FROM store_transaction WHERE orderId = ? ORDER BY id",
		args: [id],
	});
	expect(rows.rows.map((row) => row.status)).toEqual([
		"FAILED",
		"REFUNDED",
		"FAILED",
	]);
	await client.execute({
		sql: 'DELETE FROM "store_webhook_event" WHERE id = ?',
		args: [succeededEvent.id],
	});
	expect((await deliver(request, succeededEvent)).ok()).toBeTruthy();
	const order = await client.execute({
		sql: "SELECT status,paymentStatus FROM store_order WHERE id = ?",
		args: [id],
	});
	expect(order.rows[0]).toMatchObject({
		status: "REFUNDED",
		paymentStatus: "REFUNDED",
	});
});

for (const initialStatus of ["PENDING", "CANCELLED"] as const) {
	test(`signed captures and per-attempt refunds reconcile an initially ${initialStatus.toLowerCase()} order`, async ({
		request,
	}) => {
		const orderId = `${id}-${initialStatus.toLowerCase()}`;
		const now = new Date().toISOString();
		await client.batch(
			[
				{
					sql: `INSERT INTO store_order (id,orderNumber,paymentMethod,paymentStatus,status,customerEmail,customerPhone,shippingAddress,subtotalInPesewas,deliveryInPesewas,totalInPesewas,placedAt,updatedAt) VALUES (?,?,'ONLINE',?,?,'webhook@example.test','0000000000','{}',10000,0,10000,?,?)`,
					args: [
						orderId,
						orderId,
						initialStatus === "CANCELLED" ? "FAILED" : "PENDING",
						initialStatus,
						now,
						now,
					],
				},
				...[0, 1].map((index) => ({
					sql: `INSERT INTO store_transaction (id,orderId,reference,provider,providerPaymentId,paymentMethod,status,amountInPesewas,createdAt,updatedAt) VALUES (?,?,?,'reevit',?,'ONLINE',?,10000,?,?)`,
					args: [
						`${orderId}-${index}`,
						orderId,
						`${orderId}-payment-${index}`,
						`${orderId}-payment-${index}`,
						initialStatus === "CANCELLED" ? "FAILED" : "PENDING",
						now,
						now,
					],
				})),
			],
			"write",
		);
		const event = (type: string, index: number, suffix: string) => ({
			id: `${orderId}-${suffix}`,
			type,
			data: {
				id: `${orderId}-payment-${index}`,
				metadata: { order_id: orderId },
			},
		});
		const first = await deliver(
			request,
			event("payment.succeeded", 0, "capture-0"),
		);
		expect(first.ok()).toBeTruthy();
		if (initialStatus === "CANCELLED") {
			expect(await first.json()).toMatchObject({
				reconciliationRequired: true,
			});
		}
		const second = await deliver(
			request,
			event("payment.succeeded", 1, "capture-1"),
		);
		expect(second.ok()).toBeTruthy();
		expect(await second.json()).toMatchObject({
			reconciliationRequired: true,
		});
		const partial = await deliver(
			request,
			event("payment.refunded", 1, "refund-1"),
		);
		expect(partial.ok()).toBeTruthy();
		const order = await client.execute({
			sql: "SELECT status,paymentStatus FROM store_order WHERE id = ?",
			args: [orderId],
		});
		expect(order.rows[0]).toMatchObject({
			status: initialStatus === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
			paymentStatus: "PAID",
		});
		const attempts = await client.execute({
			sql: "SELECT status FROM store_transaction WHERE orderId = ? ORDER BY id",
			args: [orderId],
		});
		expect(attempts.rows.map((row) => row.status)).toEqual([
			"PAID",
			"REFUNDED",
		]);
		const full = await deliver(
			request,
			event("payment.refunded", 0, "refund-0"),
		);
		expect(full.ok()).toBeTruthy();
		const finalOrder = await client.execute({
			sql: "SELECT status,paymentStatus FROM store_order WHERE id = ?",
			args: [orderId],
		});
		expect(finalOrder.rows[0].paymentStatus).toBe("REFUNDED");
		expect(
			await (
				await deliver(
					request,
					event("payment.refunded", 0, "refund-0-replay"),
				)
			).json(),
		).toMatchObject({ received: true, ignored: true });
	});
}
