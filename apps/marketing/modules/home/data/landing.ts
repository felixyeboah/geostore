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
	appliances: { department: "home-tv" },
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

export const FEATURED_PRODUCTS: {
	name: string;
	category: CategoryKey;
	image: string;
}[] = [
	{
		name: "Microsoft Surface Laptop Studio 2",
		category: "laptops",
		image: "/images/landing/product-surface.jpg",
	},
	{
		name: "Samsung Odyssey G9",
		category: "monitors",
		image: "/images/landing/product-odyssey.jpg",
	},
	{
		name: "Apple iPhones",
		category: "phones",
		image: "/images/landing/product-iphones.jpg",
	},
];

export const COMPUTING_DEVICES: { brand: string; name: string }[] = [
	{ brand: "HP", name: "OmniBook X Flip" },
	{ brand: "Lenovo", name: "IdeaPad Slim 3" },
	{ brand: "Microsoft", name: "Surface Laptop" },
];

export const IMAGES = {
	surfaceLaptop: "/images/landing/surface-laptop-studio-2.png",
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

export interface RailProduct {
	slug: string;
	name: string;
	brand: string;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	rating: number;
	reviewCount: number;
	isNew?: boolean;
	image: string;
}

/** Mirrors `apps/saas/modules/commerce/data/catalog.ts` (the seeded store). */
export const RAIL_PRODUCTS: RailProduct[] = [
	{
		slug: "iphone-15-pro",
		name: "iPhone 15 Pro",
		brand: "Apple",
		priceInPesewas: 1_290_000,
		compareAtInPesewas: 1_365_000,
		rating: 4.8,
		reviewCount: 34,
		image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "galaxy-s24-ultra",
		name: "Galaxy S24 Ultra",
		brand: "Samsung",
		priceInPesewas: 1_140_000,
		rating: 4.7,
		reviewCount: 27,
		isNew: true,
		image: "https://images.unsplash.com/photo-1709744722656-9b850470293f?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "google-pixel-8a",
		name: "Google Pixel 8a",
		brand: "Google",
		priceInPesewas: 625_000,
		rating: 4.5,
		reviewCount: 18,
		isNew: true,
		image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "airpods-pro-2",
		name: "AirPods Pro (2nd generation)",
		brand: "Apple",
		priceInPesewas: 235_000,
		compareAtInPesewas: 260_000,
		rating: 4.9,
		reviewCount: 52,
		image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "samsung-55-crystal-uhd-tv",
		name: "Samsung 55-inch Crystal UHD TV",
		brand: "Samsung",
		priceInPesewas: 470_000,
		rating: 4.5,
		reviewCount: 9,
		image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "apple-watch-series-9",
		name: "Apple Watch Series 9",
		brand: "Apple",
		priceInPesewas: 475_000,
		rating: 4.7,
		reviewCount: 16,
		image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "galaxy-watch-6",
		name: "Galaxy Watch6",
		brand: "Samsung",
		priceInPesewas: 285_000,
		rating: 4.4,
		reviewCount: 12,
		image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=85",
	},
	{
		slug: "jbl-charge-5",
		name: "JBL Charge 5",
		brand: "JBL",
		priceInPesewas: 145_000,
		rating: 4.6,
		reviewCount: 21,
		image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85",
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
