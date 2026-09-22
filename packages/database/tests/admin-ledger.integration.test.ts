import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../prisma/client";
import {
	attachStorePaymentIntent,
	getAdminOrderSummary,
	getAdminTransactionSummary,
	getStoreOrderRefundPaymentId,
	getStoreSalesAnalytics,
	markStoreOrderPaid,
	markStoreOrderPaymentFailed,
	markStoreOrderRefunded,
	updateStoreOrderStatus,
} from "../prisma/queries/commerce";

const prefix = `ledger-${randomUUID()}`;
const orderIds: string[] = [];
const inventoryProductIds: string[] = [];
const historicalDate = new Date();
historicalDate.setUTCHours(12, 0, 0, 0);
historicalDate.setUTCDate(historicalDate.getUTCDate() - 1000);

after(async () => {
	try {
		await db.order.deleteMany({ where: { id: { in: orderIds } } });
		await db.product.deleteMany({
			where: { id: { in: inventoryProductIds } },
		});
		await db.category.deleteMany({
			where: { id: { in: inventoryProductIds } },
		});
	} finally {
		await db.$disconnect();
	}
});

async function createOrder(
	label: string,
	method: "MOCK" | "CASH_ON_DELIVERY" = "MOCK",
) {
	const id = `${prefix}-${label}`;
	orderIds.push(id);
	return db.order.create({
		data: {
			id,
			orderNumber: id,
			paymentMethod: method,
			paymentStatus: "PAID",
			status: "CONFIRMED",
			customerEmail: "ledger@example.test",
			customerPhone: "0000000000",
			shippingAddress: {},
			subtotalInPesewas: 10000,
			deliveryInPesewas: 0,
			totalInPesewas: 10000,
			placedAt: historicalDate,
			transactions: {
				create: ["FAILED", "PAID", "PENDING"].map((status, index) => ({
					reference: `${id}-${index}`,
					provider: "mock",
					paymentMethod: method,
					status: status as "FAILED" | "PAID" | "PENDING",
					amountInPesewas: 10000,
					createdAt: historicalDate,
				})),
			},
		},
	});
}

async function assertRefundedAttemptHistory(orderId: string) {
	const attempts = await db.storeTransaction.findMany({
		where: { orderId },
		orderBy: { reference: "asc" },
	});
	assert.deepEqual(
		attempts.map((row) => row.status),
		["FAILED", "REFUNDED", "PENDING"],
	);
}

test("provider refund preserves failed and pending attempts and gross/net reconciliation", async () => {
	const order = await createOrder("provider");
	const before = await getAdminTransactionSummary();
	await markStoreOrderRefunded(order.id);
	await assertRefundedAttemptHistory(order.id);
	const after = await getAdminTransactionSummary();
	assert.equal(after.settledInPesewas, before.settledInPesewas);
	assert.equal(after.settledCount, before.settledCount);
	assert.equal(after.refundedInPesewas, before.refundedInPesewas + 10000);
	assert.equal(after.netInPesewas, before.netInPesewas - 10000);
	await markStoreOrderRefunded(order.id);
	assert.equal(
		await db.orderStatusEvent.count({ where: { orderId: order.id } }),
		1,
	);
});

test("manual refund updates the ledger once and rejects unpaid refunds", async () => {
	const order = await createOrder("manual", "CASH_ON_DELIVERY");
	await updateStoreOrderStatus(order.id, "REFUNDED", prefix);
	await assertRefundedAttemptHistory(order.id);
	await updateStoreOrderStatus(order.id, "REFUNDED", prefix);
	assert.equal(
		await db.orderStatusEvent.count({ where: { orderId: order.id } }),
		1,
	);
	const unpaid = await createOrder("unpaid");
	await db.order.update({
		where: { id: unpaid.id },
		data: { paymentStatus: "PENDING" },
	});
	await assert.rejects(
		updateStoreOrderStatus(unpaid.id, "REFUNDED", prefix),
		/Only paid orders/,
	);
});

