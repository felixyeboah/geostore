/**
 * The catalogue of landing page sections.
 *
 * Each entry is one band of the marketing home page. The component lives in
 * apps/marketing; this file is only the contract: what the band is called,
 * what an editor may change about it, and where it sits by default.
 *
 * Every field is an OVERRIDE. A blank or missing value falls back to the copy
 * shipped in the translation files, so a half-filled row can never leave a
 * band of the page empty. That is what makes the editor safe to hand over.
 */

/**
 * What an editor is choosing.
 *
 * `text` and `textarea` store the words themselves. The rest store a
 * reference: `image` a URL, `product` a product id, `brands` a JSON array of
 * brand names. A reference is resolved when the page renders, so a product
 * featured on the front page follows its own price and photograph rather than
 * freezing a copy of them.
 */
export type LandingFieldType =
	| "text"
	| "textarea"
	| "image"
	| "product"
	| "brands";

export interface LandingFieldDefinition {
	/**
	 * Key inside the section's `settings` object. May be dotted, to reach copy
	 * that is nested in the shipped set — `card.product`, say.
	 */
	key: string;
	label: string;
	type: LandingFieldType;
	/** Sits under the input when the field needs explaining. */
	help?: string;
}

export interface LandingSectionDefinition {
	key: string;
	name: string;
	/** One line describing what a shopper actually sees. */
	description: string;
	/**
	 * Sections the page cannot do without. Their copy is editable and they can
	 * be moved, but the visibility toggle is disabled.
	 */
	pinned?: boolean;
	/** Position before anyone has reordered anything. */
	defaultSortOrder: number;
	fields: LandingFieldDefinition[];
}

const text = (
	key: string,
	label: string,
	help?: string,
): LandingFieldDefinition => ({ key, label, type: "text", help });

const paragraph = (
	key: string,
	label: string,
	help?: string,
): LandingFieldDefinition => ({ key, label, type: "textarea", help });

const image = (
	key: string,
	label: string,
	help?: string,
): LandingFieldDefinition => ({ key, label, type: "image", help });

const product = (
	key: string,
	label: string,
	help?: string,
): LandingFieldDefinition => ({ key, label, type: "product", help });

const brands = (
	key: string,
	label: string,
	help?: string,
): LandingFieldDefinition => ({ key, label, type: "brands", help });

/**
 * Reads a `brands` field back out.
 *
 * The settings column is a flat map of strings, so a list is stored as JSON in
 * one of them. A malformed or half-written value yields an empty list, which
 * every caller treats as "use the shipped set" — the same contract the text
 * fields have.
 */
export function parseBrandList(value: string | undefined): string[] {
	if (!value?.trim()) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed)
			? parsed.filter(
					(entry): entry is string =>
						typeof entry === "string" && entry.trim().length > 0,
				)
			: [];
	} catch {
		return [];
	}
}

export function serialiseBrandList(brands: string[]): string {
	return brands.length > 0 ? JSON.stringify(brands) : "";
}

