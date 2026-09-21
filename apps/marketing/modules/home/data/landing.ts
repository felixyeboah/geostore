import {
	PAYMENT_METHODS as STORE_PAYMENT_METHODS,
	PHONE_NUMBER as STORE_PHONE_NUMBER,
	links as storeLinks,
} from "@commerce/lib/store-links";

/**
 * Where each merchandising tile points. A tile that matches a real department
 * deep-links to it; the rest still fall back to shop search, because the shop
 * does not carry a department for them yet. Keeping both in one table is what
 * stops a tile silently pointing at a slug that was renamed.
 */
const CATEGORY_TARGETS = {
	phones: { department: "phones" },
	laptops: { department: "computing" },
	gaming: { query: "gaming" },
	appliances: { department: "appliances" },
	monitors: { query: "monitor" },
	accessories: { department: "accessories-power" },
	office: { department: "computing" },
} as const;

export type CategoryKey = keyof typeof CATEGORY_TARGETS;

function targetHref(target: { department?: string; query?: string }): string {
	return target.department
		? storeLinks.category(target.department)
		: storeLinks.searchFor(target.query ?? "");
}

export const links = {
	shop: storeLinks.shop,
	search: storeLinks.shop,
	contact: storeLinks.contact,
	about: storeLinks.about,
	category: (key: CategoryKey) => targetHref(CATEGORY_TARGETS[key]),
	department: (slug: string) => storeLinks.category(slug),
	collection: (slug: string) => storeLinks.collection(slug),
	searchFor: (query: string) => storeLinks.searchFor(query),
	account: storeLinks.account,
	cart: storeLinks.cart,
} as const;

export const CATEGORY_TILES: { key: CategoryKey; image: string }[] = [
	{ key: "phones", image: "/images/landing/cat-phones.jpg" },
	{ key: "laptops", image: "/images/landing/cat-laptops.jpg" },
	{ key: "gaming", image: "/images/landing/cat-gaming.jpg" },
	{ key: "appliances", image: "/images/landing/cat-appliances.jpg" },
	{ key: "monitors", image: "/images/landing/cat-monitors.jpg" },
	{ key: "accessories", image: "/images/landing/cat-accessories.jpg" },
];

export const IMAGES = {
	gaming: "/images/landing/gaming-odyssey.jpg",
	appliances: "/images/landing/appliances-kitchen.jpg",
} as const;

/**
 * Department index, keyed by `home.departments.items`. Entries that match a
 * real department link straight to it; the rest fall back to shop search.
 */
export const DEPARTMENTS: { key: string; href: string }[] = [
	{ key: "phones", href: links.department("phones") },
	{ key: "computers", href: links.department("computing") },
	{ key: "tv", href: links.department("home-tv") },
	{ key: "gaming", href: links.searchFor("gaming") },
	{ key: "fridges", href: links.searchFor("fridge") },
	{ key: "laundry", href: links.searchFor("washing machine") },
	{ key: "kitchen", href: links.searchFor("microwave") },
	{ key: "cooling", href: links.searchFor("air conditioner") },
	{ key: "monitors", href: links.searchFor("monitor") },
	{ key: "wearables", href: links.department("watches-wearables") },
	{ key: "accessories", href: links.department("accessories-power") },
	{ key: "office", href: links.searchFor("printer") },
];

export const PHONE_NUMBER = STORE_PHONE_NUMBER;

/** Currys-style category rail: the six video tiles plus the wider range. */
export const CATEGORY_RAIL: { key: string; image: string; href: string }[] = [
	...CATEGORY_TILES.map((tile) => ({
		key: tile.key,
		image: tile.image,
		href: links.category(tile.key),
	})),
	{
		key: "tv",
		image: "/images/landing/cat-tv.jpg",
		href: links.department("home-tv"),
	},
	{
		key: "fridges",
		image: "/images/landing/cat-fridges.jpg",
		href: links.searchFor("fridge"),
	},
	{
		key: "laundry",
		image: "/images/landing/cat-laundry.jpg",
		href: links.searchFor("washing machine"),
	},
	{
		key: "kitchen",
		image: "/images/landing/cat-kitchen.jpg",
		href: links.searchFor("microwave"),
	},
	{
		key: "cooling",
		image: "/images/landing/cat-cooling.jpg",
		href: links.searchFor("air conditioner"),
	},
	{
		key: "tablets",
		image: "/images/landing/cat-tablets.jpg",
		href: links.searchFor("tablet"),
	},
	{
		key: "audio",
		image: "/images/landing/cat-audio.jpg",
		href: links.department("audio"),
	},
	{
		key: "wearables",
		image: "/images/landing/cat-wearables.jpg",
		href: links.department("watches-wearables"),
	},
	{
		key: "office",
		image: "/images/landing/cat-office.jpg",
		href: links.searchFor("printer"),
	},
];

export function productHref(slug: string) {
	return storeLinks.product(slug);
}

export function formatCedis(amountInPesewas: number): string {
	return `GH₵ ${new Intl.NumberFormat("en-GH", {
		maximumFractionDigits: 0,
	}).format(amountInPesewas / 100)}`;
}

/** Shop-by-need merchandising cards; each resolves to a store search. */
/**
 * The "shop by need" band. Where a real collection expresses the need it links
 * to that, because a collection is exactly this idea made durable. The rest
 * still search, until someone curates a collection for them.
 */
export const NEEDS: { key: string; image: string; href: string }[] = [
	{
		key: "wfh",
		image: "/images/landing/product-surface.jpg",
		href: links.collection("work-from-anywhere"),
	},
	{
		key: "school",
		image: "/images/landing/cat-tablets.jpg",
		href: links.searchFor("tablet"),
	},
	{
		key: "newhome",
		image: "/images/landing/kitchen-fridge.jpg",
		href: links.collection("home-entertainment"),
	},
	{ key: "gaming", image: IMAGES.gaming, href: links.searchFor("gaming") },
	{
		key: "kitchen",
		image: "/images/landing/need-coffee.jpg",
		href: links.searchFor("microwave"),
	},
	{
		key: "phone",
		image: "/images/landing/product-iphones.jpg",
		href: links.collection("travel-commute"),
	},
];

export const PAYMENT_METHODS = STORE_PAYMENT_METHODS;
