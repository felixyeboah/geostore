import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StoreProductVariant } from "./types";
import {
	axisValueVariant,
	colourHex,
	defaultVariantSelection,
	isColourAxis,
	normalizeOptionMedia,
	normalizeVariantAttributes,
	optionMediaKey,
	optionValueHex,
	resolveOptionGallery,
	resolveVariant,
	variantAxes,
	variantDisplayName,
} from "./variants";

function variant(
	attributes: Record<string, string>,
	overrides: Partial<StoreProductVariant> = {},
): StoreProductVariant {
	return {
		id: overrides.id ?? `v-${JSON.stringify(attributes)}`,
		name: "",
		sku: "SKU",
		priceInPesewas: 100,
		stockQuantity: 1,
		attributes,
		...overrides,
	};
}

const PHONE_VARIANTS = [
	variant({ colour: "Black", size: "128 GB" }, { id: "b-128" }),
	variant({ colour: "Black", size: "256 GB" }, { id: "b-256" }),
	variant({ colour: "Blue", size: "128 GB" }, { id: "bl-128" }),
	// "Blue · 256 GB" deliberately absent — an unavailable combination.
	variant(
		{ colour: "Red", size: "128 GB" },
		{ id: "r-128", stockQuantity: 0 },
	),
];

describe("variantAxes", () => {
	it("derives axes and distinct values in first-seen order", () => {
		assert.deepEqual(variantAxes(PHONE_VARIANTS), [
			{
				key: "colour",
				label: "Colour",
				values: ["Black", "Blue", "Red"],
			},
			{ key: "size", label: "Size", values: ["128 GB", "256 GB"] },
		]);
	});

	it("returns no axes when no variant carries attributes", () => {
		assert.deepEqual(variantAxes([variant({}), variant({})]), []);
	});

	it("skips blank keys and values", () => {
		assert.deepEqual(variantAxes([variant({ colour: "  ", "": "x" })]), []);
	});
});

describe("resolveVariant", () => {
	it("returns the variant matching every pick", () => {
		assert.equal(
			resolveVariant(PHONE_VARIANTS, { colour: "Blue", size: "128 GB" })
				?.id,
			"bl-128",
		);
	});

	it("returns undefined for a combination nobody stocks", () => {
		assert.equal(
			resolveVariant(PHONE_VARIANTS, { colour: "Blue", size: "256 GB" }),
			undefined,
		);
	});

	it("returns undefined for an empty selection", () => {
		assert.equal(resolveVariant(PHONE_VARIANTS, {}), undefined);
	});
});

describe("axisValueVariant", () => {
	it("resolves the hypothetical pick while keeping the rest", () => {
		const selection = { colour: "Black", size: "128 GB" };
		assert.equal(
			axisValueVariant(PHONE_VARIANTS, selection, "size", "256 GB")?.id,
			"b-256",
		);
		// Blue + 256 GB does not exist — the button for it disables.
		assert.equal(
			axisValueVariant(PHONE_VARIANTS, selection, "colour", "Blue")?.id,
			"bl-128",
		);
	});
});

describe("defaultVariantSelection", () => {
	it("ignores name ordering and sold-out bargains when choosing the entry price", () => {
		const variants = [
			variant({ storage: "1 TB" }, { priceInPesewas: 300 }),
			variant(
				{ storage: "128 GB" },
				{ priceInPesewas: 100, stockQuantity: 0 },
			),
			variant({ storage: "256 GB" }, { priceInPesewas: 200 }),
		];
		assert.deepEqual(defaultVariantSelection(variants), {
			storage: "256 GB",
		});
		assert.deepEqual(
			defaultVariantSelection(
				variants.map((row) => ({ ...row, stockQuantity: 0 })),
			),
			{ storage: "128 GB" },
		);
		assert.deepEqual(defaultVariantSelection([]), {});
	});
	it("opens on the first in-stock variant's attributes", () => {
		assert.deepEqual(defaultVariantSelection(PHONE_VARIANTS), {
			colour: "Black",
			size: "128 GB",
		});
		assert.deepEqual(
			defaultVariantSelection([
				variant({ colour: "Red" }, { stockQuantity: 0 }),
				variant({ colour: "Green" }, { stockQuantity: 3 }),
			]),
			{ colour: "Green" },
		);
	});
});

describe("variantDisplayName", () => {
	it("prefers an explicit name", () => {
		assert.equal(
			variantDisplayName(variant({ colour: "Black" }, { name: "Pro" })),
			"Pro",
		);
	});

	it("joins attribute values when the name is blank", () => {
		assert.equal(
			variantDisplayName(variant({ colour: "Black", size: "256 GB" })),
			"Black · 256 GB",
		);
	});

	it("falls back to the SKU when there is nothing else", () => {
		assert.equal(
			variantDisplayName(variant({}, { sku: "JBL-BLK" })),
			"JBL-BLK",
		);
	});
});

