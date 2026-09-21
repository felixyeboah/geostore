export interface StoreCategory {
	name: string;
	slug: string;
	description: string;
	/** One line of shop-floor copy shown under the name on department tiles. */
	blurb?: string;
	imageUrl: string;
}

/**
 * A smart collection maintains its own membership from a rule, so nobody has
 * to remember to update it when the catalogue moves.
 */
export type SmartCollectionRule = "best-selling" | "newest";

/**
 * A cross-department grouping answering "what do I want to do", as opposed to
 * a category, which answers "what kind of thing is it". A product sits in one
 * category and any number of collections.
 */
export interface StoreCollection {
	name: string;
	slug: string;
	description: string;
	imageUrl?: string;
	/** Tile this collection in the landing "shop by need" band. */
	onLanding: boolean;
	/** Manual collections are editor-picked; smart ones follow a rule. */
	kind: "manual" | "smart";
	rule?: SmartCollectionRule;
	limit?: number;
}

/** Whether the listing is for a new, used or refurbished unit. */
export type StoreProductCondition = "NEW" | "USED" | "REFURBISHED";

const CONDITION_LABELS: Record<StoreProductCondition, string> = {
	NEW: "New",
	USED: "Used",
	REFURBISHED: "Refurbished",
};

/** The customer-facing label for a product's condition. */
export function conditionLabel(condition: StoreProductCondition): string {
	return CONDITION_LABELS[condition] ?? condition;
}

export interface StoreProduct {
	id: string;
	name: string;
	slug: string;
	brand: string;
	categorySlug: string;
	shortDescription: string;
	description: string;
	sku: string;
	condition: StoreProductCondition;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	stockQuantity: number;
	imageUrl: string;
	images: string[];
	/**
	 * Media and styling attached to option values — "Colour: Black" carrying
	 * a swatch hex plus its own shots. Selecting a value swaps the gallery.
	 */
	optionMedia?: StoreOptionMedia[];
	rating: number;
	reviewCount: number;
	isFeatured: boolean;
	isNew: boolean;
	/** Manual collections this product belongs to. Smart ones are computed. */
	collectionSlugs?: string[];
	/** Rolling units paid for, denormalised so best sellers is one read. */
	unitsSold: number;
	/** ISO date the product went on sale; orders the "New in" collection. */
	addedAt: string;
	specifications: Record<string, string>;
	reviews?: StoreReview[];
	variants?: StoreProductVariant[];
}

/**
 * Everything one option value owns beyond its name: a swatch colour for the
 * picker chip, and the photographs that make up that value's gallery.
 */
export interface StoreOptionMedia {
	/** The attribute key as stored on the variant, e.g. `"colour"`. */
	axis: string;
	/** The display value, e.g. `"Black"`. */
	value: string;
	/** Swatch colour for colour-like axes — `"#1c1c1e"`. */
	hex?: string;
	/** Shots shown when this value is picked; empty means the base gallery. */
	images: string[];
}

export interface StoreProductVariant {
	id: string;
	name: string;
	sku: string;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	stockQuantity: number;
	attributes: Record<string, string>;
}

export interface StoreReview {
	rating: number;
	title: string;
	body: string;
	createdAt: string;
	customerName: string;
}

export type ProductSort =
	| "featured"
	| "price-asc"
	| "price-desc"
	| "rating"
	| "newest";

export interface ProductFilters {
	query?: string;
	category?: string;
	/** Collection slug. Mutually exclusive with category at the UI layer. */
	collection?: string;
	/** Single brand. */
	brand?: string;
	/** Several brands at once. */
	brands?: string[];
	minPriceInPesewas?: number;
	maxPriceInPesewas?: number;
	inStock?: boolean;
	onSale?: boolean;
	sort?: ProductSort;
}