export const LANDING_SECTIONS: LandingSectionDefinition[] = [
	{
		key: "hero",
		name: "Hero",
		description:
			"The opening statement, its supporting line and the two buttons.",
		pinned: true,
		defaultSortOrder: 0,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("titleLine1", "Headline, first line"),
			text("titleLine2", "Headline, second line"),
			text("titleAccent", "Headline, accented words"),
			text("titleLine3", "Headline, last line"),
			paragraph("subtitle1", "Supporting line"),
			paragraph("subtitle2", "Supporting line, continued"),
			text("primaryCta", "Main button"),
			text("secondaryCta", "Second button"),
			product(
				"card.productId",
				"Spotlight product",
				"The product on the card beside the headline. It takes its name, photograph and link from the catalogue, so a price or photo change follows automatically.",
			),
			image(
				"card.image",
				"Spotlight image",
				"Overrides the product\u2019s own photograph on this card. Leave it empty to use the catalogue image.",
			),
			text("card.eyebrow", "Card eyebrow"),
			text("card.spotlight", "Card label"),
			text(
				"card.product",
				"Card product name",
				"Only used when no spotlight product is chosen.",
			),
		],
	},
	{
		key: "trust",
		name: "Delivery & payment strip",
		description:
			"The thin band of reassurances under the hero: delivery, payment, support and advice.",
		defaultSortOrder: 1,
		fields: [],
	},
	{
		key: "brands",
		name: "Brand line",
		description: "The sentence naming the brands you stock.",
		defaultSortOrder: 2,
		fields: [
			brands(
				"brandList",
				"Brands shown",
				"Chosen from the brands your catalogue actually carries. Leave it empty for the set the page ships with.",
			),
			text("line1", "First line"),
			text("line2", "Second line"),
		],
	},
	{
		key: "categories",
		name: "Category rail",
		description:
			"The scrolling row of picture tiles linking to departments.",
		defaultSortOrder: 3,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title", "Headline"),
			text("link", "Link text"),
		],
	},
	{
		key: "edit",
		name: "The edit",
		description: "The large feature block with the gift card panel.",
		defaultSortOrder: 4,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title", "Headline"),
			text("link", "Link text"),
			text("price", "Price line"),
			paragraph("note", "Small print"),
		],
	},
	{
		key: "products",
		name: "Product rail",
		description:
			"A row of products. Still the shipped set, not your catalogue \u2014 its prices do not follow yours.",
		defaultSortOrder: 5,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title", "Headline"),
			text("link", "Link text"),
		],
	},
	{
		key: "gaming",
		name: "Gaming feature",
		description: "The full-width gaming band with its own image.",
		defaultSortOrder: 6,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("subtitle1", "Supporting line"),
			paragraph("subtitle2", "Supporting line, continued"),
			text("cta", "Button"),
			text("link", "Link text"),
			text("caption", "Image caption"),
		],
	},
	{
		key: "computing",
		name: "Computing feature",
		description: "Laptops and desk kit, with the spec list beside it.",
		defaultSortOrder: 7,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title", "Headline"),
			text("link", "Link text"),
			text("listEyebrow", "List heading"),
			text("explore", "Explore link"),
		],
	},
	{
		key: "kitchen",
		name: "Kitchen bundle",
		description: "The bundle offer band.",
		defaultSortOrder: 8,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("description", "Description"),
			text("cta", "Main button"),
			text("secondary", "Second button"),
		],
	},
	{
		key: "appliances",
		name: "Appliances feature",
		description: "The home appliances band.",
		defaultSortOrder: 9,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("description", "Description"),
			text("cta", "Button"),
			text("note", "Small print"),
			text("badge", "Corner flag"),
		],
	},
	{
		key: "departments",
		name: "Department index",
		description:
			"A plain text list of departments. Still the shipped set, not the ones you manage.",
		defaultSortOrder: 10,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("description", "Description"),
			text("link", "Link text"),
		],
	},
	{
		key: "needs",
		name: "Shop by need",
		description:
			"Picture tiles. Still the shipped set, not the collections you manage.",
		defaultSortOrder: 11,
		fields: [text("eyebrow", "Eyebrow"), text("title", "Headline")],
	},
	{
		key: "about",
		name: "About the shop",
		description: "Who you are, with the three supporting points.",
		defaultSortOrder: 12,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("description", "Description"),
		],
	},
	{
		key: "newsletter",
		name: "Newsletter signup",
		description: "The email capture band.",
		defaultSortOrder: 13,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title", "Headline"),
			paragraph("subtitle", "Supporting line"),
			text("submit", "Button"),
		],
	},
	{
		key: "enquiry",
		name: "Enquiry band",
		description: "The closing 'ask us to source it' band.",
		defaultSortOrder: 14,
		fields: [
			text("eyebrow", "Eyebrow"),
			text("title1", "Headline, first line"),
			text("title2", "Headline, second line"),
			paragraph("subtitle", "Supporting line"),
			text("cta", "Button"),
		],
	},
];

export function getLandingSectionDefinition(
	key: string,
): LandingSectionDefinition | undefined {
	return LANDING_SECTIONS.find((section) => section.key === key);
}

/** Only strings survive; anything else in the column is ignored. */
export function parseLandingSettings(value: unknown): Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(value).flatMap(([key, entry]) =>
			typeof entry === "string" && entry.trim().length > 0
				? [[key, entry]]
				: [],
		),
	);
}

/**
 * An override if the editor set one, otherwise the shipped copy. Whitespace
 * counts as unset, so clearing a field restores the default rather than
 * leaving a gap.
 */
export function landingText(
	settings: Record<string, string>,
	field: string,
	fallback: string,
): string {
	const override = settings[field];
	return override && override.trim().length > 0 ? override : fallback;
}
