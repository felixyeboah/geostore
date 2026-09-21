import type {
	ProductFilters,
	StoreCategory,
	StoreCollection,
	StoreProduct,
} from "./types";

/** Manufacturer-backed catalogue. Prices and inventory are development fixtures.
 * Product/image provenance is maintained in catalogue-sources.json. */
export const STORE_CATEGORIES: StoreCategory[] = [
	{
		name: "Phones",
		slug: "phones",
		description: "Smartphones for everyday use and creative work.",
		blurb: "Smartphones for everyday use and creative work.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-18-pro-0a3860ee2f48.jpg",
	},
	{
		name: "Tablets",
		slug: "tablets",
		description:
			"Portable screens for reading, drawing and getting things done.",
		blurb: "Portable screens for reading, drawing and getting things done.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ipad-air-m4-fa0bd3efd62f.jpg",
	},
	{
		name: "Computing",
		slug: "computing",
		description: "Notebooks, desktops and keyboards for your workspace.",
		blurb: "Notebooks, desktops and keyboards for your workspace.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/macbook-air-m5-043afd34f8e4.jpg",
	},
	{
		name: "Audio",
		slug: "audio",
		description: "Earbuds, headphones and speakers for music and calls.",
		blurb: "Earbuds, headphones and speakers for music and calls.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/jbl-charge-6-60566c996f04.png",
	},
	{
		name: "Watches & wearables",
		slug: "watches-wearables",
		description: "Connected watches for activity and everyday essentials.",
		blurb: "Connected watches for activity and everyday essentials.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-series-12-a86881189b8c.jpg",
	},
	{
		name: "TV & streaming",
		slug: "home-tv",
		description:
			"Televisions and streaming players for home entertainment.",
		blurb: "Televisions and streaming players for home entertainment.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/lg-oled55c6pua-bec552741b75.jpg",
	},
	{
		name: "Home appliances",
		slug: "appliances",
		description:
			"Refrigeration and kitchen appliances with clear model details.",
		blurb: "Refrigeration and kitchen appliances with clear model details.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/samsung-ms23k3513ak-20f0c9a6e85b.png",
	},
	{
		name: "Accessories & power",
		slug: "accessories-power",
		description: "Chargers, power banks and hubs for connected devices.",
		blurb: "Chargers, power banks and hubs for connected devices.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/anker-715-a2663-29affa8e321b.png",
	},
];

export const STORE_COLLECTIONS: StoreCollection[] = [
	{
		name: "Fitness & health",
		slug: "fitness-health",
		description: "Fitness & health essentials from the catalogue.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-series-12-a86881189b8c.jpg",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Home & entertainment",
		slug: "home-entertainment",
		description: "Home & entertainment essentials from the catalogue.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/lg-oled55c6pua-bec552741b75.jpg",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Travel & commute",
		slug: "travel-commute",
		description: "Travel & commute essentials from the catalogue.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-18-pro-0a3860ee2f48.jpg",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Work from anywhere",
		slug: "work-from-anywhere",
		description: "Work from anywhere essentials from the catalogue.",
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/macbook-air-m5-043afd34f8e4.jpg",
		onLanding: true,
		kind: "manual",
	},
	{
		name: "Best sellers",
		slug: "best-sellers",
		description: "Products ranked by paid sales.",
		onLanding: false,
		kind: "smart",
		rule: "best-selling",
		limit: 8,
	},
	{
		name: "New in",
		slug: "new-in",
		description: "Recent additions to the catalogue.",
		onLanding: false,
		kind: "smart",
		rule: "newest",
		limit: 8,
	},
];

