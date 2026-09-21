import type { StoreProductVariant } from "./types";

/**
 * Variant options, shared between the admin editor and the storefront.
 *
 * A variant's `attributes` record is free-form — `{colour: "Black", size:
 * "256 GB"}` — because the catalogue sells phones as much as kettles and the
 * axes cannot be a fixed enum. The helpers here derive the axes a buyer picks
 * from, resolve a pick back to a variant, and name a variant the admin left
 * unnamed.
 */

/** One selectable dimension of a product's variants — Colour, Size, … */
export interface VariantAxis {
	/** The attribute key as stored on the variant, e.g. `"colour"`. */
	key: string;
	/** Display label — the key sentence-cased. */
	label: string;
	/** Distinct values in the order they first appear across variants. */
	values: string[];
}

function axisLabel(key: string): string {
	const spaced = key.replace(/[_-]+/g, " ").trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The pickable axes for a product, in first-seen order. Variants with no
 * attributes contribute nothing — a product that mixes attributed and plain
 * variants still only offers the axes both sides can answer.
 */
export function variantAxes(
	variants: ReadonlyArray<Pick<StoreProductVariant, "attributes">>,
): VariantAxis[] {
	const axes = new Map<
		string,
		{ label: string; seen: Set<string>; values: string[] }
	>();

	for (const variant of variants) {
		for (const [rawKey, rawValue] of Object.entries(
			variant.attributes ?? {},
		)) {
			const key = rawKey.trim();
			const value = rawValue.trim();
			if (!key || !value) {
				continue;
			}
			let axis = axes.get(key);
			if (!axis) {
				axis = { label: axisLabel(key), seen: new Set(), values: [] };
				axes.set(key, axis);
			}
			if (!axis.seen.has(value)) {
				axis.seen.add(value);
				axis.values.push(value);
			}
		}
	}

	return [...axes.entries()].map(([key, axis]) => ({
		key,
		label: axis.label,
		values: axis.values,
	}));
}

/** The single variant matching every selected axis value, if one exists. */
export function resolveVariant(
	variants: StoreProductVariant[],
	selection: Record<string, string>,
): StoreProductVariant | undefined {
	const picks = Object.entries(selection).filter(([, value]) => value !== "");
	if (picks.length === 0) {
		return undefined;
	}
	return variants.find((variant) =>
		picks.every(([key, value]) => variant.attributes?.[key] === value),
	);
}

/**
 * The variant a buyer would get by picking `value` on `axisKey` while keeping
 * the rest of the current selection — `undefined` when no such combination
 * exists, which is what disables an option button.
 */
export function axisValueVariant(
	variants: StoreProductVariant[],
	selection: Record<string, string>,
	axisKey: string,
	value: string,
): StoreProductVariant | undefined {
	return resolveVariant(variants, { ...selection, [axisKey]: value });
}

/**
 * The pick the picker opens on: the first in-stock variant's attributes, so
 * the default state is always something a buyer can actually add to the bag.
 */
export function defaultVariantSelection(
	variants: StoreProductVariant[],
): Record<string, string> {
	const first =
		variants.find((variant) => variant.stockQuantity > 0) ?? variants[0];
	return { ...(first?.attributes ?? {}) };
}

/**
 * Clean an admin-entered attributes record before storage: trims keys and
 * values, drops blank rows, lowercases keys so "Colour" and "colour" stay on
 * one axis, and keeps the first entry when two rows end up with the same
 * option name.
 */
export function normalizeVariantAttributes(
	attributes: Record<string, string>,
): Record<string, string> {
	const normalized: Record<string, string> = {};
	for (const [rawKey, rawValue] of Object.entries(attributes)) {
		const key = rawKey.trim().toLowerCase();
		const value = rawValue.trim();
		if (!key || !value || key in normalized) {
			continue;
		}
		normalized[key] = value;
	}
	return normalized;
}

/** What the cart, checkout and order records call a variant. */
export function variantDisplayName(
	variant: Pick<StoreProductVariant, "name" | "sku" | "attributes">,
): string {
	const name = variant.name.trim();
	if (name) {
		return name;
	}
	const values = Object.values(variant.attributes ?? {})
		.map((value) => value.trim())
		.filter(Boolean);
	return values.join(" · ") || variant.sku;
}

/** Whether an axis is a colour, so the picker renders swatches not pills. */
export function isColourAxis(axisKey: string): boolean {
	return /colou?r/i.test(axisKey);
}

const COLOUR_HEX: Record<string, string> = {
	black: "#1c1c1e",
	white: "#f7f7f4",
	blue: "#2563eb",
	navy: "#1e3a5f",
	red: "#dc2626",
	green: "#16a34a",
	pink: "#ec4899",
	purple: "#9333ea",
	yellow: "#eab308",
	orange: "#ea580c",
	brown: "#795548",
	grey: "#6b7280",
	gray: "#6b7280",
	silver: "#c3c7cc",
	gold: "#d4af37",
	beige: "#e8dcc4",
	cream: "#f5f0dc",
	teal: "#0d9488",
	maroon: "#800000",
	charcoal: "#374151",
};

/**
 * The swatch colour for a colour-axis value. Named colours map to hex; an
 * admin can also paste a `#hex` as the value itself. Anything unrecognised
 * falls back to `undefined` and the picker renders a labelled chip instead.
 */
export function colourHex(value: string): string | undefined {
	const key = value.trim().toLowerCase();
	if (COLOUR_HEX[key]) {
		return COLOUR_HEX[key];
	}
	if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(key)) {
		return key;
	}
	return undefined;
}

/**
 * Option names admins reach for most, offered as combobox suggestions in the
 * product form. Free text still works — this is a shortcut, not a whitelist.
 */
export const COMMON_OPTION_AXES = [
	"Colour",
	"Size",
	"Storage",
	"Material",
	"Capacity",
	"Finish",
	"RAM",
	"Case",
	"Strap",
	"Voltage",
];

/**
 * Suggestions for the value half of an option pair, keyed by the normalised
 * axis name. A combobox shows these when the axis is a known one; unknown
 * axes just get a plain input.
 */
export const OPTION_VALUE_SUGGESTIONS: Record<string, string[]> = {
	colour: [
		"Black",
		"White",
		"Silver",
		"Graphite",
		"Midnight",
		"Starlight",
		"Blue",
		"Navy",
		"Red",
		"Green",
		"Purple",
		"Pink",
		"Gold",
		"Cream",
		"Teal",
	],
	size: [
		"XS",
		"S",
		"M",
		"L",
		"XL",
		"XXL",
		"40 mm",
		"41 mm",
		"44 mm",
		"45 mm",
		"46 mm",
	],
	storage: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"],
	capacity: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"],
	material: [
		"Aluminium",
		"Stainless steel",
		"Titanium",
		"Leather",
		"Silicone",
		"Fabric",
		"Plastic",
	],
	finish: ["Matte", "Glossy", "Brushed", "Polished"],
	ram: ["4 GB", "8 GB", "16 GB", "24 GB", "32 GB"],
	case: ["40 mm", "41 mm", "42 mm", "44 mm", "45 mm", "46 mm"],
	strap: ["Sport band", "Leather", "Milanese loop", "Braided solo loop"],
	voltage: ["110 V", "220 V", "110–240 V"],
};
