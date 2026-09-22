import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCartItemImage } from "./CartProvider";

function fixture(): Parameters<typeof getCartItemImage>[0] {
	return {
		imageUrl: "black-cover.jpg",
		images: [],
		optionMedia: [
			{ axis: "color", value: "Black", images: ["black.jpg"] },
			{ axis: "color", value: "Blue", images: ["blue.jpg"] },
		],
		variants: [
			{
				id: "blue-512",
				name: "Blue 512GB",
				sku: "BLUE-512",
				priceInPesewas: 200,
				stockQuantity: 3,
				attributes: { color: "Blue", storage: "512GB" },
			},
			{
				id: "white-256",
				name: "White 256GB",
				sku: "WHITE-256",
				priceInPesewas: 100,
				stockQuantity: 2,
				attributes: { color: "White", storage: "256GB" },
			},
		],
	};
}

describe("selected cart and confirmation image", () => {
	it("uses the purchased color instead of the listing cover without changing the variant", () => {
		const product = fixture();
		const snapshot = structuredClone(product);
		assert.equal(getCartItemImage(product, "blue-512"), "blue.jpg");
		assert.deepEqual(product, snapshot);
	});
	it("shows a placeholder rather than another color when selected media is missing", () => {
		assert.equal(
			getCartItemImage(fixture(), "white-256"),
			"/images/product-placeholder.svg",
		);
	});
	it("uses genuine generic media when selected media is missing", () => {
		const product = fixture();
		product.images = ["generic.jpg"];
		assert.equal(getCartItemImage(product, "white-256"), "generic.jpg");
	});
	it("retains the cover for products without option media or an explicit variant", () => {
		const product = fixture();
		assert.equal(getCartItemImage(product), "black-cover.jpg");
		product.optionMedia = [];
		assert.equal(getCartItemImage(product, "blue-512"), "black-cover.jpg");
	});
});
