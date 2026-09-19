import type {
	ProductSort,
	StoreCollection,
	StoreProduct,
} from "@repo/commerce";

const PRODUCT_SORTS: ProductSort[] = [
	"featured",
	"newest",
	"price-asc",
	"price-desc",
	"rating",
];

export function parseSort(value?: string): ProductSort {
	return PRODUCT_SORTS.includes(value as ProductSort)
		? (value as ProductSort)
		: "featured";
}

export function listBrands(products: StoreProduct[]): string[] {
	return [...new Set(products.map((product) => product.brand))].sort(
		(left, right) => left.localeCompare(right),
	);
}

/**
 * Fixed price bands rather than a slider: they survive a page load, need no
 * JavaScript, and a shopper can hit one in a single tap. Amounts are pesewas.
 */
export const PRICE_BRACKETS = [
	{ id: "0-50000", label: "Under GH₵ 500", min: 0, max: 50_000 },
	{ id: "50000-200000", label: "GH₵ 500 – 2,000", min: 50_000, max: 200_000 },
	{
		id: "200000-500000",
		label: "GH₵ 2,000 – 5,000",
		min: 200_000,
		max: 500_000,
	},
	{ id: "500000-", label: "Over GH₵ 5,000", min: 500_000, max: undefined },
] as const;

export type PriceBracketId = (typeof PRICE_BRACKETS)[number]["id"];

export function parsePriceBracket(value?: string) {
	return PRICE_BRACKETS.find((bracket) => bracket.id === value);
}

/** Comma-separated in the URL so several brands compose into one link. */
export function parseBrands(value?: string): string[] {
	return (value ?? "")
		.split(",")
		.map((brand) => brand.trim())
		.filter(Boolean);
}

export function toggleBrand(current: string[], brand: string): string[] {
	return current.includes(brand)
		? current.filter((item) => item !== brand)
		: [...current, brand];
}

export interface CatalogueSearchParams {
	q?: string;
	/** Collection slug. Department lives in the route, not here. */
	collection?: string;
	brand?: string;
	sort?: string;
	price?: string;
	stock?: string;
	sale?: string;
}

const PARAM_KEYS = [
	"q",
	"collection",
	"brand",
	"sort",
	"price",
	"stock",
	"sale",
] as const;

export function catalogueTitle(
	fallback: string,
	params: { q?: string; brand?: string; collection?: string },
	collections: StoreCollection[] = [],
): string {
	if (params.q) {
		return `Results for “${params.q}”`;
	}

	const collection = collections.find(
		(entry) => entry.slug === params.collection,
	);
	if (collection) {
		return collection.name;
	}

	const brands = parseBrands(params.brand);
	if (brands.length === 1) {
		return brands[0];
	}

	return fallback;
}

/** True when anything narrows the catalogue beyond the current department. */
export function hasActiveFilters(params: CatalogueSearchParams): boolean {
	return Boolean(
		params.q ||
			params.collection ||
			params.brand ||
			params.price ||
			params.stock ||
			params.sale,
	);
}

/**
 * Builds a catalogue URL that keeps the filters already in play. Pass `null`
 * for a key to drop it — the filter bar leans on this so a brand pill, a price
 * band, a sort change and a "clear search" chip all compose instead of
 * resetting each other.
 */
export function catalogueHref(
	basePath: string,
	current: CatalogueSearchParams,
	patch: Partial<Record<keyof CatalogueSearchParams, string | null>>,
): string {
	const next = new URLSearchParams();

	for (const key of PARAM_KEYS) {
		const patched = patch[key];
		const value =
			patched === null
				? undefined
				: (patched ?? current[key] ?? undefined);
		// "featured" is the default, so leave it out of the URL.
		if (value && !(key === "sort" && value === "featured")) {
			next.set(key, value);
		}
	}

	const query = next.toString();
	return query ? `${basePath}?${query}` : basePath;
}

export interface ActiveFilterChip {
	label: string;
	/** The patch that removes just this one. */
	patch: Partial<Record<keyof CatalogueSearchParams, string | null>>;
}

/** One removable chip per active filter, so nothing is on without being seen. */
export function describeActiveFilters(
	params: CatalogueSearchParams,
	collections: StoreCollection[] = [],
): ActiveFilterChip[] {
	const chips: ActiveFilterChip[] = [];

	if (params.q) {
		chips.push({ label: `“${params.q}”`, patch: { q: null } });
	}

	const collection = collections.find(
		(entry) => entry.slug === params.collection,
	);
	if (collection) {
		chips.push({ label: collection.name, patch: { collection: null } });
	}

	const brands = parseBrands(params.brand);
	for (const brand of brands) {
		chips.push({
			label: brand,
			patch: {
				brand:
					brands.filter((item) => item !== brand).join(",") || null,
			},
		});
	}

	const bracket = parsePriceBracket(params.price);
	if (bracket) {
		chips.push({ label: bracket.label, patch: { price: null } });
	}

	if (params.stock === "in") {
		chips.push({ label: "In stock", patch: { stock: null } });
	}

	if (params.sale === "1") {
		chips.push({ label: "Reduced", patch: { sale: null } });
	}

	return chips;
}
