import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { db } from "../prisma/client";
import { getPublishedStoreProducts } from "../prisma/queries/commerce";
import { searchPublishedStoreProducts } from "../prisma/queries/storefront-search";

test("storefront search matches words and active variant SKUs, excludes hidden products, and limits previews", async () => {
	const prefix = `search-${randomUUID()}`;
	const category = await db.category.create({
		data: { name: prefix, slug: prefix },
	});
	try {
		for (let index = 0; index < 8; index++) {
			await db.product.create({
				data: {
					name: `Phone ${index}`,
					slug: `${prefix}-${index}`,
					sku: `${prefix}-${index}`,
					brand: prefix,
					description: "Search test",
					categoryId: category.id,
					priceInPesewas: 100,
					stockQuantity: 1,
					status: index === 7 ? "DRAFT" : "ACTIVE",
					variants:
						index === 0
							? {
									create: [
										{
											name: "Blue",
											sku: `${prefix}-blue`,
											priceInPesewas: 100,
											stockQuantity: 1,
											attributes: { Colour: "Blue" },
										},
										{
											name: "Hidden",
											sku: `${prefix}-hidden`,
											priceInPesewas: 100,
											stockQuantity: 1,
											attributes: { Colour: "Hidden" },
											isActive: false,
										},
									],
								}
							: undefined,
				},
			});
		}
		const preview = await searchPublishedStoreProducts(
			`  ${prefix}   phone `,
		);
		assert.equal(preview.total, 7);
		assert.equal(preview.products.length, 6);
		assert.equal(
			(await getPublishedStoreProducts({ query: ` ${prefix} phone ` }))
				.length,
			7,
		);
		assert.equal(
			(await searchPublishedStoreProducts(`${prefix}-blue`)).total,
			1,
		);
		assert.equal(
			(await searchPublishedStoreProducts(`${prefix}-hidden`)).total,
			0,
		);
		await db.category.update({
			where: { id: category.id },
			data: { isActive: false },
		});
		assert.equal((await searchPublishedStoreProducts(prefix)).total, 0);
	} finally {
		await db.product.deleteMany({ where: { categoryId: category.id } });
		await db.category.delete({ where: { id: category.id } });
		await db.$disconnect();
	}
});