describe("colour helpers", () => {
	it("detects colour axes in either spelling", () => {
		assert.equal(isColourAxis("colour"), true);
		assert.equal(isColourAxis("Color"), true);
		assert.equal(isColourAxis("size"), false);
	});

	it("maps named colours, accepts hex values, and refuses the rest", () => {
		assert.equal(colourHex("Navy"), "#1e3a5f");
		assert.equal(colourHex("#ff00aa"), "#ff00aa");
		assert.equal(colourHex("Midnight Mist"), undefined);
	});
});

describe("normalizeVariantAttributes", () => {
	it("trims, lowercases keys, drops blanks, and keeps first of a duplicate", () => {
		assert.deepEqual(
			normalizeVariantAttributes({
				" Colour ": " Black ",
				size: "256 GB",
				"": "orphan value",
				"weight ": "  ",
				colour: "ignored duplicate",
			}),
			{ colour: "Black", size: "256 GB" },
		);
	});
});

describe("option media", () => {
	it("keys axis and value case-insensitively", () => {
		assert.equal(optionMediaKey(" Colour ", "Black"), "colour:black");
		assert.equal(
			optionMediaKey("colour", "NATURAL TITANIUM"),
			"colour:natural titanium",
		);
	});

	it("prefers a saved hex over the colour name table", () => {
		const media = [{ axis: "colour", value: "Burgundy", hex: "#6d1a36" }];
		assert.equal(optionValueHex(media, "colour", "Burgundy"), "#6d1a36");
		assert.equal(optionValueHex(media, "colour", "Navy"), "#1e3a5f");
		assert.equal(optionValueHex(media, "storage", "1 TB"), undefined);
		assert.equal(
			optionValueHex(
				[{ axis: "colour", value: "Odd", hex: "not-a-hex" }],
				"colour",
				"Odd",
			),
			undefined,
		);
	});

	it("normalizes rows: lowercase axis, deduped, hex validated", () => {
		assert.deepEqual(
			normalizeOptionMedia([
				{
					axis: " Colour ",
					value: " Black ",
					hex: "#111111",
					images: [" a.jpg ", "a.jpg", ""],
				},
				{ axis: "colour", value: "BLACK", hex: "#222222", images: [] },
				{
					axis: "colour",
					value: "",
					hex: "#333333",
					images: ["x.jpg"],
				},
				{ axis: "size", value: "L", hex: "blue", images: [] },
			]),
			[
				{
					axis: "colour",
					value: "Black",
					hex: "#111111",
					images: ["a.jpg"],
				},
				{ axis: "size", value: "L", hex: undefined, images: [] },
			],
		);
	});
});

describe("resolveOptionGallery", () => {
	const product = {
		images: ["generic-1.jpg", "generic-2.jpg"],
		optionMedia: [
			{
				axis: "colour",
				value: "Black",
				images: ["black-1.jpg", "black-2.jpg"],
			},
			{ axis: "colour", value: "White", images: ["white-1.jpg"] },
			{ axis: "strap", value: "Leather", images: ["leather-1.jpg"] },
			{ axis: "storage", value: "1 TB", images: [] },
		],
	};

	it("swaps to the picked colour's shots, untagged shots trailing", () => {
		assert.deepEqual(
			resolveOptionGallery(product, {
				colour: "Black",
				storage: "256 GB",
			}),
			["black-1.jpg", "black-2.jpg", "generic-1.jpg", "generic-2.jpg"],
		);
	});

	it("unions media across axes and dedupes", () => {
		assert.deepEqual(
			resolveOptionGallery(product, {
				colour: "Black",
				strap: "Leather",
			}),
			[
				"black-1.jpg",
				"black-2.jpg",
				"leather-1.jpg",
				"generic-1.jpg",
				"generic-2.jpg",
			],
		);
	});

	it("keeps only generic shots when the picked value owns nothing", () => {
		assert.deepEqual(
			resolveOptionGallery(product, {
				colour: "Missing",
				storage: "1 TB",
			}),
			["generic-1.jpg", "generic-2.jpg"],
		);
	});

	it("returns every shot when no selected axis owns media", () => {
		assert.deepEqual(resolveOptionGallery(product, { size: "L" }), [
			"generic-1.jpg",
			"generic-2.jpg",
			"black-1.jpg",
			"black-2.jpg",
			"white-1.jpg",
			"leather-1.jpg",
		]);
	});

	it("returns the base gallery when the product has no option media", () => {
		assert.deepEqual(
			resolveOptionGallery({ images: ["a.jpg"] }, { colour: "Black" }),
			["a.jpg"],
		);
	});
});