test("payment success analytics counts resolved attempts rather than final order states", async () => {
	const before = await getStoreSalesAnalytics(1, 1000);
	const order = await createOrder("analytics");
	await markStoreOrderRefunded(order.id);
	const after = await getStoreSalesAnalytics(1, 1000);
	assert.equal(after.attemptedPaymentCount, before.attemptedPaymentCount + 2);
	assert.equal(after.succeededPaymentCount, before.succeededPaymentCount + 1);
});

test("dispatch summary includes unpaid cash orders ready for delivery", async () => {
	const before = await getAdminOrderSummary(24);
	const order = await createOrder("dispatch", "CASH_ON_DELIVERY");
	await db.order.update({
		where: { id: order.id },
		data: { paymentStatus: "PENDING", status: "READY_FOR_DELIVERY" },
	});
	const after = await getAdminOrderSummary(24);
	assert.equal(after.awaitingDispatch, before.awaitingDispatch + 1);
	assert.equal(after.late, before.late + 1);
});

test("success changes only its own payment attempt and late failure preserves a refund", async () => {
	const order = await createOrder("attempt-history");
	await db.order.update({
		where: { id: order.id },
		data: { paymentStatus: "PENDING" },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { status: "PENDING", providerPaymentId: `${prefix}-provider` },
	});
	await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId: `${prefix}-provider`,
		providerPayload: {},
	});
	const paid = await db.storeTransaction.findMany({
		where: { orderId: order.id },
		orderBy: { reference: "asc" },
	});
	assert.deepEqual(
		paid.map((row) => row.status),
		["FAILED", "PAID", "PENDING"],
	);
	await markStoreOrderRefunded(order.id);
	await markStoreOrderPaymentFailed(order.id);
	await assertRefundedAttemptHistory(order.id);
	assert.equal(
		(await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
		"REFUNDED",
	);
});

test("a paid cancelled cash order can be refunded without reopening fulfillment", async () => {
	const order = await createOrder("cancelled-refund", "CASH_ON_DELIVERY");
	await updateStoreOrderStatus(order.id, "CANCELLED", prefix);
	await updateStoreOrderStatus(order.id, "REFUNDED", prefix);
	await assertRefundedAttemptHistory(order.id);
});

test("intent attachment preserves historical attempts and is idempotent after settlement", async () => {
	const order = await createOrder("attachment");
	const original = await db.storeTransaction.findMany({
		where: { orderId: order.id },
		orderBy: { reference: "asc" },
	});
	const providerPaymentId = `${order.id}-provider`;
	await attachStorePaymentIntent({ orderId: order.id, providerPaymentId });
	const rows = await db.storeTransaction.findMany({
		where: { orderId: order.id },
	});
	for (const prior of original.filter((row) => row.status !== "PENDING")) {
		const row = rows.find((value) => value.id === prior.id);
		assert.equal(row?.reference, prior.reference);
		assert.equal(row?.providerPaymentId, prior.providerPaymentId);
		assert.equal(row?.status, prior.status);
	}
	assert.equal(
		rows.find((row) => row.status === "PENDING")?.providerPaymentId,
		providerPaymentId,
	);
	assert.deepEqual(
		await attachStorePaymentIntent({
			orderId: order.id,
			providerPaymentId,
		}),
		{ count: 0 },
	);
	await assert.rejects(
		attachStorePaymentIntent({
			orderId: order.id,
			providerPaymentId: `${providerPaymentId}-other`,
		}),
		/No unique unassigned/,
	);
	await db.storeTransaction.updateMany({
		where: { orderId: order.id, providerPaymentId },
		data: { status: "PAID" },
	});
	assert.deepEqual(
		await attachStorePaymentIntent({
			orderId: order.id,
			providerPaymentId,
		}),
		{ count: 0 },
	);
});

