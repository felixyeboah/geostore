/** Run with pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/admin-order-search.integration.test.ts */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { db } from "../prisma/client";
import { getAdminOrderList } from "../prisma/queries/commerce";

test("guest recipient search filters and paginates in the database", async () => {
	const prefix = `guest-search-${randomUUID()}`;
	const recipient = `Recipient ${prefix}`;
	try {
		await db.order.createMany({
			data: [0, 1].map((index) => ({
				id: `${prefix}-${index}`,
				orderNumber: `${prefix}-${index}`,
				paymentMethod: "MOCK" as const,
				subtotalInPesewas: 100,
				deliveryInPesewas: 0,
				totalInPesewas: 100,
				customerEmail: `guest-${index}@example.test`,
				customerPhone: "0000000000",
				shippingAddress: {
					recipientName:
						index === 0
							? `${recipient} O'Neil_%`
							: `${recipient} O'Neil-AB`,
				},
			})),
		});
		const first = await getAdminOrderList({
			q: recipient,
			perPage: 1,
			page: 1,
		});
		const second = await getAdminOrderList({
			q: recipient,
			perPage: 1,
			page: 2,
		});
		assert.equal(first.total, 2);
		assert.equal(first.pageCount, 2);
		assert.equal(first.orders.length, 1);
		assert.equal(second.orders.length, 1);
		assert.notEqual(first.orders[0].id, second.orders[0].id);
		const literal = await getAdminOrderList({ q: `${recipient} O'Neil_%` });
		assert.deepEqual(
			literal.orders.map((order) => order.id),
			[`${prefix}-0`],
		);
	} finally {
		await db.order.deleteMany({ where: { id: { startsWith: prefix } } });
		await db.$disconnect();
	}
});
