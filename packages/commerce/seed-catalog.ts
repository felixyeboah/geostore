import type {
	ProductFilters,
	StoreCategory,
	StoreCollection,
	StoreProduct,
} from "./types";

/**
 * Departments: what kind of thing is it. Every product sits in exactly
 * one, and a department with no stock is kept out of the navigation
 * rather than showing a customer an empty shelf.
 */
export const STORE_CATEGORIES: StoreCategory[] = [
	{
		name: "Phones & tablets",
		slug: "phones",
		description:
			"Flagships, everyday smartphones, and dependable upgrades.",
		blurb: "Unlocked and ready for MTN, Telecel and AT.",
		imageUrl:
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Audio",
		slug: "audio",
		description: "Earbuds, headphones, and speakers for work and downtime.",
		blurb: "Noise cancelling for the trotro, loud enough for the house.",
		imageUrl:
			"https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Watches & wearables",
		slug: "watches-wearables",
		description: "Smart watches and fitness tech that fit your routine.",
		blurb: "Health, notifications and battery that lasts the day.",
		imageUrl:
			"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Home & TV",
		slug: "home-tv",
		description: "Screens and appliances for a better connected home.",
		blurb: "Football nights, streaming and a kitchen that keeps up.",
		imageUrl:
			"https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Computing",
		slug: "computing",
		description: "Laptops, printers and desk kit for work and school.",
		blurb: "Set up, updated and ready before it leaves the shop.",
		imageUrl:
			"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=85",
	},
	{
		name: "Accessories & power",
		slug: "accessories-power",
		description:
			"Chargers, cables, cases and power banks that actually last.",
		blurb: "The small things that keep everything else running.",
		imageUrl:
			"https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1000&q=85",
	},
];

/**
 * Collections: what do I want to do. A product can sit in any number of
 * them, and the smart ones maintain their own membership from a rule.
 */
