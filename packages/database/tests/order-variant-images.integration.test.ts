import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../prisma/client";
import { createMockStoreOrder } from "../prisma/queries/commerce";

const prefix = `order-media-${randomUUID()}`;
const orders: string[] = [];
let categoryId: string;
before(async () => {
	categoryId = (
		await db.category.create({ data: { name: prefix, slug: prefix } })
	).id;
});
after(async () => {
	try {
		await db.order.deleteMany({ where: { id: { in: orders } } });
		if (categoryId) {
			await db.product.deleteMany({ where: { categoryId } });
			await db.category.delete({ where: { id: categoryId } });
		}
	} finally {
		await db.$disconnect();
	}
});

async function fixture(
	label: string,
	matching: boolean,
	generic: boolean,
	activeVariant = true,
) {
	const name = `${prefix}-${label}`;
	return db.product.create({
		data: {
			name,
			slug: name,
			sku: name,
			categoryId,
			description: "Order media regression",
			brand: "QA",
			status: "ACTIVE",
			priceInPesewas: 10000,
			stockQuantity: 4,
			variants: {
				create: {
					name: "White",
					sku: `${name}-white`,
					attributes: { Colour: "White", Storage: "256 GB" },
					priceInPesewas: 15000,
					stockQuantity: 4,
					isActive: activeVariant,
				},
			},
			images: {
				create: [
					{
						url: "https://example.test/black.png",
						alt: "Black test product",
						sortOrder: 0,
						optionAxis: "Colour",
						optionValue: "Black",
					},
					...(generic
						? [
								{
									url: "https://example.test/generic.png",
									alt: "Generic test product",
									sortOrder: 1,
									optionAxis: null,
									optionValue: null,
								},
							]
						: []),
					...(matching
						? [
								{
									url: "https://example.test/white.png",
									alt: "White test product",
									sortOrder: 2,
									optionAxis: " colour ",
									optionValue: " WHITE ",
								},
							]
						: []),
				],
			},
		},
		include: { variants: true, images: true },
	});
}
async function order(productId: string, variantId?: string) {
	const created = await createMockStoreOrder({
		customer: {
			name: prefix,
			email: "order-media@example.test",
			phone: "0000000000",
		},
		address: { line1: "Test", city: "Accra", region: "Greater Accra" },
		items: [{ productId, variantId, quantity: 1 }],
	});
	orders.push(created.id);
	return db.orderItem.findFirstOrThrow({ where: { orderId: created.id } });
}

test("order snapshot prefers selected variant photo over earlier other-color and generic media", async () => {
	const product = await fixture("match", true, true);
	const item = await order(product.id, product.variants[0].id);
	assert.equal(item.imageUrl, "https://example.test/white.png");
	assert.equal(item.unitPriceInPesewas, 15000);
	assert.equal(item.variantId, product.variants[0].id);
	const stock = await db.productVariant.findUniqueOrThrow({
		where: { id: product.variants[0].id },
	});
	assert.equal(stock.stockQuantity, 3);
	await db.productImage.deleteMany({ where: { productId: product.id } });
	assert.equal(
		(await db.orderItem.findUniqueOrThrow({ where: { id: item.id } }))
			.imageUrl,
		"https://example.test/white.png",
		"Existing order retains its purchased image after catalog editing",
	);
});
test("missing selected media falls back only to untagged generic image", async () => {
	const product = await fixture("generic", false, true);
	assert.equal(
		(await order(product.id, product.variants[0].id)).imageUrl,
		"https://example.test/generic.png",
	);
});
test("no matching or generic image stores no image rather than another color", async () => {
	const product = await fixture("absent", false, false);
	assert.equal(
		(await order(product.id, product.variants[0].id)).imageUrl,
		null,
	);
});
test("omitting an active variant rejects before any order or inventory mutation", async () => {
	const product = await fixture("required", true, true);
	const beforeOrders = await db.order.count({
		where: { customerEmail: "order-media@example.test" },
	});
	await assert.rejects(order(product.id), /Choose an option/);
	assert.equal(
		await db.order.count({
			where: { customerEmail: "order-media@example.test" },
		}),
		beforeOrders,
	);
	const after = await db.product.findUniqueOrThrow({
		where: { id: product.id },
		include: { variants: true },
	});
	assert.equal(after.stockQuantity, 4);
	assert.equal(after.unitsSold, 0);
	assert.equal(after.variants[0].stockQuantity, 4);
	assert.equal(
		await db.inventoryEvent.count({ where: { productId: product.id } }),
		0,
	);
});
test("inactive-only variants still allow base product purchase with generic media", async () => {
	const product = await fixture("inactive", true, true, false);
	const item = await order(product.id);
	assert.equal(item.variantId, null);
	assert.equal(item.unitPriceInPesewas, 10000);
	assert.equal(item.imageUrl, "https://example.test/generic.png");
	assert.equal(
		(
			await db.productVariant.findUniqueOrThrow({
				where: { id: product.variants[0].id },
			})
		).stockQuantity,
		4,
	);
});
