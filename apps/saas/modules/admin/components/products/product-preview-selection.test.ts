import assert from "node:assert/strict";
import { test } from "node:test";
import { previewVariantSelection } from "./product-preview-selection";

function variant(
	storage: string,
	price: number,
	stock: number,
	isActive = true,
) {
	return {
		name: storage,
		sku: "",
		priceInPesewas: price,
		stockQuantity: stock,
		isActive,
		attributes: { Colour: "Black", Storage: storage },
	};
}
const variants = [
	variant("1 TB", 1740000, 2),
	variant("128 GB", 1500000, 0),
	variant("256 GB", 1680000, 3),
	variant("64 GB", 1000000, 2, false),
];

test("preview starts at the cheapest active in-stock configuration, independent of name ordering", () => {
	assert.deepEqual(previewVariantSelection(variants, {}), {
		Colour: "Black",
		Storage: "256 GB",
	});
});
test("explicit admin choices survive price and stock changes", () => {
	assert.deepEqual(
		previewVariantSelection(variants, { Colour: "Black", Storage: "1 TB" }),
		{ Colour: "Black", Storage: "1 TB" },
	);
	assert.equal(
		previewVariantSelection(variants, { Storage: "128 GB" }).Storage,
		"128 GB",
	);
});
test("removed choices fall back to storefront defaults; sold-out products use cheapest active option", () => {
	assert.equal(
		previewVariantSelection(variants, { Storage: "removed" }).Storage,
		"256 GB",
	);
	assert.equal(
		previewVariantSelection(
			variants.map((row) => ({ ...row, stockQuantity: 0 })),
			{},
		).Storage,
		"128 GB",
	);
});
