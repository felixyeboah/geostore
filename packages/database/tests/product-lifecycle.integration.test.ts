/** Run explicitly against a configured database: pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/product-lifecycle.integration.test.ts */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../prisma/client";
import {
	createMockStoreOrder,
	createStoreProduct,
	deleteStoreProduct,
	getAdminStoreProductById,
	type SaveStoreProductInput,
	updateStoreOrderStatus,
	updateStoreProduct,
	updateStoreProductStatus,
	updateStoreProductStock,
} from "../prisma/queries/commerce";

const prefix = `product-lifecycle-${randomUUID()}`;
let categoryId: string;
const orderIds: string[] = [];
before(async () => {
	const category = await db.category.create({
		data: { name: prefix, slug: prefix },
	});
	categoryId = category.id;
});
after(async () => {
	try {
		await db.order.deleteMany({ where: { id: { in: orderIds } } });
		if (categoryId) {
			await db.product.deleteMany({
				where: { categoryId, slug: { startsWith: prefix } },
			});
			await db.category.delete({
				where: { id: categoryId, slug: prefix },
			});
		}
	} finally {
		await db.$disconnect();
	}
});
function input(label: string): SaveStoreProductInput {
	return {
		name: `${prefix}-${label}`,
		slug: `${prefix}-${label}`,
		sku: `${prefix}-${label}`,
		categoryId,
		description: "Lifecycle test",
		shortDescription: "Clear me",
		brand: "Test",
		status: "DRAFT",
		condition: "NEW",
		priceInPesewas: 10000,
		compareAtInPesewas: 12000,
		stockQuantity: 99,
		lowStockThreshold: 5,
		isFeatured: false,
		specifications: { warranty: "one year" },
		imageUrls: ["https://images.unsplash.com/test"],
		variants: [
			{
				name: "Black",
				sku: `${prefix}-${label}-black`,
				priceInPesewas: 10000,
				compareAtInPesewas: 12000,
				stockQuantity: 4,
				attributes: { colour: "Black" },
				isActive: true,
			},
			{
				name: "White",
				sku: `${prefix}-${label}-white`,
				priceInPesewas: 10000,
				stockQuantity: 8,
				attributes: { colour: "White" },
				isActive: false,
			},
		],
	};
}
test("variant stock is derived, pause clears publication, delete cascades", async () => {
	const product = await createStoreProduct(input("lifecycle"));
	assert.equal(product.stockQuantity, 4);
	const live = await updateStoreProductStatus(product.id, "ACTIVE");
	assert.ok(live.publishedAt);
	const paused = await updateStoreProductStatus(product.id, "DRAFT");
	assert.equal(paused.publishedAt, null);
	assert.equal((await deleteStoreProduct(product.id)).status, "deleted");
	assert.equal(
		await db.productVariant.count({ where: { productId: product.id } }),
		0,
	);
	assert.equal(
		await db.productImage.count({ where: { productId: product.id } }),
		0,
	);
});
test("updates clear optional fields and preserve variant identity", async () => {
	const values = input("clearing");
	const product = await createStoreProduct(values);
	const saved = await getAdminStoreProductById(product.id);
	assert.ok(saved);
	await updateStoreProduct(product.id, {
		...values,
		shortDescription: undefined,
		specifications: undefined,
		compareAtInPesewas: undefined,
		variants: saved.variants.map((v) => ({
			...v,
			attributes: { colour: v.name },
			compareAtInPesewas: undefined,
		})),
	});
	const result = await getAdminStoreProductById(product.id);
	assert.ok(result);
	assert.equal(result.compareAtInPesewas, null);
	assert.equal(result.shortDescription, null);
	assert.equal(result.specifications, null);
	assert.deepEqual(
		result.variants.map((v) => v.id),
		saved.variants.map((v) => v.id),
	);
	assert.deepEqual(
		result.variants.map((v) => v.compareAtInPesewas),
		saved.variants.map((v) => v.compareAtInPesewas),
	);
});
test("foreign variant IDs reject atomically", async () => {
	const a = await createStoreProduct(input("owner-a"));
	const b = await createStoreProduct(input("owner-b"));
	const beforeA = await getAdminStoreProductById(a.id);
	const beforeB = await getAdminStoreProductById(b.id);
	assert.ok(beforeA && beforeB);
	await assert.rejects(
		updateStoreProduct(a.id, {
			...input("owner-a"),
			variants: [
				{
					...beforeA.variants[0],
					attributes: { colour: "Black" },
					compareAtInPesewas: 12000,
					id: beforeB.variants[0].id,
				},
			],
		}),
	);
	assert.deepEqual(await getAdminStoreProductById(a.id), beforeA);
	assert.deepEqual(await getAdminStoreProductById(b.id), beforeB);
});
test("aggregate stock cannot be edited independently of variants", async () => {
	const product = await createStoreProduct(input("stock"));
	await assert.rejects(updateStoreProductStock(product.id, 900));
});
test("ordered variants cannot be removed; cancellation restores aggregate stock", async () => {
	const values = {
		...input("ordered"),
		status: "ACTIVE" as const,
		stockQuantity: 4,
	};
	const product = await createStoreProduct(values);
	const saved = await getAdminStoreProductById(product.id);
	assert.ok(saved);
	const variant = saved.variants.find((v) => v.isActive);
	assert.ok(variant);
	const order = await createMockStoreOrder({
		customer: {
			name: prefix,
			email: "test@example.com",
			phone: "0200000000",
		},
		address: { line1: "Test", city: "Accra", region: "Greater Accra" },
		items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
	});
	orderIds.push(order.id);
	assert.equal((await deleteStoreProduct(product.id)).status, "has-orders");
	await assert.rejects(
		updateStoreProduct(product.id, { ...values, variants: [] }),
	);
	await updateStoreOrderStatus(order.id, "CANCELLED", prefix);
	assert.equal(
		(await getAdminStoreProductById(product.id))?.stockQuantity,
		4,
	);
	assert.equal(
		(await db.productVariant.findUnique({ where: { id: variant.id } }))
			?.stockQuantity,
		4,
	);
});

