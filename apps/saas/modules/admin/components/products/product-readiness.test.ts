import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import { isReadyToPublish } from "./product-readiness";

const product: ProductFormValues = {
	name: "Test phone",
	slug: "test-phone",
	brand: "Test brand",
	shortDescription: "A test phone for sale.",
	description: "A complete description of the test phone for sale.",
	categoryId: "test-category",
	sku: "",
	status: "ACTIVE",
	condition: "NEW",
	priceInPesewas: 10000,
	stockQuantity: 0,
	lowStockThreshold: 5,
	isFeatured: false,
	imageUrls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
	optionMedia: [],
	variants: [],
	specifications: {},
};

test("new products can publish before the server assigns a SKU", () => {
	assert.equal(productFormSchema.shape.sku.safeParse("").success, true);
	assert.equal(isReadyToPublish(product, "single"), true);
});

test("new combinations can publish before the server assigns their SKUs", () => {
	const variant = {
		name: "",
		sku: "",
		priceInPesewas: 10000,
		stockQuantity: 3,
		attributes: { Storage: "256 GB" },
		isActive: true,
	};
	assert.equal(
		productFormSchema.shape.variants.safeParse([variant]).success,
		true,
	);
	assert.equal(
		isReadyToPublish({ ...product, variants: [variant] }, "options"),
		true,
	);
	assert.equal(
		isReadyToPublish(
			{ ...product, variants: [{ ...variant, priceInPesewas: 0 }] },
			"options",
		),
		false,
	);
});
