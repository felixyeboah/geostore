import type { StoreOptionMedia, StoreProductVariant } from "./types";

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
 * The stable identity of an option value across the catalogue — the media
 * rows, the swatch map and the admin editor all key on the same string so a
 * rename in one place does not strand styling in another.
 */
export function optionMediaKey(axis: string, value: string): string {
	return `${axis.trim().toLowerCase()}:${value.trim().toLowerCase()}`;
}

/** Whether `hex` is a `#rgb`/`#rrggbb` string the browser can render. */
export function isHexColour(hex: string): boolean {
	return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());
}

/**
 * The swatch for one option value. An explicit hex saved with the value
 * wins; colour axes still fall back to the built-in name table so a value
 * like "Navy" is swatchable before an admin assigns it media.
 */
export function optionValueHex(
	optionMedia:
		| ReadonlyArray<Pick<StoreOptionMedia, "axis" | "value" | "hex">>
		| undefined,
	axis: string,
	value: string,
): string | undefined {
	const key = optionMediaKey(axis, value);
	const saved = optionMedia?.find(
		(media) => optionMediaKey(media.axis, media.value) === key,
	)?.hex;
	if (saved && isHexColour(saved)) {
		return saved;
	}
	return isColourAxis(axis) ? colourHex(value) : undefined;
}

/**
 * Clean option-media rows before storage: axis keys lowercase to match
 * normalised variant attributes, values and hexes are trimmed, entries with
 * no name are dropped, and the first entry wins when two rows point at the
 * same value.
 */
export function normalizeOptionMedia(
	entries: ReadonlyArray<{
		axis: string;
		value: string;
		hex?: string;
		images: string[];
	}>,
): StoreOptionMedia[] {
	const seen = new Set<string>();
	const normalized: StoreOptionMedia[] = [];
	for (const entry of entries) {
		const axis = entry.axis.trim().toLowerCase();
		const value = entry.value.trim();
		const hex = entry.hex?.trim();
		const images = entry.images.map((url) => url.trim()).filter(Boolean);
		const key = optionMediaKey(axis, value);
		if (!axis || !value || seen.has(key)) {
			continue;
		}
		seen.add(key);
		normalized.push({
			axis,
			value,
			hex: hex && isHexColour(hex) ? hex : undefined,
			images: [...new Set(images)],
		});
	}
	return normalized;
}

/**
 * Rebuilds a product's option media from the two places it is stored:
 * tagged image rows carry the galleries, and the `optionStyles` JSON list
 * (`[{axis, value, hex}]`) carries swatches — including for values that own
 * no images. Entries appear in first-seen order, which is the image sort
 * order the admin arranged.
 */
export function optionMediaFromStorage(
	images: ReadonlyArray<{
		url: string;
		optionAxis?: string | null;
		optionValue?: string | null;
	}>,
	optionStyles: unknown,
): StoreOptionMedia[] {
	const entries = new Map<string, StoreOptionMedia>();
	const entryFor = (axis: string, value: string) => {
		const key = optionMediaKey(axis, value);
		let entry = entries.get(key);
		if (!entry) {
			entry = {
				axis: axis.trim().toLowerCase(),
				value: value.trim(),
				images: [],
			};
			entries.set(key, entry);
		}
		return entry;
	};

	for (const image of images) {
		if (image.optionAxis?.trim() && image.optionValue?.trim()) {
			entryFor(image.optionAxis, image.optionValue).images.push(
				image.url,
			);
		}
	}

	if (Array.isArray(optionStyles)) {
		for (const style of optionStyles as Array<{
			axis?: unknown;
			value?: unknown;
			hex?: unknown;
		}>) {
			if (
				typeof style?.axis !== "string" ||
				typeof style?.value !== "string" ||
				!style.axis.trim() ||
				!style.value.trim()
			) {
				continue;
			}
			const entry = entryFor(style.axis, style.value);
			if (typeof style.hex === "string" && isHexColour(style.hex)) {
				entry.hex = style.hex.trim();
			}
		}
	}

	return [...entries.values()];
}

/**
 * The photographs shown while `selection` is picked.
 *
 * A shot belongs to a value when that value is currently selected — picking
 * Colour "Black" shows every shot Black owns, and picking Storage "1 TB"
 * shows its shots the same way; media is not colour-only. Untagged product
 * images trail the matched set so generic shots (packaging, size guide)
 * stay visible for every choice.
 *
 * When the selection touches an axis that owns media but the picked value
 * has none of its own, only the untagged shots show — displaying another
 * value's photos would show the buyer the wrong thing. With no option media
 * at all the product gallery is exactly `images`.
 */
export function resolveOptionGallery(
	product: {
		images: string[];
		optionMedia?: ReadonlyArray<
			Pick<StoreOptionMedia, "axis" | "value" | "images">
		>;
	},
	selection: Record<string, string>,
): string[] {
	const media = product.optionMedia ?? [];
	if (media.length === 0) {
		return product.images;
	}

	const picks = new Map(
		Object.entries(selection)
			.map(
				([axis, value]) =>
					[
						axis.trim().toLowerCase(),
						value.trim().toLowerCase(),
					] as const,
			)
			.filter(([, value]) => value !== ""),
	);
	const matches = (mediaEntry: { axis: string; value: string }) =>
		picks.get(mediaEntry.axis.trim().toLowerCase()) ===
		mediaEntry.value.trim().toLowerCase();
	const tagged = media
		.filter(matches)
		.flatMap((mediaEntry) => mediaEntry.images);

	if (tagged.length > 0) {
		return [...new Set([...tagged, ...product.images])];
	}
	// The picked value owns nothing but its axis does — keep the honest
	// generic shots rather than another value's photos.
	if (
		media.some((mediaEntry) =>
			picks.has(mediaEntry.axis.trim().toLowerCase()),
		)
	) {
		return product.images;
	}
	return [
		...new Set([
			...product.images,
			...media.flatMap((entry) => entry.images),
		]),
	];
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