test("stale failure cannot cancel another pending attempt, and the last failure cancels once", async () => {
	const order = await createOrder("failure-isolation");
	await db.order.update({
		where: { id: order.id },
		data: { paymentStatus: "PENDING", status: "PENDING" },
	});
	const oldId = `${order.id}-old`;
	const retryId = `${order.id}-retry`;
	await db.storeTransaction.update({
		where: { reference: `${order.id}-0` },
		data: { providerPaymentId: `${order.id}-resolved` },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { status: "PENDING", providerPaymentId: oldId },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-2` },
		data: { providerPaymentId: retryId },
	});
	await markStoreOrderPaymentFailed(order.id, `${order.id}-resolved`);
	await markStoreOrderPaymentFailed(order.id, oldId);
	const pending = await db.order.findUniqueOrThrow({
		where: { id: order.id },
		include: { transactions: true },
	});
	assert.equal(pending.status, "PENDING");
	assert.equal(
		pending.transactions.find((row) => row.providerPaymentId === retryId)
			?.status,
		"PENDING",
	);
	await markStoreOrderPaymentFailed(order.id, oldId);
	assert.equal(
		await db.orderStatusEvent.count({ where: { orderId: order.id } }),
		0,
	);
	await markStoreOrderPaymentFailed(order.id, retryId);
	await markStoreOrderPaymentFailed(order.id, retryId);
	const failed = await db.order.findUniqueOrThrow({
		where: { id: order.id },
	});
	assert.equal(failed.paymentStatus, "FAILED");
	assert.equal(failed.status, "CANCELLED");
	assert.equal(
		await db.orderStatusEvent.count({ where: { orderId: order.id } }),
		1,
	);
});

test("internal create-intent failure only fails the unique unassigned attempt", async () => {
	const order = await createOrder("unassigned-failure");
	await db.order.update({
		where: { id: order.id },
		data: { paymentStatus: "PENDING", status: "PENDING" },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { status: "PENDING", providerPaymentId: `${order.id}-active` },
	});
	await markStoreOrderPaymentFailed(order.id);
	const rows = await db.storeTransaction.findMany({
		where: { orderId: order.id },
		orderBy: { reference: "asc" },
	});
	assert.deepEqual(
		rows.map((row) => row.status),
		["FAILED", "PENDING", "FAILED"],
	);
	assert.equal(
		(await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
		"PENDING",
	);
});

test("refund selection ignores newer pending attempts and rejects ambiguous settlements", async () => {
	const order = await createOrder("refund-selection");
	await db.storeTransaction.updateMany({
		where: { orderId: order.id },
		data: { provider: "reevit" },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { providerPaymentId: `${order.id}-paid` },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-2` },
		data: { providerPaymentId: `${order.id}-newer`, createdAt: new Date() },
	});
	const rows = await db.storeTransaction.findMany({
		where: { orderId: order.id },
		orderBy: { createdAt: "desc" },
	});
	assert.equal(rows[0].status, "PENDING");
	assert.equal(getStoreOrderRefundPaymentId(rows), `${order.id}-paid`);
	await assert.rejects(
		markStoreOrderRefunded(order.id, `${order.id}-newer`),
		/does not match/,
	);
	assert.equal(
		(await db.order.findUniqueOrThrow({ where: { id: order.id } }))
			.paymentStatus,
		"PAID",
	);
	assert.throws(
		() =>
			getStoreOrderRefundPaymentId([
				...rows,
				{
					status: "PAID",
					provider: "reevit",
					providerPaymentId: "ambiguous",
				},
			]),
		/Multiple captured payments.*Reevit/,
	);
	await markStoreOrderRefunded(order.id, `${order.id}-paid`);
	await assertRefundedAttemptHistory(order.id);
});

test("a captured failed attempt settles exactly that attempt without consuming its pending retry", async () => {
	const order = await createOrder("success-isolation");
	await db.order.update({
		where: { id: order.id },
		data: { paymentStatus: "PENDING", status: "PENDING" },
	});
	const providerPaymentId = `${order.id}-failed`;
	await db.storeTransaction.update({
		where: { reference: `${order.id}-0` },
		data: { providerPaymentId },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { status: "FAILED" },
	});
	const result = await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId,
		providerPayload: {},
	});
	assert.equal(result.paymentTransition, "confirmed");
	const attempts = await db.storeTransaction.findMany({
		where: { orderId: order.id },
		orderBy: { reference: "asc" },
	});
	assert.deepEqual(
		attempts.map((row) => row.status),
		["PAID", "FAILED", "PENDING"],
	);
});