test("single products update stock; variant additions and removals persist atomically", async () => {
	const values = input("single");
	const product = await createStoreProduct({
		...values,
		variants: [],
		stockQuantity: 7,
	});
	assert.equal(
		(await updateStoreProductStock(product.id, 9)).stockQuantity,
		9,
	);
	await updateStoreProduct(product.id, values);
	const withVariants = await getAdminStoreProductById(product.id);
	assert.ok(withVariants);
	assert.equal(withVariants.variants.length, 2);
	assert.equal(withVariants.stockQuantity, 4);
	const kept = withVariants.variants.find((v) => v.isActive);
	assert.ok(kept);
	await updateStoreProduct(product.id, {
		...values,
		variants: [
			{
				...kept,
				attributes: { colour: "Black" },
				compareAtInPesewas: undefined,
				stockQuantity: 6,
			},
		],
	});
	const updated = await getAdminStoreProductById(product.id);
	assert.ok(updated);
	assert.equal(updated.variants.length, 1);
	assert.equal(updated.variants[0].id, kept.id);
	assert.equal(updated.stockQuantity, 6);
	await assert.rejects(
		updateStoreProduct(product.id, {
			...values,
			variants: [
				{
					...kept,
					attributes: { colour: "Black" },
					compareAtInPesewas: undefined,
				},
				{
					...kept,
					attributes: { colour: "White" },
					compareAtInPesewas: undefined,
				},
			],
		}),
	);
	assert.deepEqual(await getAdminStoreProductById(product.id), updated);
});

test("SKUs are automatic, parent-linked, unique, and immutable on edits", async () => {
	const values = input("automatic-sku");
	const first = await createStoreProduct({
		...values,
		name: "Apple iPhone",
		sku: undefined,
		variants: values.variants?.map((variant) => ({
			...variant,
			sku: undefined,
		})),
	});
	const second = await createStoreProduct({
		...values,
		name: "Apple iPhone",
		slug: `${values.slug}-second`,
		sku: "MANUAL",
		variants: [],
	});
	assert.match(first.sku, /^GST-APPLE-IPHONE-[A-F0-9]{32}$/);
	assert.notEqual(first.sku, second.sku);
	assert.notEqual(second.sku, "MANUAL");
	const saved = await getAdminStoreProductById(first.id);
	assert.ok(saved);
	assert.equal(new Set(saved.variants.map((v) => v.sku)).size, 2);
	for (const variant of saved.variants) {
		assert.ok(
			variant.sku.startsWith(
				`${first.sku}-${variant.name.toUpperCase()}-`,
			),
		);
	}
	const variants = saved.variants.map((variant) => ({
		...variant,
		sku: "TAMPERED",
		attributes: { colour: variant.name },
		compareAtInPesewas: undefined,
	}));
	await updateStoreProduct(first.id, {
		...values,
		name: "Renamed phone",
		sku: "TAMPERED",
		variants: [
			...variants,
			{
				name: "Blue",
				priceInPesewas: 10000,
				stockQuantity: 1,
				attributes: { colour: "Blue" },
				isActive: true,
			},
		],
	});
	const updated = await getAdminStoreProductById(first.id);
	assert.ok(updated);
	assert.equal(updated.sku, first.sku);
	for (const original of saved.variants) {
		assert.equal(
			updated.variants.find((v) => v.id === original.id)?.sku,
			original.sku,
		);
	}
	assert.ok(
		updated.variants
			.find((v) => v.name === "Blue")
			?.sku.startsWith(`${first.sku}-BLUE-`),
	);
});
