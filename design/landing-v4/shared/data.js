/* Geostoresgh landing mockups — shared catalogue data.
   Mirrors apps/saas/modules/commerce/data/catalog.ts (names, GH₵ prices,
   stock, ratings). Photos are the curated light-background set screened in
   round 2 so every product sits on a consistent plain backdrop. */
(function () {
	const STORE_URL = "http://localhost:3000";

	const u = (id, w) =>
		`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w || 900}&q=85`;

	const categories = [
		{
			slug: "phones",
			name: "Phones",
			description: "Flagships, everyday smartphones, and dependable upgrades.",
			imageUrl: u("photo-1574944985070-8f3ebc6b79d2"),
		},
		{
			slug: "audio",
			name: "Audio",
			description: "Earbuds, headphones, and speakers for work and downtime.",
			imageUrl: u("photo-1583394838336-acd977736f90"),
		},
		{
			slug: "wearables",
			name: "Wearables",
			description: "Smart watches and fitness tech that fit your routine.",
			imageUrl: u("photo-1579586337278-3befd40fd17a"),
		},
		{
			slug: "home-tech",
			name: "Home tech",
			description: "Screens and practical gadgets for a better connected home.",
			imageUrl: u("photo-1567690187548-f07b1d7bf5a9"),
		},
	];

	const products = [
		{
			id: "prod_iphone_15_pro",
			slug: "iphone-15-pro",
			name: "iPhone 15 Pro",
			brand: "Apple",
			categorySlug: "phones",
			shortDescription:
				"Titanium design, A17 Pro performance, and a flexible camera system.",
			description:
				"A premium everyday phone with a lightweight titanium build, excellent cameras, and reliable all-day performance. Supplied unlocked and ready for Ghanaian networks.",
			priceInPesewas: 1290000,
			compareAtInPesewas: 1365000,
			stockQuantity: 6,
			imageUrl: u("photo-1580910051074-3eb694886505"),
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
			slug: "galaxy-s24-ultra",
			name: "Galaxy S24 Ultra",
			brand: "Samsung",
			categorySlug: "phones",
			shortDescription:
				"Big-screen Android flagship with S Pen and a sharp zoom camera.",
			description:
				"Built for customers who want a large display, versatile cameras, and productivity features in one durable device.",
			priceInPesewas: 1140000,
			stockQuantity: 4,
			imageUrl: u("photo-1512054502232-10a0a035d672"),
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
			slug: "google-pixel-8a",
			name: "Google Pixel 8a",
			brand: "Google",
			categorySlug: "phones",
			shortDescription:
				"A compact phone with a clean Android experience and strong cameras.",
			description:
				"A practical choice for customers who value helpful software, dependable photography, and a comfortable size.",
			priceInPesewas: 625000,
			stockQuantity: 8,
			imageUrl: u("photo-1574944985070-8f3ebc6b79d2"),
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
			slug: "airpods-pro-2",
			name: "AirPods Pro (2nd generation)",
			brand: "Apple",
			categorySlug: "audio",
			shortDescription:
				"Comfortable earbuds with strong noise cancellation and clear calls.",
			description:
				"Compact USB-C earbuds for commuting, calls, and focused listening, with a pocket-friendly charging case.",
			priceInPesewas: 235000,
			compareAtInPesewas: 260000,
			stockQuantity: 14,
			imageUrl: u("photo-1600294037681-c80b4cb5b434"),
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
			slug: "jbl-charge-5",
			name: "JBL Charge 5",
			brand: "JBL",
			categorySlug: "audio",
			shortDescription:
				"Portable waterproof speaker with full sound and long battery life.",
			description:
				"A rugged portable speaker for the house, beach, and small gatherings, with enough battery for a full day out.",
			priceInPesewas: 145000,
			stockQuantity: 9,
			imageUrl: u("photo-1608043152269-423dbba4e7e1"),
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
			slug: "apple-watch-series-9",
			name: "Apple Watch Series 9",
			brand: "Apple",
			categorySlug: "wearables",
			shortDescription:
				"Everyday activity, health, and notification tracking on your wrist.",
			description:
				"A capable smartwatch for iPhone users who want activity tracking, quick notifications, and useful safety features.",
			priceInPesewas: 475000,
			stockQuantity: 5,
			imageUrl: u("photo-1546868871-7041f2a55e12"),
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
			slug: "galaxy-watch-6",
			name: "Galaxy Watch6",
			brand: "Samsung",
			categorySlug: "wearables",
			shortDescription:
				"A slim Android smartwatch for health insights and daily movement.",
			description:
				"Comfortable fitness and sleep tracking with a bright round display and a familiar watch shape.",
			priceInPesewas: 285000,
			stockQuantity: 7,
			imageUrl: u("photo-1544117519-31a4b719223d"),
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
			slug: "samsung-55-crystal-uhd-tv",
			name: "Samsung 55-inch Crystal UHD TV",
			brand: "Samsung",
			categorySlug: "home-tech",
			shortDescription:
				"A sharp 4K smart TV sized for movie nights and football.",
			description:
				"A straightforward 4K television with popular streaming apps, multiple HDMI inputs, and a clean, slim profile.",
			priceInPesewas: 470000,
			stockQuantity: 3,
			imageUrl: u("photo-1567690187548-f07b1d7bf5a9"),
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

	const brands = ["Apple", "Samsung", "Google", "JBL"];

	const paymentMethods = [
		{ id: "momo", name: "MTN MoMo", short: "MoMo" },
		{ id: "telecel", name: "Telecel Cash", short: "Telecel" },
		{ id: "card", name: "Visa / Mastercard", short: "Card" },
		{ id: "cod", name: "Cash on delivery", short: "Cash" },
	];

	const faqs = [
		{
			q: "How do I pay?",
			a: "Pay with mobile money or card through Reevit, or choose cash on delivery.",
		},
		{
			q: "Do you deliver outside Accra?",
			a: "Yes. We deliver across Ghana. Timing depends on destination and stock.",
		},
		{
			q: "Can I return a device?",
			a: "Contact support within 48 hours if an item arrives damaged, faulty, or different from the listing. Warranty details are on each product page.",
		},
		{
			q: "When am I charged?",
			a: "Card and mobile money payments are taken only after you approve the prompt. Cash on delivery is collected when the order arrives.",
		},
	];

	const FREE_DELIVERY_PESEWAS = 100000; // GH₵ 1,000 in Accra

	const ghs = new Intl.NumberFormat("en-GH", {
		style: "currency",
		currency: "GHS",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
	function formatMoney(pesewas) {
		return ghs.format(pesewas / 100).replace("GH₵", "GH₵ ");
	}

	const byId = Object.fromEntries(products.map((p) => [p.id, p]));
	const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
	const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

	function filterProducts(filters) {
		filters = filters || {};
		const q = (filters.query || "").trim().toLowerCase();
		let list = products.filter((p) => {
			const matchesQuery = q
				? [p.name, p.brand, p.shortDescription, categoryBySlug[p.categorySlug].name]
						.join(" ")
						.toLowerCase()
						.includes(q)
				: true;
			const matchesCategory = filters.category
				? p.categorySlug === filters.category
				: true;
			const matchesBrand = filters.brand
				? p.brand.toLowerCase() === filters.brand.toLowerCase()
				: true;
			const matchesSale = filters.onSale ? Boolean(p.compareAtInPesewas) : true;
			const matchesMax =
				filters.maxPrice != null ? p.priceInPesewas <= filters.maxPrice : true;
			const matchesMin =
				filters.minPrice != null ? p.priceInPesewas >= filters.minPrice : true;
			return (
				matchesQuery &&
				matchesCategory &&
				matchesBrand &&
				matchesSale &&
				matchesMax &&
				matchesMin
			);
		});
		list = [...list].sort((a, b) => {
			switch (filters.sort) {
				case "price-asc":
					return a.priceInPesewas - b.priceInPesewas;
				case "price-desc":
					return b.priceInPesewas - a.priceInPesewas;
				case "rating":
					return b.rating - a.rating;
				case "newest":
					return Number(b.isNew) - Number(a.isNew);
				default:
					return Number(b.isFeatured) - Number(a.isFeatured);
			}
		});
		return list;
	}

	const urls = {
		store: STORE_URL,
		product: (slug) => `${STORE_URL}/products/${slug}`,
		category: (slug) => `${STORE_URL}/categories/${slug}`,
		search: (q) => `${STORE_URL}/?q=${encodeURIComponent(q || "")}`,
		brand: (b) => `${STORE_URL}/?brand=${encodeURIComponent(b)}`,
		sort: (s) => `${STORE_URL}/?sort=${encodeURIComponent(s)}`,
		cart: `${STORE_URL}/cart`,
		checkout: `${STORE_URL}/checkout`,
		account: `${STORE_URL}/dashboard`,
		login: `${STORE_URL}/login`,
		signup: `${STORE_URL}/signup`,
		legal: (slug) => `${STORE_URL}/legal/${slug}`,
		support: "mailto:support@geostoresgh.com",
	};

	window.GEO = Object.assign(window.GEO || {}, {
		STORE_URL,
		FREE_DELIVERY_PESEWAS,
		categories,
		products,
		brands,
		paymentMethods,
		faqs,
		formatMoney,
		filterProducts,
		byId,
		bySlug,
		categoryBySlug,
		urls,
		img: u,
	});
})();