test("terminal orders record identified failed attempts without changing fulfillment", async () => {
	for (const terminal of ["PAID", "REFUNDED", "CANCELLED"] as const) {
		const order = await createOrder(`terminal-failure-${terminal}`);
		if (terminal === "REFUNDED") {
			await markStoreOrderRefunded(order.id);
		}
		if (terminal === "CANCELLED") {
			await updateStoreOrderStatus(order.id, "CANCELLED", prefix);
		}
		const before = await db.order.findUniqueOrThrow({
			where: { id: order.id },
		});
		const eventCount = await db.orderStatusEvent.count({
			where: { orderId: order.id },
		});
		// Unknown old events cannot claim the unassigned retry after fulfillment is terminal.
		await markStoreOrderPaymentFailed(order.id, `${order.id}-unknown`);
		assert.equal(
			(
				await db.storeTransaction.findUniqueOrThrow({
					where: { reference: `${order.id}-2` },
				})
			).status,
			"PENDING",
		);
		const paymentId = `${order.id}-pending`;
		await db.storeTransaction.update({
			where: { reference: `${order.id}-2` },
			data: { providerPaymentId: paymentId },
		});
		await markStoreOrderPaymentFailed(order.id, paymentId);
		await markStoreOrderPaymentFailed(order.id, paymentId);
		assert.equal(
			(
				await db.storeTransaction.findUniqueOrThrow({
					where: { reference: `${order.id}-2` },
				})
			).status,
			"FAILED",
		);
		const after = await db.order.findUniqueOrThrow({
			where: { id: order.id },
		});
		assert.equal(after.paymentStatus, before.paymentStatus);
		assert.equal(after.status, before.status);
		assert.equal(
			await db.orderStatusEvent.count({ where: { orderId: order.id } }),
			eventCount,
		);
	}
});

test("additional successful payments are recorded for reconciliation without fulfilling twice", async () => {
	const order = await createOrder("additional-success");
	await db.order.update({
		where: { id: order.id },
		data: { status: "PROCESSING" },
	});
	await assert.rejects(
		markStoreOrderPaid({
			orderId: order.id,
			providerPaymentId: `${order.id}-unknown`,
			providerPayload: {},
		}),
		/No matching payment/,
	);
	const providerPaymentId = `${order.id}-additional`;
	await db.storeTransaction.update({
		where: { reference: `${order.id}-2` },
		data: { providerPaymentId },
	});
	const additional = await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId,
		providerPayload: {},
	});
	assert.equal(additional.paymentTransition, "additional");
	assert.equal(additional.status, "PROCESSING");
	assert.equal(additional.paymentStatus, "PAID");
	assert.equal(
		(
			await db.storeTransaction.findUniqueOrThrow({
				where: { reference: `${order.id}-2` },
			})
		).status,
		"PAID",
	);
	const repeated = await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId,
		providerPayload: {},
	});
	assert.equal(repeated.paymentTransition, "already-paid");
	const events = await db.orderStatusEvent.findMany({
		where: { orderId: order.id },
	});
	assert.equal(events.length, 1);
	assert.equal(events[0].status, "PROCESSING");
	assert.match(events[0].note ?? "", /reconciliation required/);
});

test("historical success replay after a refund leaves fulfillment and ledger intact", async () => {
	const order = await createOrder("refunded-success-replay");
	const providerPaymentId = `${prefix}-historical`;
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { providerPaymentId },
	});
	await markStoreOrderRefunded(order.id, providerPaymentId);
	const result = await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId,
		providerPayload: {},
	});
	assert.equal(result.paymentTransition, "already-paid");
	assert.equal(result.status, "REFUNDED");
	await assertRefundedAttemptHistory(order.id);
});

async function addReservedInventory(orderId: string) {
	const id = `${orderId}-product`;
	inventoryProductIds.push(id);
	await db.category.create({ data: { id, name: id, slug: id } });
	await db.product.create({
		data: {
			id,
			name: id,
			slug: id,
			sku: id,
			description: "Isolated ledger test",
			brand: "Test",
			categoryId: id,
			priceInPesewas: 10000,
			stockQuantity: 4,
			unitsSold: 1,
		},
	});
	await db.orderItem.create({
		data: {
			orderId,
			productId: id,
			productName: id,
			sku: id,
			quantity: 1,
			unitPriceInPesewas: 10000,
			lineTotalInPesewas: 10000,
		},
	});
	return id;
}

