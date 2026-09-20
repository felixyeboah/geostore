/* Geostoresgh landing mockups (round 5) — shared catalogue data.
   Mirrors apps/saas/modules/commerce/data/catalog.ts (names, GH₵ prices,
   stock, ratings). Photography was re-picked from the images already used in
   this repo, favouring plain light backgrounds and the correct device, so the
   grid reads as one consistent set. */
(function () {
	const STORE_URL = "http://localhost:3000";

	const u = (id, w) =>
		`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w || 900}&q=85`;

	/* Departments. One per product, and deliberately stable: they are the
	   skeleton behind the URLs and the navigation, so they never change for a
	   merchandising reason. Anything seasonal or use-case led is a collection.
	   A department with no stock stays out of the navigation (see
	   stockedCategories) rather than showing a customer an empty shelf. */
	const categories = [
		{
			slug: "phones",
			name: "Phones & tablets",
			description: "Flagships, everyday smartphones, and dependable upgrades.",
			blurb: "Unlocked and ready for MTN, Telecel and AT.",
			imageUrl: u("photo-1592286927505-1def25115558"),
		},
		{
			slug: "audio",
			name: "Audio",
			description: "Earbuds, headphones, and speakers for work and downtime.",
			blurb: "Noise cancelling for the trotro, loud enough for the house.",
			imageUrl: u("photo-1583394838336-acd977736f90"),
		},
		{
			slug: "watches-wearables",
			name: "Watches & wearables",
			description: "Smart watches and fitness tech that fit your routine.",
			blurb: "Health, notifications and battery that lasts the day.",
			imageUrl: u("photo-1579586337278-3befd40fd17a"),
		},
		{
			slug: "home-tv",
			name: "Home & TV",
			description: "Screens and practical gadgets for a better connected home.",
			blurb: "Football nights, streaming and console-ready screens.",
			imageUrl: u("photo-1567690187548-f07b1d7bf5a9"),
		},
		{
			slug: "computing",
			name: "Computing",
			description: "Laptops and tablets for work, school and everything after.",
			blurb: "Not stocked yet — hidden from the shop until it is.",
			imageUrl: u("photo-1541807084-5c52b6b3adef"),
		},
		{
			slug: "accessories-power",
			name: "Accessories & power",
			description: "Chargers, cables, cases and power banks that actually last.",
			blurb: "Not stocked yet — hidden from the shop until it is.",
			imageUrl: u("photo-1550009158-9ebf69173e03"),
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
			imageUrl: u("photo-1574944985070-8f3ebc6b79d2"),
			heroImageUrl: u("photo-1580910051074-3eb694886505", 1300),
			rating: 4.8,
			reviewCount: 34,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 140,
			addedAt: "2026-05-19",
			isFeatured: true,
			isNew: false,
			tag: "Best seller",
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
			imageUrl: u("photo-1610945265064-0e34e5519bbf"),
			rating: 4.7,
			reviewCount: 27,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 96,
			addedAt: "2026-08-28",
			isFeatured: true,
			isNew: true,
			tag: "Just landed",
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
			imageUrl: u("photo-1585060544812-6b45742d762f"),
			rating: 4.5,
			reviewCount: 18,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 64,
			addedAt: "2026-09-09",
			isFeatured: false,
			isNew: true,
			tag: "Just landed",
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
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 210,
			addedAt: "2025-11-12",
			isFeatured: true,
			isNew: false,
			tag: "Most reviewed",
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
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 88,
			addedAt: "2026-04-08",
			isFeatured: false,
			isNew: false,
			tag: "Everyday pick",
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
			categorySlug: "watches-wearables",
			shortDescription:
				"Everyday activity, health, and notification tracking on your wrist.",
			description:
				"A capable smartwatch for iPhone users who want activity tracking, quick notifications, and useful safety features.",
			priceInPesewas: 475000,
			stockQuantity: 5,
			imageUrl: u("photo-1546868871-7041f2a55e12"),
			rating: 4.7,
			reviewCount: 16,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 57,
			addedAt: "2026-02-21",
			isFeatured: true,
			isNew: false,
			tag: "Pairs with iPhone",
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
			categorySlug: "watches-wearables",
			shortDescription:
				"A slim Android smartwatch for health insights and daily movement.",
			description:
				"Comfortable fitness and sleep tracking with a bright round display and a familiar watch shape.",
			priceInPesewas: 285000,
			stockQuantity: 7,
			imageUrl: u("photo-1523275335684-37898b6baf30"),
			rating: 4.4,
			reviewCount: 12,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 41,
			addedAt: "2026-07-03",
			isFeatured: false,
			isNew: false,
			tag: "Pairs with Android",
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
			name: 'Samsung 55" Crystal UHD TV',
			brand: "Samsung",
			categorySlug: "home-tv",
			shortDescription:
				"A sharp 4K smart TV sized for movie nights and football.",
			description:
				"A straightforward 4K television with popular streaming apps, multiple HDMI inputs, and a clean, slim profile.",
			priceInPesewas: 470000,
			stockQuantity: 3,
			imageUrl: u("photo-1552975084-6e027cd345c2"),
			rating: 4.5,
			reviewCount: 9,
			/* stand-in for the order rollup a smart collection would read */
			unitsSold: 23,
			addedAt: "2025-12-02",
			isFeatured: true,
			isNew: false,
			tag: "Only 3 left",
			specifications: {
				Display: "55-inch 4K UHD",
				Platform: "Tizen smart TV",
				Ports: "3 HDMI, 2 USB",
				Warranty: "12 months",
			},
		},
	];

	/* Brands. One per product. A brand is neither a department nor a
	   collection — it answers "whose is it", and on the landing page its only
	   job is to be a fast way in for someone who already knows what they want. */
	const brands = [
		{ slug: "apple", name: "Apple" },
		{ slug: "samsung", name: "Samsung" },
		{ slug: "google", name: "Google" },
		{ slug: "jbl", name: "JBL" },
	];

	/* Collections. Many per product — this is the layer that lets one product
	   sit in several places at once, which a single categoryId can never do.
	   The AirPods are in one department and three collections.

	   "manual" is an editor-picked list. "smart" is a rule that maintains
	   itself: best sellers reads the order rollup on a rolling window, new in
	   reads the publish date. Nobody has to remember to update a smart one.

	   `onLanding` marks the three that get a tile in the collections band;
	   best sellers and new in have their own band and are not tiled. */
	const collections = [
		{
			slug: "fitness-health",
			name: "Fitness & health",
			kind: "manual",
			onLanding: true,
			lede: "Track the run, the heart rate and the sleep — then shut the noise out while you move.",
			imageUrl: u("photo-1434493789847-2f02dc6ca35d"),
			productIds: [
				"prod_apple_watch_s9",
				"prod_galaxy_watch_6",
				"prod_airpods_pro_2",
			],
		},
		{
			slug: "home-entertainment",
			name: "Home & entertainment",
			kind: "manual",
			onLanding: true,
			lede: "A screen for football nights, a speaker for the yard, earbuds for when the house is asleep.",
			imageUrl: u("photo-1567690187548-f07b1d7bf5a9"),
			productIds: [
				"prod_samsung_crystal_55",
				"prod_jbl_charge_5",
				"prod_airpods_pro_2",
			],
		},
		{
			slug: "travel-commute",
			name: "Travel & commute",
			kind: "manual",
			onLanding: true,
			lede: "Noise cancelling for the trotro, a speaker that survives the trip, and a phone that lasts the day.",
			imageUrl: u("photo-1523206489230-c012c64b2b48"),
			productIds: [
				"prod_airpods_pro_2",
				"prod_jbl_charge_5",
				"prod_pixel_8a",
			],
		},
		{
			slug: "best-sellers",
			name: "Best sellers",
			kind: "smart",
			rule: "unitsSold",
			limit: 4,
			lede: "Ranked by units actually paid for, over a rolling 90 days.",
		},
		{
			slug: "new-in",
			name: "New in",
			kind: "smart",
			rule: "addedAt",
			limit: 4,
			lede: "The four most recent additions to the list.",
		},
	];

	const paymentMethods = [
		{ id: "momo", name: "MTN MoMo", short: "MoMo" },
		{ id: "telecel", name: "Telecel Cash", short: "Telecel" },
		{ id: "card", name: "Visa / Mastercard", short: "Card" },
		{ id: "cod", name: "Cash on delivery", short: "Cash" },
	];

	/* Single-store content: how ordering works, delivery, proof. */
	const steps = [
		{
			n: "01",
			title: "Pick it",
			body: "Every listing shows the real stock count, the specs and what the warranty covers. No guessing.",
		},
		{
			n: "02",
			title: "Pay your way",
			body: "Approve an MTN MoMo or Telecel Cash prompt, tap your card, or pay the rider in cash on delivery.",
		},
		{
			n: "03",
			title: "Track it to your door",
			body: "You get an order number the moment we accept it, and the same number follows the parcel to you.",
		},
	];

	const deliveryZones = [
		{ zone: "Accra & Tema", time: "Same or next day", fee: "Free over GH₵ 1,000" },
		{ zone: "Kumasi & Takoradi", time: "1–2 working days", fee: "GH₵ 40" },
		{ zone: "Other regions", time: "2–4 working days", fee: "GH₵ 60" },
	];

	const reviews = [
		{
			quote:
				"Ordered the AirPods on a Tuesday evening and the rider was at my gate before lunch the next day. The MoMo prompt came through instantly.",
			name: "Ama B.",
			place: "East Legon, Accra",
			rating: 5,
			productId: "prod_airpods_pro_2",
		},
		{
			quote:
				"They told me exactly what the 12-month warranty covers before I paid. First shop that has done that for me.",
			name: "Kwesi O.",
			place: "Kumasi",
			rating: 5,
			productId: "prod_iphone_15_pro",
		},
		{
			quote:
				"Paid cash on delivery for the TV. The driver waited while I plugged it in and checked the picture.",
			name: "Selorm A.",
			place: "Tema",
			rating: 4,
			productId: "prod_samsung_crystal_55",
		},
	];

	const stats = [
		{ value: "8", label: "products in stock today" },
		{ value: "189", label: "verified reviews" },
		{ value: "24h", label: "typical Accra delivery" },
		{ value: "12mo", label: "warranty on flagships" },
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
	function discountPct(p) {
		if (!p.compareAtInPesewas) return 0;
		return Math.round((1 - p.priceInPesewas / p.compareAtInPesewas) * 100);
	}

	const byId = Object.fromEntries(products.map((p) => [p.id, p]));
	const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
	const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
	categories.forEach((c) => {
		c.count = products.filter((p) => p.categorySlug === c.slug).length;
	});
	/* A department with nothing in it reads as a broken shop, so it stays out
	   of the navigation, the hero index, the lookbook and the filter bar until
	   it has stock. The record still exists, ready for the day it does. */
	const stockedCategories = categories.filter((c) => c.count > 0);

	brands.forEach((b) => {
		b.count = products.filter((p) => p.brand === b.name).length;
	});

	const collectionBySlug = Object.fromEntries(collections.map((c) => [c.slug, c]));

	/* Resolves a collection to its products. Manual collections keep the order
	   the editor wrote; smart ones are sorted by their rule and capped. */
	function collectionProducts(slug) {
		const c = collectionBySlug[slug];
		if (!c) return [];
		if (c.kind === "manual") {
			return c.productIds.map((id) => byId[id]).filter(Boolean);
		}
		const ranked = [...products].sort((a, b) =>
			c.rule === "addedAt"
				? String(b.addedAt).localeCompare(String(a.addedAt))
				: (b.unitsSold || 0) - (a.unitsSold || 0),
		);
		return c.limit ? ranked.slice(0, c.limit) : ranked;
	}

	collections.forEach((c) => {
		c.items = collectionProducts(c.slug);
		c.count = c.items.length;
		/* Which departments the collection reaches into. This is the whole
		   point of the layer, so the landing tiles say it out loud. */
		c.departments = [
			...new Set(c.items.map((p) => categoryBySlug[p.categorySlug].name)),
		];
	});

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
			const matchesCollection = filters.collection
				? collectionProducts(filters.collection).some((x) => x.id === p.id)
				: true;
			const matchesSale = filters.onSale ? Boolean(p.compareAtInPesewas) : true;
			const matchesNew = filters.isNew ? Boolean(p.isNew) : true;
			const matchesMax =
				filters.maxPrice != null ? p.priceInPesewas <= filters.maxPrice : true;
			const matchesMin =
				filters.minPrice != null ? p.priceInPesewas >= filters.minPrice : true;
			return (
				matchesQuery &&
				matchesCategory &&
				matchesCollection &&
				matchesBrand &&
				matchesSale &&
				matchesNew &&
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
		whatsapp: "https://wa.me/233000000000",
	};

	window.GEO = Object.assign(window.GEO || {}, {
		STORE_URL,
		FREE_DELIVERY_PESEWAS,
		categories,
		stockedCategories,
		collections,
		collectionBySlug,
		collectionProducts,
		products,
		brands,
		paymentMethods,
		steps,
		deliveryZones,
		reviews,
		stats,
		faqs,
		formatMoney,
		discountPct,
		filterProducts,
		byId,
		bySlug,
		categoryBySlug,
		urls,
		img: u,
	});
})();
