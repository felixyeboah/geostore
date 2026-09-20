/**
 * The words the landing page ships with.
 *
 * These used to sit in the storefront's own copy file, which meant the admin
 * editing them could not see them: its fields were blank boxes labelled
 * "Using the built-in text". They live here because both apps need them —
 * the storefront to render a band nobody has overridden, the back office to
 * show an editor what they are changing before they change it.
 *
 * Keys match the field keys in LANDING_SECTIONS.
 */
export const LANDING_COPY = {
	hero: {
		eyebrow: "Electronics, delivered across Ghana",
		titleLine1: "Tech for",
		titleLine2: "every part",
		titleLine3: "of",
		titleAccent: "your life.",
		subtitle1: "Phones, computers, gaming and home appliances.",
		subtitle2: "Delivered anywhere in Ghana.",
		primaryCta: "Shop all products",
		secondaryCta: "Ask about a product",
		tagline: ["Phones.", "Computers.", "Appliances."],
		card: {
			eyebrow: "Folds flat into a drawing board.",
			spotlight: "In the spotlight",
			product: "Surface Laptop Studio 2",
		},
	},
	brands: {
		line1: "The brands",
		line2: "we stock.",
	},
	categories: {
		eyebrow: "Shop by category",
		title: "Every category we stock.",
		link: "Shop all categories",
		items: {
			phones: "Phones",
			laptops: "Laptops & Computers",
			gaming: "Gaming",
			appliances: "Home Appliances",
			monitors: "Monitors & Displays",
			accessories: "Accessories",
			office: "Office Equipment",
			tv: "TVs & Audio",
			fridges: "Fridges & Freezers",
			laundry: "Washing Machines",
			kitchen: "Kitchen Appliances",
			cooling: "Cooling & Air",
			tablets: "Tablets",
			wearables: "Wearables",
			audio: "Headphones & Audio",
		},
	},
	edit: {
		eyebrow: "The GeoStores edit",
		title: "What we’d buy ourselves.",
		link: "View all products",
		price: "Contact for price",
		note: "Prices, exact models and stock change. Ask us before you order.",
		giftCard: {
			brand: "PlayStation",
			title1: "More ways",
			title2: "to play.",
			eyebrow: "Gift cards",
		},
	},
	gaming: {
		eyebrow: "The gaming collection",
		title1: "Level up",
		title2: "your setup.",
		subtitle1: "Consoles, controllers, headsets and ultrawide monitors.",
		subtitle2: "Tell us what your setup is missing.",
		cta: "Shop gaming",
		link: "Discover the Samsung Odyssey G9",
		caption: "The Odyssey G9. 49 inches, curved.",
	},
	computing: {
		eyebrow: "Laptops, desktops and monitors",
		title: "The right machine for the job.",
		link: "Shop computing",
		card: {
			eyebrow: "Microsoft Surface",
			title1: "Laptop, tablet",
			title2: "and studio in one.",
			link: "Discover Surface Laptop Studio 2",
		},
		listEyebrow: "What people buy most",
		explore: "See the full range",
		workspace: {
			title: "Complete your workspace",
			subtitle: "Printers, UPS and networking",
		},
	},
	appliances: {
		eyebrow: "For the rest of the house",
		title1: "Fridges, washers,",
		title2: "cookers and fans.",
		description:
			"The same store that sells you a laptop will deliver your fridge. Big appliances, same delivery, same support.",
		cta: "Shop home appliances",
		note: "Illustrative imagery. Ask about available models.",
		badge: "Delivered to your door.",
	},
	about: {
		eyebrow: "Meet GeoStoresGH",
		title1: "One store.",
		title2: "Every department.",
		description:
			"GeoStoresGH sells phones, computing, gaming, home appliances and everyday accessories, across Ghana.",
		items: {
			wider: {
				title: "More than one department",
				description:
					"Phones, laptops, TVs, fridges and washers, across twelve departments.",
			},
			fit: {
				title: "Find what fits",
				description:
					"Browse by category, compare the specs, then decide.",
			},
			conversation: {
				title: "Ask before you buy",
				description:
					"Send us the model you’re after and we’ll confirm the spec and the price.",
			},
		},
	},
	enquiry: {
		eyebrow: "Not sure what to buy?",
		title1: "Tell us what you need.",
		title2: "We’ll find it.",
		subtitle: "Send the model, or just describe what it’s for.",
		cta: "Make an enquiry",
	},
	trust: {
		delivery: {
			title: "Delivery across Ghana",
			description:
				"Accra and nationwide. Timing depends on destination and stock.",
		},
		payment: {
			title: "Pay your way",
			description: "Mobile money, card or cash on delivery.",
		},
		support: {
			title: "48-hour support",
			description:
				"Tell us within 48 hours if anything arrives damaged or faulty.",
		},
		advice: {
			title: "Advice before you buy",
			description: "Ask about the exact model, spec and current price.",
		},
	},
	departments: {
		eyebrow: "Browse the store",
		title1: "Twelve departments.",
		title2: "One checkout.",
		description:
			"Fridges, washers, cookers and fans sit alongside phones, laptops and gaming. Browse every department, or tell us what you need and we’ll find it.",
		link: "Browse the whole store",
		items: {
			phones: {
				name: "Phones & tablets",
				note: "iPhone, Galaxy, Pixel and more",
			},
			computers: {
				name: "Laptops & computers",
				note: "Everyday, creator and gaming",
			},
			tv: {
				name: "TVs & audio",
				note: "Smart TVs, soundbars, speakers",
			},
			gaming: {
				name: "Gaming",
				note: "Consoles, controllers, headsets",
			},
			fridges: {
				name: "Fridges & freezers",
				note: "Side-by-side, bottom-freezer, compact",
			},
			laundry: {
				name: "Washing machines & dryers",
				note: "Front-load, top-load, washer-dryers",
			},
			kitchen: {
				name: "Kitchen appliances",
				note: "Microwaves, cookers, blenders, kettles",
			},
			cooling: {
				name: "Cooling & air",
				note: "Air conditioners, fans, purifiers",
			},
			monitors: {
				name: "Monitors & displays",
				note: "Office, creator and ultrawide",
			},
			wearables: {
				name: "Wearables & audio",
				note: "Watches, earbuds, headphones",
			},
			accessories: {
				name: "Accessories",
				note: "Chargers, cases, cables, storage",
			},
			office: {
				name: "Office equipment",
				note: "Printers, UPS, networking",
			},
		},
	},
	products: {
		eyebrow: "Popular right now",
		title: "What people are asking about.",
		link: "See all products",
		new: "New",
		reviews: "{count} reviews",
		was: "Was",
	},
	kitchen: {
		eyebrow: "Kitting out a kitchen?",
		title1: "Fridge, washer, cooker.",
		title2: "One delivery.",
		description:
			"Tell us what the space needs and we’ll put the set together, quote it as one price and deliver it in one trip.",
		cta: "Ask for a bundle price",
		secondary: "Browse home appliances",
		items: [
			"Fridges & freezers",
			"Washing machines & dryers",
			"Cookers & microwaves",
			"Air conditioning & fans",
		],
	},
	needs: {
		eyebrow: "Shop by need",
		title: "Start with what you’re doing.",
		items: {
			wfh: {
				badge: "Popular",
				title: "Work from home",
				subtitle:
					"Laptop, monitor, keyboard and a UPS that keeps you online.",
			},
			school: {
				badge: "Student picks",
				title: "Back to school",
				subtitle: "Laptops and tablets built to last the term.",
			},
			newhome: {
				badge: "Bundle",
				title: "New home essentials",
				subtitle: "Fridge, washer, TV and cooker, quoted as one.",
			},
			gaming: {
				badge: "New in",
				title: "Game night",
				subtitle: "Consoles, ultrawide monitors and headsets.",
			},
			kitchen: {
				badge: "Bundle",
				title: "Kitchen refresh",
				subtitle: "Microwave, coffee machine, blender and kettle.",
			},
			phone: {
				badge: "Popular",
				title: "Phone upgrade",
				subtitle:
					"iPhone, Galaxy or Pixel with the accessories to match.",
			},
		},
	},
} as const;

type LandingCopy = typeof LANDING_COPY;

/**
 * The shipped text for one field, or "" when the field has none.
 *
 * Not every entry under a section is an editable field — a tagline list and
 * the hero's card are structure, not copy — so anything that is not a plain
 * string is reported as absent rather than stringified into a form input.
 */
export function landingFieldDefault(
	sectionKey: string,
	fieldKey: string,
): string {
	// Field keys may be dotted to reach nested copy, such as the hero card's
	// own eyebrow at `card.eyebrow`.
	const value = [sectionKey, ...fieldKey.split(".")].reduce<unknown>(
		(current, key) =>
			current && typeof current === "object"
				? (current as Record<string, unknown>)[key]
				: undefined,
		LANDING_COPY,
	);

	return typeof value === "string" ? value : "";
}

export type { LandingCopy };
