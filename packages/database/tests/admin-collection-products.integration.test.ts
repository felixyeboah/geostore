import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { db } from "../prisma/client";
import { getAdminCollectionProductPage } from "../prisma/queries/admin-collection-products";
import { getAdminProductList } from "../prisma/queries/commerce";

test("collections larger than 200 retain bounded, ordered membership and search exclusions", async () => {
	const prefix = `collection-paging-${randomUUID()}`;
	const ids = Array.from(
		{ length: 201 },
		(_, index) => `${prefix}-${String(index).padStart(3, "0")}`,
	);
	try {
		await db.category.create({
			data: { id: prefix, name: prefix, slug: prefix },
		});
		await db.collection.create({
			data: { id: prefix, name: prefix, slug: prefix },
		});
		await db.product.createMany({
			data: ids.map((id) => ({
				id,
				name: prefix,
				slug: id,
				sku: id,
				brand: prefix,
				description: prefix,
				categoryId: prefix,
				priceInPesewas: 100,
			})),
		});
		await db.productCollection.createMany({
			data: ids.map((productId, sortOrder) => ({
				productId,
				collectionId: prefix,
				sortOrder,
			})),
		});
		const pages = await Promise.all(
			[1, 2, 3].map((page) =>
				getAdminCollectionProductPage(prefix, page),
			),
		);
		assert.deepEqual(
			pages.map((page) => page?.products.length),
			[100, 100, 1],
		);
		assert.deepEqual(
			pages.flatMap(
				(page) => page?.products.map((product) => product.id) ?? [],
			),
			ids,
		);
		assert.equal(pages[0]?.pageCount, 3);
		const excluded = await getAdminProductList({
			q: prefix,
			excludeIds: ids,
		});
		assert.equal(excluded.total, 0);
		assert.equal(
			await getAdminCollectionProductPage(`${prefix}-absent`),
			null,
		);
	} finally {
		await db.collection.deleteMany({ where: { id: prefix } });
		await db.product.deleteMany({ where: { categoryId: prefix } });
		await db.category.deleteMany({ where: { id: prefix } });
		await db.$disconnect();
	}
});