export const STORE_COLLECTIONS: StoreCollection[] = [
	{
		name: "Fitness & health",
		slug: "fitness-health",
		description:
			"Track the run, the heart rate and the sleep, then shut the noise out while you move.",
		imageUrl:
			"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1000&q=85",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Home & entertainment",
		slug: "home-entertainment",
		description:
			"A screen for football nights, a speaker for the yard, earbuds for when the house is asleep.",
		imageUrl:
			"https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1000&q=85",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Travel & commute",
		slug: "travel-commute",
		description:
			"Noise cancelling for the trotro, a power bank that survives the trip, and a phone that lasts the day.",
		imageUrl:
			"https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1000&q=85",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Work from anywhere",
		slug: "work-from-anywhere",
		description:
			"A machine that boots fast, a keyboard worth typing on, and enough ports to plug the day in.",
		imageUrl:
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=85",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Best sellers",
		slug: "best-sellers",
		description:
			"Ranked by units actually paid for, not by what we would like to move.",
		onLanding: false,
		kind: "smart",
		rule: "best-selling",
		limit: 8,
	},
	{
		name: "New in",
		slug: "new-in",
		description: "The most recent additions to the shop floor.",
		onLanding: false,
		kind: "smart",
		rule: "newest",
		limit: 8,
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
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1596207891316-23851be3cc20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.8,
		reviewCount: 34,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		unitsSold: 41,
		addedAt: "2025-11-04",
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
			"https://images.unsplash.com/photo-1583142485083-291557266e6a?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 27,
		isFeatured: true,
		isNew: true,
		condition: "NEW",
		unitsSold: 28,
		addedAt: "2026-07-12",
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
			"https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1527698266440-12104e498b76?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 18,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["travel-commute"],
		unitsSold: 33,
		addedAt: "2026-06-28",
		specifications: {
			Storage: "128 GB",
			Display: "6.1-inch OLED",
			Camera: "64 MP dual camera",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_iphone_13",
		name: "iPhone 13",
		slug: "iphone-13",
		brand: "Apple",
		categorySlug: "phones",
		shortDescription:
			"The dependable iPhone, now at a price that makes sense.",
		description:
			"Still fast, still supported, and still taking the photographs people actually keep. The sensible upgrade for anyone moving off an older iPhone.",
		sku: "GST-APL-IP13-128",
		priceInPesewas: 720_000,
		compareAtInPesewas: 795_000,
		stockQuantity: 11,
		imageUrl:
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1583142485083-291557266e6a?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 63,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 57,
		addedAt: "2025-08-19",
		specifications: {
			Storage: "128 GB",
			Display: "6.1-inch Super Retina XDR",
			Connectivity: "5G, Lightning",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_galaxy_a55",
		name: "Galaxy A55",
		slug: "galaxy-a55",
		brand: "Samsung",
		categorySlug: "phones",
		shortDescription:
			"Flagship looks and a battery that finishes the day with you.",
		description:
			"A mid-range Samsung that gets the important parts right: a bright screen, a metal frame, and four years of software updates.",
		sku: "GST-SAM-A55-256",
		priceInPesewas: 415_000,
		stockQuantity: 15,
		imageUrl:
			"https://images.unsplash.com/photo-1596207891316-23851be3cc20?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1596207891316-23851be3cc20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1527698266440-12104e498b76?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 41,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 62,
		addedAt: "2026-02-10",
		specifications: {
			Storage: "256 GB",
			Display: "6.6-inch Super AMOLED",
			Battery: "5000 mAh",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_redmi_note_13",
		name: "Redmi Note 13",
		slug: "redmi-note-13",
		brand: "Xiaomi",
		categorySlug: "phones",
		shortDescription:
			"The most phone you can get for the money, by some distance.",
		description:
			"A big AMOLED screen, a 108 MP camera and two-day battery for the price of a mid-range handset. Our fastest-moving phone.",
		sku: "GST-XIA-RN13-128",
		priceInPesewas: 235_000,
		compareAtInPesewas: 269_000,
		stockQuantity: 22,
		imageUrl:
			"https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1596207891316-23851be3cc20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1583142485083-291557266e6a?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 97,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute"],
		unitsSold: 88,
		addedAt: "2026-01-22",
		specifications: {
			Storage: "128 GB",
			Display: "6.67-inch AMOLED",
			Camera: "108 MP main camera",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_ipad_10",
		name: "iPad (10th generation)",
		slug: "ipad-10th-generation",
		brand: "Apple",
		categorySlug: "phones",
		shortDescription:
			"A tablet for school runs, streaming and the odd spreadsheet.",
		description:
			"Light enough to carry all day and fast enough to last several school years. Pairs with a keyboard folio when it needs to do real work.",
		sku: "GST-APL-IPD10-64",
		priceInPesewas: 585_000,
		stockQuantity: 7,
		imageUrl:
			"https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1527698266440-12104e498b76?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 29,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute", "work-from-anywhere"],
		unitsSold: 19,
		addedAt: "2025-10-02",
		specifications: {
			Storage: "64 GB",
			Display: "10.9-inch Liquid Retina",
			Connectivity: "Wi-Fi, USB-C",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_galaxy_tab_s9_fe",
		name: "Galaxy Tab S9 FE",
		slug: "galaxy-tab-s9-fe",
		brand: "Samsung",
		categorySlug: "phones",
		shortDescription: "A big Android tablet with the S Pen in the box.",
		description:
			"Water resistant, genuinely bright outdoors, and happy to be written on. The one to buy if notes matter more than gaming.",
		sku: "GST-SAM-TS9FE-128",
		priceInPesewas: 495_000,
		compareAtInPesewas: 545_000,
		stockQuantity: 6,
		imageUrl:
			"https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1596207891316-23851be3cc20?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 15,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 14,
		addedAt: "2026-03-18",
		specifications: {
			Storage: "128 GB",
			Display: "10.9-inch LCD",
			Included: "S Pen",
			Warranty: "12 months",
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
			"https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.9,
		reviewCount: 52,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: [
			"fitness-health",
			"home-entertainment",
			"travel-commute",
		],
		unitsSold: 96,
		addedAt: "2025-09-15",
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
			"https://images.unsplash.com/photo-1582978571763-2d039e56f0c3?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1547052178-7f2c5a20c332?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 21,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["home-entertainment", "travel-commute"],
		unitsSold: 64,
		addedAt: "2025-07-08",
		specifications: {
			Battery: "Up to 20 hours",
			Waterproofing: "IP67",
			Charging: "USB-C",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_sony_wh1000xm5",
		name: "Sony WH-1000XM5",
		slug: "sony-wh-1000xm5",
		brand: "Sony",
		categorySlug: "audio",
		shortDescription: "The quietest way to spend four hours in traffic.",
		description:
			"Over-ear headphones that genuinely remove engine noise and hold a call in a busy room. Thirty hours between charges.",
		sku: "GST-SON-XM5-BLK",
		priceInPesewas: 390_000,
		stockQuantity: 5,
		imageUrl:
			"https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1507878566509-a0dbe19677a5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.8,
		reviewCount: 38,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute", "work-from-anywhere"],
		unitsSold: 22,
		addedAt: "2025-12-01",
		specifications: {
			Battery: "Up to 30 hours",
			"Noise cancelling": "Adaptive",
			Charging: "USB-C",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_jbl_tune_520bt",
		name: "JBL Tune 520BT",
		slug: "jbl-tune-520bt",
		brand: "JBL",
		categorySlug: "audio",
		shortDescription:
			"Wireless headphones that last a working week on one charge.",
		description:
			"Light on-ear headphones with JBL bass and a claimed 57 hours of playback. The sensible everyday pair.",
		sku: "GST-JBL-T520-BLK",
		priceInPesewas: 68_000,
		compareAtInPesewas: 79_000,
		stockQuantity: 26,
		imageUrl:
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1582978571763-2d039e56f0c3?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 55,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute"],
		unitsSold: 71,
		addedAt: "2026-01-09",
		specifications: {
			Battery: "Up to 57 hours",
			Fit: "On-ear",
			Charging: "USB-C",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_soundcore_p20i",
		name: "Soundcore P20i",
		slug: "soundcore-p20i",
		brand: "Anker",
		categorySlug: "audio",
		shortDescription:
			"Honest earbuds at a price that is hard to argue with.",
		description:
			"Ten millimetre drivers, an IPX5 rating and thirty hours with the case. The pair to keep in a gym bag and not worry about.",
		sku: "GST-ANK-P20I-BLK",
		priceInPesewas: 32_000,
		stockQuantity: 34,
		imageUrl:
			"https://images.unsplash.com/photo-1547052178-7f2c5a20c332?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1547052178-7f2c5a20c332?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1588131153911-a4ea5189fe19?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.2,
		reviewCount: 128,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["fitness-health", "travel-commute"],
		unitsSold: 103,
		addedAt: "2026-04-02",
		specifications: {
			Battery: "Up to 30 hours with case",
			"Water resistance": "IPX5",
			Charging: "USB-C",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_marshall_emberton_ii",
		name: "Marshall Emberton II",
		slug: "marshall-emberton-ii",
		brand: "Marshall",
		categorySlug: "audio",
		shortDescription:
			"A small speaker that fills a room it has no business filling.",
		description:
			"Thirty hours of battery in a brick you can hold in one hand, finished in the same silhouette as the amplifiers.",
		sku: "GST-MAR-EMB2-BLK",
		priceInPesewas: 185_000,
		stockQuantity: 4,
		imageUrl:
			"https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1507878566509-a0dbe19677a5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 17,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 11,
		addedAt: "2026-08-21",
		specifications: {
			Battery: "Up to 30 hours",
			"Water resistance": "IP67",
			Charging: "USB-C",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_apple_watch_s9",
		name: "Apple Watch Series 9",
		slug: "apple-watch-series-9",
		brand: "Apple",
		categorySlug: "watches-wearables",
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
			"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 16,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["fitness-health"],
		unitsSold: 26,
		addedAt: "2025-09-22",
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
		categorySlug: "watches-wearables",
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
			"https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1461141346587-763ab02bced9?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 12,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["fitness-health"],
		unitsSold: 18,
		addedAt: "2025-11-11",
		specifications: {
			Case: "44 mm aluminium",
			Connectivity: "Bluetooth and Wi-Fi",
			Tracking: "Sleep and body composition",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_apple_watch_se",
		name: "Apple Watch SE",
		slug: "apple-watch-se",
		brand: "Apple",
		categorySlug: "watches-wearables",
		shortDescription:
			"The Apple Watch without the parts most people never use.",
		description:
			"Same fitness tracking, same crash detection, same notifications. Fewer sensors, and several hundred cedis less.",
		sku: "GST-APL-AWSE-44",
		priceInPesewas: 295_000,
		compareAtInPesewas: 325_000,
		stockQuantity: 9,
		imageUrl:
			"https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1617043983671-adaadcaa2460?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1632794716789-42d9995fb5b6?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 44,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["fitness-health"],
		unitsSold: 37,
		addedAt: "2026-02-26",
		specifications: {
			Case: "44 mm aluminium",
			Connectivity: "GPS",
			"Water resistance": "50 metres",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_mi_band_8",
		name: "Xiaomi Smart Band 8",
		slug: "xiaomi-smart-band-8",
		brand: "Xiaomi",
		categorySlug: "watches-wearables",
		shortDescription:
			"Two weeks of battery and every metric you will actually read.",
		description:
			"Heart rate, sleep stages, and a hundred and fifty workout modes on a band you can forget you are wearing.",
		sku: "GST-XIA-MB8-BLK",
		priceInPesewas: 46_000,
		stockQuantity: 31,
		imageUrl:
			"https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1461141346587-763ab02bced9?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 156,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["fitness-health"],
		unitsSold: 118,
		addedAt: "2026-03-05",
		specifications: {
			Battery: "Up to 16 days",
			Display: "1.62-inch AMOLED",
			"Water resistance": "5 ATM",
			Warranty: "6 months",
		},
	},
	{
		id: "prod_amazfit_gts_4",
		name: "Amazfit GTS 4",
		slug: "amazfit-gts-4",
		brand: "Amazfit",
		categorySlug: "watches-wearables",
		shortDescription:
			"Built-in GPS and a fortnight of battery for the price of neither.",
		description:
			"A proper running watch with a square AMOLED face, five satellite systems, and no monthly subscription attached.",
		sku: "GST-AMZ-GTS4-BLK",
		priceInPesewas: 98_000,
		stockQuantity: 12,
		imageUrl:
			"https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1617043983671-adaadcaa2460?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 31,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["fitness-health"],
		unitsSold: 24,
		addedAt: "2026-08-14",
		specifications: {
			Battery: "Up to 8 days",
			GPS: "Dual-band, 5 systems",
			Display: "1.75-inch AMOLED",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_samsung_crystal_55",
		name: "Samsung 55-inch Crystal UHD TV",
		slug: "samsung-55-crystal-uhd-tv",
		brand: "Samsung",
		categorySlug: "home-tv",
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
			"https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 9,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 15,
		addedAt: "2025-10-18",
		specifications: {
			Display: "55-inch 4K UHD",
			Platform: "Tizen smart TV",
			Ports: "3 HDMI, 2 USB",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_hisense_43_smart",
		name: "Hisense 43-inch Smart TV",
		slug: "hisense-43-smart-tv",
		brand: "Hisense",
		categorySlug: "home-tv",
		shortDescription:
			"The bedroom television, sorted, with change left over.",
		description:
			"Full HD, the streaming apps everyone actually opens, and a picture that holds up in a bright room.",
		sku: "GST-HIS-43A4-FHD",
		priceInPesewas: 245_000,
		compareAtInPesewas: 279_000,
		stockQuantity: 10,
		imageUrl:
			"https://images.unsplash.com/photo-1615210230840-69c07c13b4d1?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1615210230840-69c07c13b4d1?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1615986200762-a1ed9610d3b1?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1586081467622-7acbbc73da3f?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.2,
		reviewCount: 48,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 44,
		addedAt: "2026-01-30",
		specifications: {
			Display: "43-inch Full HD",
			Platform: "VIDAA smart TV",
			Ports: "2 HDMI, 2 USB",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_lg_65_qned",
		name: "LG 65-inch QNED 4K TV",
		slug: "lg-65-qned-4k-tv",
		brand: "LG",
		categorySlug: "home-tv",
		shortDescription: "The screen you buy once and stop thinking about.",
		description:
			"Sixty-five inches of quantum dot and NanoCell, 120 Hz for the console, and a picture processor that earns its keep.",
		sku: "GST-LGE-QN65-4K",
		priceInPesewas: 985_000,
		stockQuantity: 2,
		imageUrl:
			"https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1630699144994-8342162d81f7?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1713514022453-4adc636025a4?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1630699376564-5506f3f1e2e1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 11,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 6,
		addedAt: "2026-05-20",
		specifications: {
			Display: "65-inch 4K QNED",
			"Refresh rate": "120 Hz",
			Platform: "webOS",
			Warranty: "24 months",
		},
	},
	{
		id: "prod_google_tv_streamer",
		name: "Google TV Streamer 4K",
		slug: "google-tv-streamer-4k",
		brand: "Google",
		categorySlug: "home-tv",
		shortDescription:
			"Turns any television with an HDMI port into a smart one.",
		description:
			"Every streaming app in one place, a remote you can find with your voice, and no waiting for the TV to think.",
		sku: "GST-GOO-TVS-4K",
		priceInPesewas: 79_000,
		stockQuantity: 18,
		imageUrl:
			"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 72,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 52,
		addedAt: "2026-07-03",
		specifications: {
			Output: "4K HDR",
			Storage: "32 GB",
			Connectivity: "Wi-Fi 5, Ethernet",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_lg_soundbar_s40q",
		name: "LG S40Q Soundbar",
		slug: "lg-s40q-soundbar",
		brand: "LG",
		categorySlug: "home-tv",
		shortDescription: "The cheapest fix for a television that sounds thin.",
		description:
			"Two channels plus a wireless subwoofer. Plug it into the HDMI ARC port and never hear a tinny dialogue track again.",
		sku: "GST-LGE-S40Q-2.1",
		priceInPesewas: 168_000,
		stockQuantity: 6,
		imageUrl:
			"https://images.unsplash.com/photo-1582978571763-2d039e56f0c3?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1582978571763-2d039e56f0c3?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1615210230840-69c07c13b4d1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 26,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["home-entertainment"],
		unitsSold: 13,
		addedAt: "2026-04-16",
		specifications: {
			Channels: "2.1",
			Power: "300 W",
			Connectivity: "HDMI ARC, Bluetooth",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_nasco_double_door_fridge",
		name: "Nasco 350L Double Door Fridge",
		slug: "nasco-350l-double-door-fridge",
		brand: "Nasco",
		categorySlug: "home-tv",
		shortDescription:
			"Cold through the outages, quiet the rest of the time.",
		description:
			"Three hundred and fifty litres, a separate freezer compartment, and a compressor rated for Ghanaian voltage swings.",
		sku: "GST-NAS-RF350-SLV",
		priceInPesewas: 485_000,
		compareAtInPesewas: 529_000,
		stockQuantity: 5,
		imageUrl:
			"https://images.unsplash.com/photo-1713514022453-4adc636025a4?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1713514022453-4adc636025a4?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1586081467622-7acbbc73da3f?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1630699144994-8342162d81f7?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1630699376564-5506f3f1e2e1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.1,
		reviewCount: 33,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 21,
		addedAt: "2025-12-12",
		specifications: {
			Capacity: "350 litres",
			Type: "Double door",
			Energy: "A+ rated",
			Warranty: "24 months",
		},
	},
	{
		id: "prod_binatone_microwave_20l",
		name: "Binatone 20L Microwave",
		slug: "binatone-20l-microwave",
		brand: "Binatone",
		categorySlug: "home-tv",
		shortDescription: "Twenty litres, six power levels, no menu to learn.",
		description:
			"A dial for time, a dial for power, and a turntable that fits a dinner plate. The microwave that outlasts the flat.",
		sku: "GST-BIN-MW20-WHT",
		priceInPesewas: 68_000,
		stockQuantity: 14,
		imageUrl:
			"https://images.unsplash.com/photo-1630699144994-8342162d81f7?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1630699144994-8342162d81f7?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.0,
		reviewCount: 57,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 49,
		addedAt: "2026-02-05",
		specifications: {
			Capacity: "20 litres",
			Power: "700 W",
			Controls: "Mechanical dials",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_macbook_air_m3",
		name: "MacBook Air 13-inch (M3)",
		slug: "macbook-air-13-m3",
		brand: "Apple",
		categorySlug: "computing",
		shortDescription:
			"Silent, cool, and still going at six in the evening.",
		description:
			"No fan, no noise, and eighteen hours of battery. The laptop to buy if you carry it more than you plug it in.",
		sku: "GST-APL-MBA13-M3",
		priceInPesewas: 1_650_000,
		stockQuantity: 3,
		imageUrl:
			"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.9,
		reviewCount: 22,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 12,
		addedAt: "2026-03-11",
		specifications: {
			Processor: "Apple M3",
			Memory: "8 GB unified",
			Storage: "256 GB SSD",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_hp_pavilion_15",
		name: "HP Pavilion 15",
		slug: "hp-pavilion-15",
		brand: "HP",
		categorySlug: "computing",
		shortDescription:
			"A full-size Windows laptop that handles a real workload.",
		description:
			"Core i5, sixteen gigabytes and a proper number pad. The one most offices end up buying.",
		sku: "GST-HPQ-PAV15-I5",
		priceInPesewas: 720_000,
		compareAtInPesewas: 795_000,
		stockQuantity: 8,
		imageUrl:
			"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 37,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 31,
		addedAt: "2025-11-26",
		specifications: {
			Processor: "Intel Core i5",
			Memory: "16 GB",
			Storage: "512 GB SSD",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_lenovo_ideapad_slim_3",
		name: "Lenovo IdeaPad Slim 3",
		slug: "lenovo-ideapad-slim-3",
		brand: "Lenovo",
		categorySlug: "computing",
		shortDescription:
			"The student laptop that does not feel like a student laptop.",
		description:
			"Ryzen 5, eight gigabytes, and a chassis that survives a backpack. Set up and updated before you collect it.",
		sku: "GST-LEN-IPS3-R5",
		priceInPesewas: 465_000,
		stockQuantity: 12,
		imageUrl:
			"https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1542393545-10f5cde2c810?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.2,
		reviewCount: 64,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 48,
		addedAt: "2026-01-15",
		specifications: {
			Processor: "AMD Ryzen 5",
			Memory: "8 GB",
			Storage: "512 GB SSD",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_dell_inspiron_15",
		name: "Dell Inspiron 15",
		slug: "dell-inspiron-15",
		brand: "Dell",
		categorySlug: "computing",
		shortDescription: "Boring in the way a work machine should be boring.",
		description:
			"Core i7, a matte screen you can read under an office light, and enough ports that you can leave the dongle at home.",
		sku: "GST-DEL-INS15-I7",
		priceInPesewas: 545_000,
		stockQuantity: 6,
		imageUrl:
			"https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.1,
		reviewCount: 28,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 21,
		addedAt: "2026-02-19",
		specifications: {
			Processor: "Intel Core i7",
			Memory: "16 GB",
			Storage: "512 GB SSD",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_hp_laserjet_m141w",
		name: "HP LaserJet MFP M141w",
		slug: "hp-laserjet-mfp-m141w",
		brand: "HP",
		categorySlug: "computing",
		shortDescription:
			"Prints, scans, copies, and never asks for colour ink.",
		description:
			"A mono laser for the home office. Toner lasts a year of normal use and the wireless setup actually works.",
		sku: "GST-HPQ-LJ141-MFP",
		priceInPesewas: 215_000,
		stockQuantity: 9,
		imageUrl:
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.2,
		reviewCount: 19,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 17,
		addedAt: "2025-10-29",
		specifications: {
			Functions: "Print, scan, copy",
			Speed: "20 pages per minute",
			Connectivity: "Wi-Fi, USB",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_logitech_mx_keys_s",
		name: "Logitech MX Keys S",
		slug: "logitech-mx-keys-s",
		brand: "Logitech",
		categorySlug: "computing",
		shortDescription:
			"The keyboard people replace their laptop keyboard with.",
		description:
			"Backlit, low profile, and switchable between three machines with one key. Charges over USB-C and lasts months.",
		sku: "GST-LOG-MXKS-GRA",
		priceInPesewas: 128_000,
		stockQuantity: 14,
		imageUrl:
			"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1542393545-10f5cde2c810?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 41,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 26,
		addedAt: "2026-06-11",
		specifications: {
			Layout: "Full size",
			Connectivity: "Bluetooth, Logi Bolt",
			Battery: "Up to 10 days backlit",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_anker_powercore_20k",
		name: "Anker PowerCore 20 000 mAh",
		slug: "anker-powercore-20000",
		brand: "Anker",
		categorySlug: "accessories-power",
		shortDescription:
			"Four phone charges, or one laptop, from a brick in your bag.",
		description:
			"Twenty thousand milliamp hours with 22.5 W output. The power bank we sell more of than anything else in the shop.",
		sku: "GST-ANK-PC20K-BLK",
		priceInPesewas: 54_000,
		compareAtInPesewas: 62_000,
		stockQuantity: 40,
		imageUrl:
			"https://images.unsplash.com/photo-1592318348310-f31b61a931c8?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1592318348310-f31b61a931c8?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.6,
		reviewCount: 184,
		isFeatured: true,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute"],
		unitsSold: 142,
		addedAt: "2025-08-06",
		specifications: {
			Capacity: "20 000 mAh",
			Output: "22.5 W USB-C",
			Ports: "1 USB-C, 2 USB-A",
			Warranty: "18 months",
		},
	},
	{
		id: "prod_anker_nano_65w",
		name: "Anker Nano II 65 W Charger",
		slug: "anker-nano-ii-65w",
		brand: "Anker",
		categorySlug: "accessories-power",
		shortDescription:
			"One charger small enough to replace the three in your bag.",
		description:
			"Gallium nitride, so it charges a laptop from something the size of a matchbox and stays cool doing it.",
		sku: "GST-ANK-N65W-BLK",
		priceInPesewas: 38_000,
		stockQuantity: 35,
		imageUrl:
			"https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1706275399494-fb26bbc5da63?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1614399113305-a127bb2ca893?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.7,
		reviewCount: 112,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["travel-commute", "work-from-anywhere"],
		unitsSold: 97,
		addedAt: "2025-09-30",
		specifications: {
			Output: "65 W",
			Technology: "GaN II",
			Ports: "1 USB-C",
			Warranty: "18 months",
		},
	},
	{
		id: "prod_ugreen_usbc_hub",
		name: "UGREEN 6-in-1 USB-C Hub",
		slug: "ugreen-6-in-1-usb-c-hub",
		brand: "UGREEN",
		categorySlug: "accessories-power",
		shortDescription:
			"Gives a modern laptop back the ports it was born without.",
		description:
			"HDMI, two USB-A, SD, microSD and 100 W pass-through charging from a single cable.",
		sku: "GST-UGR-HUB6-GRY",
		priceInPesewas: 42_000,
		stockQuantity: 19,
		imageUrl:
			"https://images.unsplash.com/photo-1706275399494-fb26bbc5da63?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1706275399494-fb26bbc5da63?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1706275400998-7fc21c8cd8ed?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 67,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		collectionSlugs: ["work-from-anywhere"],
		unitsSold: 38,
		addedAt: "2026-03-27",
		specifications: {
			Ports: "HDMI, 2 USB-A, SD, microSD, USB-C",
			Video: "4K at 30 Hz",
			Charging: "100 W pass-through",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_sandisk_ultra_128",
		name: "SanDisk Ultra 128 GB microSD",
		slug: "sandisk-ultra-128gb-microsd",
		brand: "SanDisk",
		categorySlug: "accessories-power",
		shortDescription: "More room for photographs, for the price of lunch.",
		description:
			"A1 rated, so apps run from it properly. Comes with the full-size adapter in the packet.",
		sku: "GST-SAN-U128-MSD",
		priceInPesewas: 12_000,
		stockQuantity: 60,
		imageUrl:
			"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1592318348310-f31b61a931c8?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.5,
		reviewCount: 231,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 176,
		addedAt: "2025-07-21",
		specifications: {
			Capacity: "128 GB",
			Speed: "Up to 140 MB/s",
			Rating: "A1, Class 10",
			Warranty: "24 months",
		},
	},
	{
		id: "prod_oraimo_solar_lamp",
		name: "Oraimo Solar Lamp 2",
		slug: "oraimo-solar-lamp-2",
		brand: "Oraimo",
		categorySlug: "accessories-power",
		shortDescription:
			"Light when the power goes, charged by the afternoon sun.",
		description:
			"Sixteen hours on a charge, a USB port to top up a phone, and a panel that works on a window ledge.",
		sku: "GST-ORA-SL2-WHT",
		priceInPesewas: 26_000,
		stockQuantity: 24,
		imageUrl:
			"https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1614399113305-a127bb2ca893?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.3,
		reviewCount: 89,
		isFeatured: false,
		isNew: true,
		condition: "NEW",
		collectionSlugs: ["travel-commute"],
		unitsSold: 58,
		addedAt: "2026-07-24",
		specifications: {
			Runtime: "Up to 16 hours",
			Charging: "Solar and USB-C",
			Extra: "USB-A output for phones",
			Warranty: "12 months",
		},
	},
	{
		id: "prod_belkin_magsafe_stand",
		name: "Belkin BoostCharge MagSafe Stand",
		slug: "belkin-boostcharge-magsafe-stand",
		brand: "Belkin",
		categorySlug: "accessories-power",
		shortDescription:
			"Puts the phone where you can see it while it charges.",
		description:
			"Fifteen watts of magnetic charging on an adjustable stand, so calls and timers stay readable on the desk.",
		sku: "GST-BEL-MAGS-WHT",
		priceInPesewas: 44_000,
		stockQuantity: 16,
		imageUrl:
			"https://images.unsplash.com/photo-1583142485083-291557266e6a?auto=format&fit=crop&w=1200&q=90",
		images: [
			"https://images.unsplash.com/photo-1583142485083-291557266e6a?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1614399113305-a127bb2ca893?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?auto=format&fit=crop&w=1400&q=90",
			"https://images.unsplash.com/photo-1706275400998-7fc21c8cd8ed?auto=format&fit=crop&w=1400&q=90",
		],
		rating: 4.4,
		reviewCount: 35,
		isFeatured: false,
		isNew: false,
		condition: "NEW",
		unitsSold: 19,
		addedAt: "2026-05-08",
		specifications: {
			Output: "15 W MagSafe",
			Compatibility: "iPhone 12 and later",
			Included: "Power adapter",
			Warranty: "24 months",
		},
	},
];

export function getProductBySlug(slug: string): StoreProduct | undefined {
	return STORE_PRODUCTS.find((product) => product.slug === slug);
}

export function getCategoryBySlug(slug: string): StoreCategory | undefined {
	return STORE_CATEGORIES.find((category) => category.slug === slug);
}

export function getCollectionBySlug(slug: string): StoreCollection | undefined {
	return STORE_COLLECTIONS.find((collection) => collection.slug === slug);
}

/**
 * Members of a collection. Manual collections read the membership the
 * products declare; smart ones apply their rule to the whole catalogue.
 */
export function getCollectionProducts(slug: string): StoreProduct[] {
	const collection = getCollectionBySlug(slug);

	if (!collection) {
		return [];
	}

	if (collection.kind === "manual") {
		return STORE_PRODUCTS.filter((product) =>
			product.collectionSlugs?.includes(slug),
		);
	}

	const ranked = [...STORE_PRODUCTS].sort((left, right) =>
		collection.rule === "newest"
			? Date.parse(right.addedAt) - Date.parse(left.addedAt)
			: right.unitsSold - left.unitsSold,
	);

	return collection.limit ? ranked.slice(0, collection.limit) : ranked;
}

/** Departments that actually have something to sell. */
export function getStockedCategories(): StoreCategory[] {
	return STORE_CATEGORIES.filter((category) =>
		STORE_PRODUCTS.some(
			(product) => product.categorySlug === category.slug,
		),
	);
}

export function filterProducts(filters: ProductFilters): StoreProduct[] {
	const normalizedQuery = filters.query?.trim().toLocaleLowerCase();
	const normalizedBrands = filters.brands?.length
		? filters.brands.map((brand) => brand.toLocaleLowerCase())
		: filters.brand
			? [filters.brand.toLocaleLowerCase()]
			: undefined;
	const collectionIds = filters.collection
		? new Set(getCollectionProducts(filters.collection).map((p) => p.id))
		: undefined;

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
		const matchesCollection = collectionIds
			? collectionIds.has(product.id)
			: true;
		const matchesBrand = normalizedBrands
			? normalizedBrands.includes(product.brand.toLocaleLowerCase())
			: true;
		const matchesMinPrice =
			filters.minPriceInPesewas === undefined ||
			product.priceInPesewas >= filters.minPriceInPesewas;
		const matchesMaxPrice =
			filters.maxPriceInPesewas === undefined ||
			product.priceInPesewas <= filters.maxPriceInPesewas;
		const matchesStock = filters.inStock ? product.stockQuantity > 0 : true;
		const matchesSale = filters.onSale
			? product.compareAtInPesewas !== undefined &&
				product.compareAtInPesewas > product.priceInPesewas
			: true;

		return (
			matchesQuery &&
			matchesCategory &&
			matchesCollection &&
			matchesBrand &&
			matchesMinPrice &&
			matchesMaxPrice &&
			matchesStock &&
			matchesSale
		);
	});

	return [...products].sort((left, right) => {
		switch (filters.sort) {
			case "price-asc":
				return left.priceInPesewas - right.priceInPesewas;
			case "price-desc":
				return right.priceInPesewas - left.priceInPesewas;
			case "rating":
				return right.rating - left.rating;
			case "newest":
				return Date.parse(right.addedAt) - Date.parse(left.addedAt);
			default:
				return Number(right.isFeatured) - Number(left.isFeatured);
		}
	});
}
