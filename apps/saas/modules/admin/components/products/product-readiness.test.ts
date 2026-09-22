import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import { isReadyToPublish, productReadiness } from "./product-readiness";

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

const optionProduct: ProductFormValues = {
	...product,
	imageUrls: [],
	variants: [
		{
			name: "White",
			sku: "",
			priceInPesewas: 10000,
			stockQuantity: 3,
			attributes: { Colour: "White" },
			isActive: true,
		},
	],
	optionMedia: [
		{ axis: " colour ", value: " WHITE ", images: product.imageUrls },
	],
};
function photoReady(values: ProductFormValues) {
	return productReadiness(values, "options").find(
		(rule) => rule.id === "photo",
	)?.ok;
}

test("invalid photo URLs retain their specific error without a masking missing-photo error", () => {
	for (const values of [
		{ ...product, imageUrls: ["https://unapproved.example/photo.jpg"] },
		{
			...optionProduct,
			optionMedia: [
				{
					axis: "Colour",
					value: "White",
					images: ["https://unapproved.example/photo.jpg"],
				},
			],
		},
	]) {
		const result = productFormSchema.safeParse(values);
		assert.equal(result.success, false);
		if (result.success) {
			throw new Error("Invalid host must be rejected");
		}
		assert.ok(
			result.error.issues.some((issue) =>
				issue.message.includes("image host is not allowed"),
			),
		);
		assert.ok(
			!result.error.issues.some((issue) =>
				issue.message.includes("Add a product image"),
			),
		);
	}
});

test("option-only photos support saving and publishing a matching active variant", () => {
	assert.equal(productFormSchema.safeParse(optionProduct).success, true);
	assert.equal(photoReady(optionProduct), true);
	assert.equal(isReadyToPublish(optionProduct, "options"), true);
	assert.equal(
		productReadiness(optionProduct, "options").find(
			(rule) => rule.id === "photo",
		)?.detail,
		"1",
	);
});

test("missing, empty, orphaned and inactive-only option galleries cannot replace a product photo", () => {
	const invalid: ProductFormValues[] = [
		{ ...optionProduct, optionMedia: [] },
		{
			...optionProduct,
			optionMedia: [{ axis: "Colour", value: "White", images: [] }],
		},
		{
			...optionProduct,
			optionMedia: [
				{ axis: "Colour", value: "Black", images: product.imageUrls },
			],
		},
		{
			...optionProduct,
			optionMedia: [
				{ axis: "Storage", value: "White", images: product.imageUrls },
			],
		},
		{ ...optionProduct, variants: [] },
		{
			...optionProduct,
			variants: optionProduct.variants.map((variant) => ({
				...variant,
				isActive: false,
			})),
		},
	];
	for (const values of invalid) {
		const parsed = productFormSchema.safeParse(values);
		assert.equal(parsed.success, false);
		if (!parsed.success) {
			assert.ok(
				parsed.error.issues.some(
					(issue) => issue.path[0] === "imageUrls",
				),
			);
		}
		assert.equal(photoReady(values), false);
	}
});

test("unapproved option image hosts still reject even beside an allowed photo", () => {
	const values: ProductFormValues = {
		...optionProduct,
		imageUrls: product.imageUrls,
		optionMedia: [
			{
				axis: "Colour",
				value: "White",
				images: ["https://unapproved.example/image.png"],
			},
		],
	};
	assert.equal(productFormSchema.safeParse(values).success, false);
	assert.equal(photoReady(values), false);
});

test("general photos remain sufficient for a single product or unmatched option media", () => {
	const values: ProductFormValues = {
		...optionProduct,
		imageUrls: product.imageUrls,
		variants: [],
	};
	assert.equal(productFormSchema.safeParse(values).success, true);
	assert.equal(photoReady(values), true);
});