export const STORE_PRODUCTS: StoreProduct[] = [
	{
		id: "prod_iphone_18_pro",
		name: "iPhone 18 Pro",
		slug: "iphone-18-pro",
		brand: "Apple",
		categorySlug: "phones",
		shortDescription:
			"A20 Pro and a 48MP Fusion camera with variable aperture.",
		description: "A20 Pro and a 48MP Fusion camera with variable aperture.",
		sku: "GST-IPHONE-18-PRO",
		condition: "NEW",
		priceInPesewas: 1680000,
		stockQuantity: 12,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-18-pro-0a3860ee2f48.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-18-pro-0a3860ee2f48.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: true,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "A20 Pro",
			Enclosure: "Aluminum",
		},
		collectionSlugs: ["travel-commute"],
		variants: [
			{
				id: "prod_iphone_18_pro_v_1",
				name: "256 GB",
				sku: "GST-IPHONE-18-PRO-1",
				priceInPesewas: 1680000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
			{
				id: "prod_iphone_18_pro_v_2",
				name: "512 GB",
				sku: "GST-IPHONE-18-PRO-2",
				priceInPesewas: 1710000,
				stockQuantity: 3,
				attributes: {
					Storage: "512 GB",
				},
			},
			{
				id: "prod_iphone_18_pro_v_3",
				name: "1 TB",
				sku: "GST-IPHONE-18-PRO-3",
				priceInPesewas: 1740000,
				stockQuantity: 3,
				attributes: {
					Storage: "1 TB",
				},
			},
			{
				id: "prod_iphone_18_pro_v_4",
				name: "2 TB",
				sku: "GST-IPHONE-18-PRO-4",
				priceInPesewas: 1770000,
				stockQuantity: 3,
				attributes: {
					Storage: "2 TB",
				},
			},
		],
	},
	{
		id: "prod_iphone_17",
		name: "iPhone 17",
		slug: "iphone-17",
		brand: "Apple",
		categorySlug: "phones",
		shortDescription:
			"An everyday iPhone with a 6.3-inch display and A19 chip.",
		description: "An everyday iPhone with a 6.3-inch display and A19 chip.",
		sku: "GST-IPHONE-17",
		condition: "NEW",
		priceInPesewas: 1100000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-17-d4a5370ad1e2.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/iphone-17-d4a5370ad1e2.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "A19",
		},
		collectionSlugs: ["travel-commute"],
		variants: [
			{
				id: "prod_iphone_17_v_1",
				name: "256 GB",
				sku: "GST-IPHONE-17-1",
				priceInPesewas: 1100000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
			{
				id: "prod_iphone_17_v_2",
				name: "512 GB",
				sku: "GST-IPHONE-17-2",
				priceInPesewas: 1130000,
				stockQuantity: 3,
				attributes: {
					Storage: "512 GB",
				},
			},
		],
	},
	{
		id: "prod_galaxy_s26_ultra",
		name: "Samsung Galaxy S26 Ultra",
		slug: "galaxy-s26-ultra",
		brand: "Samsung",
		categorySlug: "phones",
		shortDescription:
			"Cobalt Violet Galaxy S26 Ultra with S Pen, unlocked.",
		description: "Cobalt Violet Galaxy S26 Ultra with S Pen, unlocked.",
		sku: "GST-GALAXY-S26-ULTRA",
		condition: "NEW",
		priceInPesewas: 1500000,
		stockQuantity: 3,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-s26-ultra-e153127475f2.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-s26-ultra-e153127475f2.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "Cobalt Violet",
			Model: "SM-S948UZVAXAA",
		},
		collectionSlugs: ["travel-commute"],
		variants: [
			{
				id: "prod_galaxy_s26_ultra_v_1",
				name: "256 GB",
				sku: "GST-GALAXY-S26-ULTRA-1",
				priceInPesewas: 1500000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
		],
	},
	{
		id: "prod_ipad_air_m4",
		name: "iPad Air (M4)",
		slug: "ipad-air-m4",
		brand: "Apple",
		categorySlug: "tablets",
		shortDescription:
			"M4 performance for drawing, studying and multitasking.",
		description: "M4 performance for drawing, studying and multitasking.",
		sku: "GST-IPAD-AIR-M4",
		condition: "NEW",
		priceInPesewas: 850000,
		stockQuantity: 12,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ipad-air-m4-fa0bd3efd62f.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ipad-air-m4-fa0bd3efd62f.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "M4",
			Memory: "12 GB",
		},
		collectionSlugs: ["work-from-anywhere"],
		variants: [
			{
				id: "prod_ipad_air_m4_v_1",
				name: "128 GB",
				sku: "GST-IPAD-AIR-M4-1",
				priceInPesewas: 850000,
				stockQuantity: 3,
				attributes: {
					Storage: "128 GB",
				},
			},
			{
				id: "prod_ipad_air_m4_v_2",
				name: "256 GB",
				sku: "GST-IPAD-AIR-M4-2",
				priceInPesewas: 880000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
			{
				id: "prod_ipad_air_m4_v_3",
				name: "512 GB",
				sku: "GST-IPAD-AIR-M4-3",
				priceInPesewas: 910000,
				stockQuantity: 3,
				attributes: {
					Storage: "512 GB",
				},
			},
			{
				id: "prod_ipad_air_m4_v_4",
				name: "1 TB",
				sku: "GST-IPAD-AIR-M4-4",
				priceInPesewas: 940000,
				stockQuantity: 3,
				attributes: {
					Storage: "1 TB",
				},
			},
		],
	},
	{
		id: "prod_ipad_pro_m5",
		name: "iPad Pro (M5)",
		slug: "ipad-pro-m5",
		brand: "Apple",
		categorySlug: "tablets",
		shortDescription:
			"An OLED iPad with M5 performance and Apple Pencil Pro support.",
		description:
			"An OLED iPad with M5 performance and Apple Pencil Pro support.",
		sku: "GST-IPAD-PRO-M5",
		condition: "NEW",
		priceInPesewas: 1450000,
		stockQuantity: 12,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ipad-pro-m5-170ce65a5dcd.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ipad-pro-m5-170ce65a5dcd.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "M5",
			Display: "Ultra Retina XDR",
		},
		collectionSlugs: ["work-from-anywhere"],
		variants: [
			{
				id: "prod_ipad_pro_m5_v_1",
				name: "256 GB",
				sku: "GST-IPAD-PRO-M5-1",
				priceInPesewas: 1450000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
			{
				id: "prod_ipad_pro_m5_v_2",
				name: "512 GB",
				sku: "GST-IPAD-PRO-M5-2",
				priceInPesewas: 1480000,
				stockQuantity: 3,
				attributes: {
					Storage: "512 GB",
				},
			},
			{
				id: "prod_ipad_pro_m5_v_3",
				name: "1 TB",
				sku: "GST-IPAD-PRO-M5-3",
				priceInPesewas: 1510000,
				stockQuantity: 3,
				attributes: {
					Storage: "1 TB",
				},
			},
			{
				id: "prod_ipad_pro_m5_v_4",
				name: "2 TB",
				sku: "GST-IPAD-PRO-M5-4",
				priceInPesewas: 1540000,
				stockQuantity: 3,
				attributes: {
					Storage: "2 TB",
				},
			},
		],
	},
	{
		id: "prod_galaxy_tab_s11",
		name: "Samsung Galaxy Tab S11 5G",
		slug: "galaxy-tab-s11",
		brand: "Samsung",
		categorySlug: "tablets",
		shortDescription: "An 11-inch Silver tablet with 5G connectivity.",
		description: "An 11-inch Silver tablet with 5G connectivity.",
		sku: "GST-GALAXY-TAB-S11",
		condition: "NEW",
		priceInPesewas: 950000,
		stockQuantity: 3,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-tab-s11-5dbf8f41e29c.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-tab-s11-5dbf8f41e29c.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "SM-X736BZSREUB",
			Display: "11-inch Dynamic AMOLED 2X",
			Colour: "Silver",
			Connectivity: "5G",
		},
		collectionSlugs: ["work-from-anywhere"],
		variants: [
			{
				id: "prod_galaxy_tab_s11_v_1",
				name: "128 GB",
				sku: "GST-GALAXY-TAB-S11-1",
				priceInPesewas: 950000,
				stockQuantity: 3,
				attributes: {
					Storage: "128 GB",
				},
			},
		],
	},
	{
		id: "prod_macbook_air_m5",
		name: "MacBook Air (M5)",
		slug: "macbook-air-m5",
		brand: "Apple",
		categorySlug: "computing",
		shortDescription:
			"A portable Mac notebook with M5 and 512GB SSD storage.",
		description: "A portable Mac notebook with M5 and 512GB SSD storage.",
		sku: "GST-MACBOOK-AIR-M5",
		condition: "NEW",
		priceInPesewas: 1600000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/macbook-air-m5-043afd34f8e4.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/macbook-air-m5-043afd34f8e4.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "M5",
			Storage: "512 GB",
		},
		collectionSlugs: ["work-from-anywhere"],
		variants: [
			{
				id: "prod_macbook_air_m5_v_1",
				name: "13-inch",
				sku: "GST-MACBOOK-AIR-M5-1",
				priceInPesewas: 1600000,
				stockQuantity: 3,
				attributes: {
					Size: "13-inch",
				},
			},
			{
				id: "prod_macbook_air_m5_v_2",
				name: "15-inch",
				sku: "GST-MACBOOK-AIR-M5-2",
				priceInPesewas: 1630000,
				stockQuantity: 3,
				attributes: {
					Size: "15-inch",
				},
			},
		],
	},
	{
		id: "prod_mac_mini",
		name: "Mac mini (M6)",
		slug: "mac-mini",
		brand: "Apple",
		categorySlug: "computing",
		shortDescription:
			"A compact Silver desktop with M6 and 16GB unified memory.",
		description:
			"A compact Silver desktop with M6 and 16GB unified memory.",
		sku: "GST-MAC-MINI",
		condition: "NEW",
		priceInPesewas: 1050000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/mac-mini-06ba952bc2c5.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/mac-mini-06ba952bc2c5.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "M6",
			Memory: "16 GB",
			Colour: "Silver",
		},
		collectionSlugs: ["work-from-anywhere"],
		variants: [
			{
				id: "prod_mac_mini_v_1",
				name: "256 GB",
				sku: "GST-MAC-MINI-1",
				priceInPesewas: 1050000,
				stockQuantity: 3,
				attributes: {
					Storage: "256 GB",
				},
			},
			{
				id: "prod_mac_mini_v_2",
				name: "512 GB",
				sku: "GST-MAC-MINI-2",
				priceInPesewas: 1080000,
				stockQuantity: 3,
				attributes: {
					Storage: "512 GB",
				},
			},
		],
	},
	{
		id: "prod_logitech_mx_keys_s",
		name: "Logitech MX Keys S",
		slug: "logitech-mx-keys-s",
		brand: "Logitech",
		categorySlug: "computing",
		shortDescription:
			"A full-size illuminated wireless keyboard in Graphite.",
		description: "A full-size illuminated wireless keyboard in Graphite.",
		sku: "GST-LOGITECH-MX-KEYS-S",
		condition: "NEW",
		priceInPesewas: 165000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/logitech-mx-keys-s-1f1c2ae06c6a.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/logitech-mx-keys-s-1f1c2ae06c6a.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "Graphite",
			Layout: "US English",
		},
		collectionSlugs: ["work-from-anywhere"],
	},
	{
		id: "prod_airpods_5",
		name: "AirPods 5",
		slug: "airpods-5",
		brand: "Apple",
		categorySlug: "audio",
		shortDescription:
			"Open-ear wireless earbuds with Active Noise Cancellation.",
		description:
			"Open-ear wireless earbuds with Active Noise Cancellation.",
		sku: "GST-AIRPODS-5",
		condition: "NEW",
		priceInPesewas: 195000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/airpods-5-7f58e7fa7acf.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/airpods-5-7f58e7fa7acf.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: true,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "White",
			"Noise control": "Active Noise Cancellation",
		},
		collectionSlugs: ["home-entertainment"],
		variants: [
			{
				id: "prod_airpods_5_v_1",
				name: "USB-C Charging Case",
				sku: "GST-AIRPODS-5-1",
				priceInPesewas: 195000,
				stockQuantity: 3,
				attributes: {
					"Charging case": "USB-C Charging Case",
				},
			},
			{
				id: "prod_airpods_5_v_2",
				name: "Wireless Charging Case",
				sku: "GST-AIRPODS-5-2",
				priceInPesewas: 225000,
				stockQuantity: 3,
				attributes: {
					"Charging case": "Wireless Charging Case",
				},
			},
		],
	},
	{
		id: "prod_airpods_pro_3",
		name: "AirPods Pro 3",
		slug: "airpods-pro-3",
		brand: "Apple",
		categorySlug: "audio",
		shortDescription:
			"In-ear wireless earbuds with Active Noise Cancellation.",
		description: "In-ear wireless earbuds with Active Noise Cancellation.",
		sku: "GST-AIRPODS-PRO-3",
		condition: "NEW",
		priceInPesewas: 360000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/airpods-pro-3-11aa61e98eed.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/airpods-pro-3-11aa61e98eed.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "White",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_jbl_charge_6",
		name: "JBL Charge 6",
		slug: "jbl-charge-6",
		brand: "JBL",
		categorySlug: "audio",
		shortDescription:
			"A portable Bluetooth speaker in Black for music on the move.",
		description:
			"A portable Bluetooth speaker in Black for music on the move.",
		sku: "GST-JBL-CHARGE-6",
		condition: "NEW",
		priceInPesewas: 240000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/jbl-charge-6-60566c996f04.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/jbl-charge-6-60566c996f04.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "Black",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_galaxy_buds4",
		name: "Samsung Galaxy Buds4",
		slug: "galaxy-buds4",
		brand: "Samsung",
		categorySlug: "audio",
		shortDescription: "White wireless earbuds with an open-fit design.",
		description: "White wireless earbuds with an open-fit design.",
		sku: "GST-GALAXY-BUDS4",
		condition: "NEW",
		priceInPesewas: 250000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-buds4-0954748c9a9f.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/galaxy-buds4-0954748c9a9f.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Colour: "White",
			Model: "SM-R540NZWAEUB",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_homepod_mini",
		name: "HomePod mini",
		slug: "homepod-mini",
		brand: "Apple",
		categorySlug: "audio",
		shortDescription: "A compact smart speaker for music and Siri.",
		description: "A compact smart speaker for music and Siri.",
		sku: "GST-HOMEPOD-MINI",
		condition: "NEW",
		priceInPesewas: 140000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/homepod-mini-c4f85886a04c.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/homepod-mini-c4f85886a04c.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Connectivity: "Wi-Fi and Bluetooth",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_apple_watch_series_12",
		name: "Apple Watch Series 12",
		slug: "apple-watch-series-12",
		brand: "Apple",
		categorySlug: "watches-wearables",
		shortDescription:
			"An Apple Watch with the S11 chip and an always-on display.",
		description:
			"An Apple Watch with the S11 chip and an always-on display.",
		sku: "GST-APPLE-WATCH-SERIES-12",
		condition: "NEW",
		priceInPesewas: 640000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-series-12-a86881189b8c.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-series-12-a86881189b8c.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: true,
		isNew: true,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "S11",
			"Case material": "Aluminum",
		},
		collectionSlugs: ["fitness-health"],
		variants: [
			{
				id: "prod_apple_watch_series_12_v_1",
				name: "42 mm",
				sku: "GST-APPLE-WATCH-SERIES-12-1",
				priceInPesewas: 640000,
				stockQuantity: 3,
				attributes: {
					Size: "42 mm",
				},
			},
			{
				id: "prod_apple_watch_series_12_v_2",
				name: "46 mm",
				sku: "GST-APPLE-WATCH-SERIES-12-2",
				priceInPesewas: 670000,
				stockQuantity: 3,
				attributes: {
					Size: "46 mm",
				},
			},
		],
	},
	{
		id: "prod_apple_watch_ultra_4",
		name: "Apple Watch Ultra 4",
		slug: "apple-watch-ultra-4",
		brand: "Apple",
		categorySlug: "watches-wearables",
		shortDescription:
			"A 49mm titanium Apple Watch for workouts and outdoor activity.",
		description:
			"A 49mm titanium Apple Watch for workouts and outdoor activity.",
		sku: "GST-APPLE-WATCH-ULTRA-4",
		condition: "NEW",
		priceInPesewas: 1150000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-ultra-4-8e9b52a9fafc.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-ultra-4-8e9b52a9fafc.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: true,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			"Case size": "49 mm",
			"Case material": "Titanium",
			Chip: "S11",
		},
		collectionSlugs: ["fitness-health"],
	},
	{
		id: "prod_apple_watch_se_3",
		name: "Apple Watch SE 3",
		slug: "apple-watch-se-3",
		brand: "Apple",
		categorySlug: "watches-wearables",
		shortDescription: "An aluminum Apple Watch with the S10 chip.",
		description: "An aluminum Apple Watch with the S10 chip.",
		sku: "GST-APPLE-WATCH-SE-3",
		condition: "NEW",
		priceInPesewas: 380000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-se-3-47c26a655ee9.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-watch-se-3-47c26a655ee9.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Chip: "S10",
			"Case material": "Aluminum",
		},
		collectionSlugs: ["fitness-health"],
		variants: [
			{
				id: "prod_apple_watch_se_3_v_1",
				name: "40 mm",
				sku: "GST-APPLE-WATCH-SE-3-1",
				priceInPesewas: 380000,
				stockQuantity: 3,
				attributes: {
					Size: "40 mm",
				},
			},
			{
				id: "prod_apple_watch_se_3_v_2",
				name: "44 mm",
				sku: "GST-APPLE-WATCH-SE-3-2",
				priceInPesewas: 410000,
				stockQuantity: 3,
				attributes: {
					Size: "44 mm",
				},
			},
		],
	},
	{
		id: "prod_lg_oled55c6pua",
		name: "LG OLED evo C6 55-inch TV",
		slug: "lg-oled55c6pua",
		brand: "LG",
		categorySlug: "home-tv",
		shortDescription: "A 55-inch 4K OLED television, model OLED55C6PUA.",
		description: "A 55-inch 4K OLED television, model OLED55C6PUA.",
		sku: "GST-LG-OLED55C6PUA",
		condition: "NEW",
		priceInPesewas: 1500000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/lg-oled55c6pua-bec552741b75.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/lg-oled55c6pua-bec552741b75.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "OLED55C6PUA.AUS",
			Display: "55-inch 4K OLED",
			"Model year": "2026",
			Region: "US model",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_apple_tv_4k",
		name: "Apple TV 4K",
		slug: "apple-tv-4k",
		brand: "Apple",
		categorySlug: "home-tv",
		shortDescription: "A compact 4K streaming player with Siri Remote.",
		description: "A compact 4K streaming player with Siri Remote.",
		sku: "GST-APPLE-TV-4K",
		condition: "NEW",
		priceInPesewas: 220000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-tv-4k-9dcdd11c6a16.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/apple-tv-4k-9dcdd11c6a16.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Output: "4K",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_samsung_ms23k3513ak",
		name: "Samsung MS23K3513AK 23L Microwave",
		slug: "samsung-ms23k3513ak",
		brand: "Samsung",
		categorySlug: "appliances",
		shortDescription:
			"A Black 23-litre solo microwave for everyday cooking.",
		description: "A Black 23-litre solo microwave for everyday cooking.",
		sku: "GST-SAMSUNG-MS23K3513AK",
		condition: "NEW",
		priceInPesewas: 220000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/samsung-ms23k3513ak-20f0c9a6e85b.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/samsung-ms23k3513ak-20f0c9a6e85b.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "MS23K3513AK/EU",
			Capacity: "23 L",
			Colour: "Black",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_hisense_h670sit_wd",
		name: "Hisense H670SIT-WD 508L Refrigerator",
		slug: "hisense-h670sit-wd",
		brand: "Hisense",
		categorySlug: "appliances",
		shortDescription:
			"A side-by-side refrigerator in Titanium Inox with 508-litre capacity.",
		description:
			"A side-by-side refrigerator in Titanium Inox with 508-litre capacity.",
		sku: "GST-HISENSE-H670SIT-WD",
		condition: "NEW",
		priceInPesewas: 1100000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/hisense-h670sit-wd-5746e2e84290.jpg",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/hisense-h670sit-wd-5746e2e84290.jpg",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "H670SIT-WD",
			Capacity: "508 L",
			Colour: "Titanium Inox",
		},
		collectionSlugs: ["home-entertainment"],
	},
	{
		id: "prod_anker_715_a2663",
		name: "Anker 715 Charger (Nano II 65W)",
		slug: "anker-715-a2663",
		brand: "Anker",
		categorySlug: "accessories-power",
		shortDescription: "A compact 65W USB-C charger, model A2663.",
		description: "A compact 65W USB-C charger, model A2663.",
		sku: "GST-ANKER-715-A2663",
		condition: "NEW",
		priceInPesewas: 65000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/anker-715-a2663-29affa8e321b.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/anker-715-a2663-29affa8e321b.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "A2663",
			Power: "65 W",
			Plug: "UK",
		},
		collectionSlugs: ["work-from-anywhere"],
	},
	{
		id: "prod_anker_laptop_power_bank_a1695",
		name: "Anker Laptop Power Bank (25K, 165W)",
		slug: "anker-laptop-power-bank-a1695",
		brand: "Anker",
		categorySlug: "accessories-power",
		shortDescription:
			"A laptop power bank with built-in and retractable USB-C cables.",
		description:
			"A laptop power bank with built-in and retractable USB-C cables.",
		sku: "GST-ANKER-LAPTOP-POWER-BANK-A1695",
		condition: "NEW",
		priceInPesewas: 165000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/anker-laptop-power-bank-a1695-389170af3fa5.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/anker-laptop-power-bank-a1695-389170af3fa5.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "A1695",
			Capacity: "25,000 mAh",
			"Maximum total output": "165 W",
		},
		collectionSlugs: ["work-from-anywhere"],
	},
	{
		id: "prod_ugreen_revodok_70410",
		name: "UGREEN Revodok 6-in-1 USB-C Hub",
		slug: "ugreen-revodok-70410",
		brand: "UGREEN",
		categorySlug: "accessories-power",
		shortDescription:
			"A six-port USB-C hub with 4K HDMI and USB-C power delivery.",
		description:
			"A six-port USB-C hub with 4K HDMI and USB-C power delivery.",
		sku: "GST-UGREEN-REVODOK-70410",
		condition: "NEW",
		priceInPesewas: 48000,
		stockQuantity: 6,
		imageUrl:
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ugreen-revodok-70410-b2a3eda345a5.png",
		images: [
			"https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev/catalogue/2026-09-21/ugreen-revodok-70410-b2a3eda345a5.png",
		],
		rating: 0,
		reviewCount: 0,
		isFeatured: false,
		isNew: false,
		unitsSold: 0,
		addedAt: "2026-09-21",
		specifications: {
			Model: "70410",
			HDMI: "4K at 30 Hz",
			"Power delivery": "100 W",
		},
		collectionSlugs: ["work-from-anywhere"],
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
