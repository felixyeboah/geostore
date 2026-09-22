import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveOptionGallery } from "@repo/commerce";

// Importing the server mapper constructs a client; these pure tests never query it.
process.env.DATABASE_URL ??= "file:/tmp/geostore-unused-mapper-test.db";
const mapper = import("./live-catalog");
type ProductInput = Parameters<typeof import("./live-catalog").mapProduct>[0];

function fixture(): ProductInput {
	return {
		id: "phone",
		name: "Phone",
		slug: "phone",
		brand: "Test",
		shortDescription: null,
		description: "Phone",
		sku: "PHONE",
		condition: "NEW",
		priceInPesewas: 100,
		compareAtInPesewas: null,
		stockQuantity: 2,
		isFeatured: false,
		unitsSold: 0,
		publishedAt: null,
		createdAt: new Date(),
		specifications: {},
		category: { slug: "phones" },
		reviews: [],
		images: [
			{ url: "black.jpg", optionAxis: "color", optionValue: "Black" },
			{ url: "blue.jpg", optionAxis: "color", optionValue: "Blue" },
		],
		variants: [
			{
				id: "black",
				name: "Black",
				sku: "BLACK",
				priceInPesewas: 100,
				compareAtInPesewas: null,
				stockQuantity: 0,
				attributes: { color: "Black" },
			},
			{
				id: "blue",
				name: "Blue",
				sku: "BLUE",
				priceInPesewas: 200,
				compareAtInPesewas: null,
				stockQuantity: 2,
				attributes: { color: "Blue" },
			},
		],
	};
}

describe("live product listing images", () => {
	it("uses the available default variant without adding another color to the generic gallery", async () => {
		const product = (await mapper).mapProduct(fixture());
		assert.equal(product.imageUrl, "blue.jpg");
		assert.deepEqual(product.images, []);
		assert.deepEqual(resolveOptionGallery(product, { color: "Black" }), [
			"black.jpg",
		]);
	});

	it("prefers the cheapest available variant rather than stored image order", async () => {
		const input = fixture();
		assert.ok(input.variants?.[0]);
		input.variants[0].stockQuantity = 1;
		input.variants[0].priceInPesewas = 300;
		assert.equal((await mapper).mapProduct(input).imageUrl, "blue.jpg");
	});

	it("keeps a fallback listing cover out of a missing variant's gallery", async () => {
		const input = fixture();
		input.images = input.images.slice(0, 1);
		const product = (await mapper).mapProduct(input);
		assert.equal(product.imageUrl, "black.jpg");
		assert.deepEqual(product.images, []);
		assert.deepEqual(resolveOptionGallery(product, { color: "Blue" }), []);
	});

	it("retains ordinary generic covers and the image-free placeholder", async () => {
		const input = fixture();
		input.images = [{ url: "generic.jpg" }];
		const product = (await mapper).mapProduct(input);
		assert.equal(product.imageUrl, "generic.jpg");
		assert.deepEqual(product.images, ["generic.jpg"]);
		input.images = [];
		assert.equal(
			(await mapper).mapProduct(input).imageUrl,
			"/images/product-placeholder.svg",
		);
	});
});
