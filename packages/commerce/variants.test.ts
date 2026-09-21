import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StoreProductVariant } from "./types";
import {
	axisValueVariant,
	colourHex,
	defaultVariantSelection,
	isColourAxis,
	normalizeVariantAttributes,
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