test("refunding a duplicate capture keeps the paid order and only the final refund restocks", async () => {
	const order = await createOrder("duplicate-refund");
	const productId = await addReservedInventory(order.id);
	const firstPayment = `${order.id}-first`;
	const secondPayment = `${order.id}-second`;
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { providerPaymentId: firstPayment },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-2` },
		data: { providerPaymentId: secondPayment },
	});
	await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId: secondPayment,
		providerPayload: {},
	});
	const before = await getAdminTransactionSummary();
	const partial = await markStoreOrderRefunded(order.id, secondPayment);
	assert.equal(partial.refundTransition, "partial");
	assert.equal(partial.paymentStatus, "PAID");
	assert.equal(partial.status, "CONFIRMED");
	assert.equal(
		(await db.product.findUniqueOrThrow({ where: { id: productId } }))
			.stockQuantity,
		4,
	);
	assert.equal(await db.inventoryEvent.count({ where: { productId } }), 0);
	const duplicate = await markStoreOrderRefunded(order.id, secondPayment);
	assert.equal(duplicate.refundTransition, "already-refunded");
	const full = await markStoreOrderRefunded(order.id, firstPayment);
	assert.equal(full.refundTransition, "full");
	assert.equal(full.status, "REFUNDED");
	assert.equal(full.paymentStatus, "REFUNDED");
	const after = await getAdminTransactionSummary();
	assert.equal(after.netInPesewas, before.netInPesewas - 20000);
	assert.equal(after.settledInPesewas, before.settledInPesewas);
	assert.equal(
		(await db.product.findUniqueOrThrow({ where: { id: productId } }))
			.stockQuantity,
		5,
	);
	assert.equal(await db.inventoryEvent.count({ where: { productId } }), 1);
	assert.equal(
		(await markStoreOrderRefunded(order.id, firstPayment)).refundTransition,
		"already-refunded",
	);
	assert.equal(await db.inventoryEvent.count({ where: { productId } }), 1);
});

test("late capture after cancellation records the payment for reconciliation without reserving again", async () => {
	const order = await createOrder("cancelled-capture");
	const productId = await addReservedInventory(order.id);
	const providerPaymentId = `${order.id}-capture`;
	await db.order.update({
		where: { id: order.id },
		data: { status: "PENDING", paymentStatus: "PENDING" },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-1` },
		data: { status: "PENDING", providerPaymentId },
	});
	await db.storeTransaction.update({
		where: { reference: `${order.id}-2` },
		data: { status: "FAILED" },
	});
	const failed = await markStoreOrderPaymentFailed(
		order.id,
		providerPaymentId,
	);
	assert.equal(failed.failureTransition, "failed");
	assert.equal(failed.status, "CANCELLED");
	const repeatedFailure = await markStoreOrderPaymentFailed(
		order.id,
		providerPaymentId,
	);
	assert.equal(repeatedFailure.failureTransition, "ignored");
	const captured = await markStoreOrderPaid({
		orderId: order.id,
		providerPaymentId,
		providerPayload: {},
	});
	assert.equal(captured.paymentTransition, "reconciliation");
	assert.equal(captured.status, "CANCELLED");
	assert.equal(captured.paymentStatus, "PAID");
	assert.equal(
		(
			await db.storeTransaction.findUniqueOrThrow({
				where: { reference: `${order.id}-1` },
			})
		).status,
		"PAID",
	);
	assert.equal(
		(await db.product.findUniqueOrThrow({ where: { id: productId } }))
			.stockQuantity,
		5,
	);
	assert.equal(await db.inventoryEvent.count({ where: { productId } }), 1);
	assert.equal(
		(
			await markStoreOrderPaid({
				orderId: order.id,
				providerPaymentId,
				providerPayload: {},
			})
		).paymentTransition,
		"already-paid",
	);
	const refunded = await markStoreOrderRefunded(order.id, providerPaymentId);
	assert.equal(refunded.refundTransition, "full");
	assert.equal(refunded.status, "REFUNDED");
	assert.equal(
		(await db.product.findUniqueOrThrow({ where: { id: productId } }))
			.stockQuantity,
		5,
	);
	assert.equal(await db.inventoryEvent.count({ where: { productId } }), 1);
});
