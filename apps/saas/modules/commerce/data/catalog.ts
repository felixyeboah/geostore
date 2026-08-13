import type { ProductFilters, StoreCategory, StoreProduct } from "../types";

export const STORE_CATEGORIES: StoreCategory[] = [
	{
		name: "Phones",
		slug: "phones",
		description:
			"Flagships, everyday smartphones, and dependable upgrades.",
		imageUrl:
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Audio",
		slug: "audio",
		description: "Earbuds, headphones, and speakers for work and downtime.",
		imageUrl:
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Wearables",
		slug: "wearables",
		description: "Smart watches and fitness tech that fit your routine.",
		imageUrl:
			"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Home tech",
		slug: "home-tech",
		description:
			"Screens and practical gadgets for a better connected home.",
		imageUrl:
			"https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=85",
	},
];

export const STORE_PRODUCTS: StoreProduct[] = [
	{
		id: "prod_iphone_15_pro",
		name: "iPhone 15 Pro",
		slug: "iphone-15-pro",
		brand: "Apple",
		categorySlug: "phones",
		shortDescription:
			"Titanium design, A17 Pro performance, and a flexible camera system.",
		description:
			"A premium everyday phone with a lightweight titanium build, excellent cameras, and reliable all-day performance. Supplied unlocked and ready for Ghanaian networks.",
		sku: "GST-APL-IP15P-256",
		priceInPesewas: 1_290_000,
		compareAtInPesewas: 1_365_000,
		stockQuantity: 6,
		imageUrl:
			"https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.8,
		reviewCount: 34,
		isFeatured: true,
		isNew: false,
		specifications: {
			Storage: "256 GB",
			Display: "6.1-inch Super Retina XDR",
			Connectivity: "5G, Wi-Fi 6E, USB-C",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_galaxy_s24_ultra",
		name: "Galaxy S24 Ultra",
		slug: "galaxy-s24-ultra",
		brand: "Samsung",
		categorySlug: "phones",
		shortDescription:
			"Big-screen Android flagship with S Pen and a sharp zoom camera.",
		description:
			"Built for customers who want a large display, versatile cameras, and productivity features in one durable device.",
		sku: "GST-SAM-S24U-256",
		priceInPesewas: 1_140_000,
		stockQuantity: 4,
		imageUrl:
			"https://images.unsplash.com/photo-1709744722656-9b850470293f?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1709744722656-9b850470293f?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 27,
		isFeatured: true,
		isNew: true,
		specifications: {
			Storage: "256 GB",
			Display: "6.8-inch Dynamic AMOLED 2X",
			Camera: "200 MP main camera",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_pixel_8a",
		name: "Google Pixel 8a",
		slug: "google-pixel-8a",
		brand: "Google",
		categorySlug: "phones",
		shortDescription:
			"A compact phone with a clean Android experience and strong cameras.",
		description:
			"A practical choice for customers who value helpful software, dependable photography, and a comfortable size.",
		sku: "GST-GOO-PX8A-128",
		priceInPesewas: 625_000,
		stockQuantity: 8,
		imageUrl:
			"https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 18,
		isFeatured: false,
		isNew: true,
		specifications: {
			Storage: "128 GB",
			Display: "6.1-inch OLED",
			Camera: "64 MP dual camera",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_airpods_pro_2",
		name: "AirPods Pro (2nd generation)",
		slug: "airpods-pro-2",
		brand: "Apple",
		categorySlug: "audio",
		shortDescription:
			"Comfortable earbuds with strong noise cancellation and clear calls.",
		description:
			"Compact USB-C earbuds for commuting, calls, and focused listening, with a pocket-friendly charging case.",
		sku: "GST-APL-APP2-USBC",
		priceInPesewas: 235_000,
		compareAtInPesewas: 260_000,
		stockQuantity: 14,
		imageUrl:
			"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.9,
		reviewCount: 52,
		isFeatured: true,
		isNew: false,
		specifications: {
			Charging: "USB-C and MagSafe",
			Listening: "Up to 6 hours",
			Controls: "Touch controls",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_jbl_charge_5",
		name: "JBL Charge 5",
		slug: "jbl-charge-5",
		brand: "JBL",
		categorySlug: "audio",
		shortDescription:
			"Portable waterproof speaker with full sound and long battery life.",
		description:
			"A rugged portable speaker for the house, beach, and small gatherings, with enough battery for a full day out.",
		sku: "GST-JBL-CHG5-BLK",
		priceInPesewas: 145_000,
		stockQuantity: 9,
		imageUrl:
			"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 21,
		isFeatured: false,
		isNew: false,
		specifications: {
			Battery: "Up to 20 hours",
			Waterproofing: "IP67",
			Charging: "USB-C",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_apple_watch_s9",
		name: "Apple Watch Series 9",
		slug: "apple-watch-series-9",
		brand: "Apple",
		categorySlug: "wearables",
		shortDescription:
			"Everyday activity, health, and notification tracking on your wrist.",
		description:
			"A capable smartwatch for iPhone users who want activity tracking, quick notifications, and useful safety features.",
		sku: "GST-APL-AWS9-45",
		priceInPesewas: 475_000,
		stockQuantity: 5,
		imageUrl:
			"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 16,
		isFeatured: true,
		isNew: false,
		specifications: {
			Case: "45 mm aluminium",
			Connectivity: "GPS",
			"Water resistance": "50 metres",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_galaxy_watch_6",
		name: "Galaxy Watch6",
		slug: "galaxy-watch-6",
		brand: "Samsung",
		categorySlug: "wearables",
		shortDescription:
			"A slim Android smartwatch for health insights and daily movement.",
		description:
			"Comfortable fitness and sleep tracking with a bright round display and a familiar watch shape.",
		sku: "GST-SAM-GW6-44",
		priceInPesewas: 285_000,
		stockQuantity: 7,
		imageUrl:
			"https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 12,
		isFeatured: false,
		isNew: false,
		specifications: {
			Case: "44 mm aluminium",
			Connectivity: "Bluetooth and Wi-Fi",
			Tracking: "Sleep and body composition",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_samsung_crystal_55",
		name: "Samsung 55-inch Crystal UHD TV",
		slug: "samsung-55-crystal-uhd-tv",
		brand: "Samsung",
		categorySlug: "home-tech",
		shortDescription:
			"A sharp 4K smart TV sized for movie nights and football.",
		description:
			"A straightforward 4K television with popular streaming apps, multiple HDMI inputs, and a clean, slim profile.",
		sku: "GST-SAM-CU55-4K",
		priceInPesewas: 470_000,
		stockQuantity: 3,
		imageUrl:
			"https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 9,
		isFeatured: true,
		isNew: false,
		specifications: {
			Display: "55-inch 4K UHD",
			Platform: "Tizen smart TV",
			Ports: "3 HDMI, 2 USB",
			Warranty: "12 months",
		},
	},
];

export function getProductBySlug(slug: string): StoreProduct | undefined {
	return STORE_PRODUCTS.find((product) => product.slug === slug);
}

export function getCategoryBySlug(slug: string): StoreCategory | undefined {
	return STORE_CATEGORIES.find((category) => category.slug === slug);
}

export function filterProducts(filters: ProductFilters): StoreProduct[] {
	const normalizedQuery = filters.query?.trim().toLocaleLowerCase();
	const products = STORE_PRODUCTS.filter((product) => {
		const matchesQuery = normalizedQuery
			? [product.name, product.brand, product.shortDescription].some(
					(value) =>
						value.toLocaleLowerCase().includes(normalizedQuery),
				)
			: true;
		const matchesCategory = filters.category
			? product.categorySlug === filters.category
			: true;
		const matchesBrand = filters.brand
			? product.brand.toLocaleLowerCase() ===
				filters.brand.toLocaleLowerCase()
			: true;

		return matchesQuery && matchesCategory && matchesBrand;
	});

	return [...products].sort((left, right) => {
		switch (filters.sort) {
			case "price-asc":
				return left.priceInPesewas - right.priceInPesewas;
			case "price-desc":
				return right.priceInPesewas - left.priceInPesewas;
			case "rating":
				return right.rating - left.rating;
			default:
				return Number(right.isFeatured) - Number(left.isFeatured);
		}
	});
}
