/** Run with pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/admin-pagination.integration.test.ts */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../prisma/client";
import {
	getAdminOrderList,
	getAdminProductList,
	getAdminTransactionList,
} from "../prisma/queries/commerce";
import { getOrganizations } from "../prisma/queries/organizations";
import { getAdminUserList, getUsers } from "../prisma/queries/users";

const prefix = `pagination-${randomUUID()}`;
const ids = Array.from({ length: 6 }, (_, index) => `${prefix}-${index}`);
const timestamp = new Date("2025-01-01T00:00:00Z");

before(async () => {
	await db.category.create({
		data: { id: prefix, name: prefix, slug: prefix },
	});
	// Insert in reverse ID order so incidental insertion order cannot pass.
	for (const id of [...ids].reverse()) {
		await db.product.create({
			data: {
				id,
				name: prefix,
				slug: id,
				sku: id,
				description: "Pagination fixture",
				brand: prefix,
				categoryId: prefix,
				priceInPesewas: 100,
				stockQuantity: 3,
				updatedAt: timestamp,
			},
		});
		await db.user.create({
			data: {
				id,
				name: prefix,
				email: `${id}@example.test`,
				emailVerified: true,
				createdAt: timestamp,
				updatedAt: timestamp,
			},
		});
		await db.organization.create({
			data: { id, name: prefix, slug: id, createdAt: timestamp },
		});
		await db.order.create({
			data: {
				id,
				orderNumber: id,
				paymentMethod: "MOCK",
				subtotalInPesewas: 100,
				deliveryInPesewas: 0,
				totalInPesewas: 100,
				customerEmail: `${prefix}@example.test`,
				customerPhone: "0000000000",
				shippingAddress: {},
				placedAt: timestamp,
			},
		});
		await db.storeTransaction.create({
			data: {
				id,
				orderId: id,
				reference: id,
				provider: "mock",
				paymentMethod: "MOCK",
				amountInPesewas: 100,
				createdAt: timestamp,
			},
		});
	}
});
after(async () => {
	try {
		await db.order.deleteMany({ where: { id: { in: ids } } });
		await db.product.deleteMany({ where: { id: { in: ids } } });
		await db.category.deleteMany({ where: { id: prefix } });
		await db.user.deleteMany({ where: { id: { in: ids } } });
		await db.organization.deleteMany({ where: { id: { in: ids } } });
	} finally {
		await db.$disconnect();
	}
});

async function assertStablePages(
	fetchPage: (page: number) => Promise<{ id: string }[]>,
) {
	const pages = await Promise.all([fetchPage(1), fetchPage(2), fetchPage(3)]);
	assert.deepEqual(
		pages.flat().map((row) => row.id),
		ids,
	);
	assert.equal(new Set(pages.flat().map((row) => row.id)).size, 6);
	assert.deepEqual(await fetchPage(2), pages[1]);
}

test("products retain disjoint pages for ties in every sort", async () => {
	for (const sort of ["name", "price", "stock", "updated"] as const) {
		for (const dir of ["asc", "desc"] as const) {
			await assertStablePages(
				async (page) =>
					(
						await getAdminProductList({
							q: prefix,
							perPage: 2,
							page,
							sort,
							dir,
						})
					).products,
			);
		}
	}
});
test("orders retain disjoint pages for ties in every sort", async () => {
	for (const sort of ["placed", "total", "customer"] as const) {
		for (const dir of ["asc", "desc"] as const) {
			await assertStablePages(
				async (page) =>
					(
						await getAdminOrderList({
							q: prefix,
							perPage: 2,
							page,
							sort,
							dir,
						})
					).orders,
			);
		}
	}
});
test("transactions retain disjoint pages for ties in every sort", async () => {
	for (const sort of ["created", "amount"] as const) {
		for (const dir of ["asc", "desc"] as const) {
			await assertStablePages(
				async (page) =>
					(
						await getAdminTransactionList({
							q: prefix,
							perPage: 2,
							page,
							sort,
							dir,
						})
					).transactions,
			);
		}
	}
});
test("users retain disjoint pages for ties in every sort and legacy listing", async () => {
	for (const sort of ["name", "created"] as const) {
		for (const dir of ["asc", "desc"] as const) {
			await assertStablePages(
				async (page) =>
					(
						await getAdminUserList({
							q: prefix,
							perPage: 2,
							page,
							sort,
							dir,
						})
					).users,
			);
		}
	}
	await assertStablePages((page) =>
		getUsers({ query: prefix, limit: 2, offset: (page - 1) * 2 }),
	);
});
test("organizations have deterministic disjoint pages", async () => {
	await assertStablePages((page) =>
		getOrganizations({ query: prefix, limit: 2, offset: (page - 1) * 2 }),
	);
});
