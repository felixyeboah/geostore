import assert from "node:assert/strict";
import { test } from "node:test";
import { isReadyToPublish } from "../components/products/product-readiness";
import { productSaveStatus } from "./product-save-intent";

test("saving an existing product respects the selected draft status", () => {
	assert.equal(productSaveStatus("DRAFT", true), "DRAFT");
	assert.equal(productSaveStatus("ACTIVE", true), "ACTIVE");
	assert.equal(productSaveStatus("ARCHIVED", true), "ARCHIVED");
});

test("the new product primary action publishes", () => {
	assert.equal(productSaveStatus("DRAFT", false), "ACTIVE");
});

test("a sold-out product can still be published and edited", () => {
	assert.equal(
		isReadyToPublish(
			{
				name: "Test phone",
				slug: "test-phone",
				brand: "Test brand",
				shortDescription: "A test phone for sale.",
				description:
					"A complete description of the test phone for sale.",
				categoryId: "test-category",
				sku: "TEST-PHONE",
				status: "ACTIVE",
				condition: "NEW",
				priceInPesewas: 10000,
				stockQuantity: 0,
				lowStockThreshold: 5,
				isFeatured: false,
				imageUrls: [
					"https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
				],
				optionMedia: [],
				variants: [],
				specifications: {},
			},
			"single",
		),
		true,
	);
});
