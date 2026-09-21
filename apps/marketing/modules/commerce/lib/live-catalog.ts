import type {
	ProductFilters,
	StoreCategory,
	StoreCollection,
	StoreProduct,
	StoreProductCondition,
	StoreReview,
} from "@repo/commerce";
import {
	getSmartCollection,
	optionMediaFromStorage,
	SMART_COLLECTIONS,
} from "@repo/commerce";
import {
	getPublishedStoreProductBySlug,
	getPublishedStoreProducts,
	getStoreCategories,
	getStoreCollections,
} from "@repo/database";

function parseSpecifications(value: unknown): Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(value).flatMap(([key, specification]) =>
			typeof specification === "string" ? [[key, specification]] : [],
		),
	);
}

function calculateRating(reviews: Array<{ rating: number }>): number {
	if (reviews.length === 0) {
		return 0;
	}

	const total = reviews.reduce((sum, review) => sum + review.rating, 0);
	return Math.round((total / reviews.length) * 10) / 10;
}

function mapReview(review: {
	rating: number;
	title: string | null;
	body: string;
	createdAt: Date;
	/** Taken from the order the review is anchored to. */
	authorName?: string | null;
	/** Only set when the buyer happened to have an account. */
	user?: { name: string } | null;
}): StoreReview {
	return {
		rating: review.rating,
		title: review.title ?? "Verified purchase",
		body: review.body,
		createdAt: review.createdAt.toISOString(),
		// The account name first when there is one, because it is the name
		// they chose; otherwise the name from the order.
		customerName:
			review.user?.name ?? review.authorName ?? "Verified customer",
	};
}

function mapProduct(product: {
	id: string;
	name: string;
	slug: string;
	brand: string;
	shortDescription: string | null;
	description: string;
	sku: string;
	condition: StoreProductCondition;
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	stockQuantity: number;
	isFeatured: boolean;
	unitsSold: number;
	publishedAt: Date | null;
	createdAt: Date;
	specifications: unknown;
	category: { slug: string };
	optionStyles?: unknown;
	images: Array<{
		url: string;
		optionAxis?: string | null;
		optionValue?: string | null;
	}>;
	reviews: Array<{
		rating: number;
		title?: string | null;
		body?: string;
		createdAt?: Date;
		/** From the order — every review has one. */
		authorName?: string | null;
		/** Only when the buyer had an account, which most will not. */
		user?: { name: string } | null;
	}>;
	variants?: Array<{
		id: string;
		name: string;
		sku: string;
		priceInPesewas: number;
		compareAtInPesewas: number | null;
		stockQuantity: number;
		attributes: unknown;
	}>;
}): StoreProduct {
	// `images` stays the untagged base set — the cover, the SEO photo, the
	// shots that show for every option. Tagged shots are rebuilt into
	// `optionMedia` so the PDP gallery can swap when a value is picked.
	const optionMedia = optionMediaFromStorage(
		product.images,
		product.optionStyles,
	);
	const images = product.images
		.filter((image) => !image.optionAxis)
		.map((image) => image.url);
	const detailedReviews = product.reviews.flatMap((review) =>
		// A review no longer needs an account behind it — this shop has no
		// customer sign-up, so requiring `user` here dropped every guest
		// review on the floor without a trace.
		review.body && review.createdAt
			? [
					mapReview({
						rating: review.rating,
						title: review.title ?? null,
						body: review.body,
						createdAt: review.createdAt,
						authorName: review.authorName,
						user: review.user,
					}),
				]
			: [],
	);

	return {
		id: product.id,
		name: product.name,
		slug: product.slug,
		brand: product.brand,
		categorySlug: product.category.slug,
		shortDescription: product.shortDescription ?? product.description,
		description: product.description,
		sku: product.sku,
		condition: product.condition,
		priceInPesewas: product.priceInPesewas,
		compareAtInPesewas: product.compareAtInPesewas ?? undefined,
		stockQuantity: product.stockQuantity,
		imageUrl: images[0] ?? "/images/product-placeholder.svg",
		images,
		optionMedia: optionMedia.length ? optionMedia : undefined,
		rating: calculateRating(product.reviews),
		reviewCount: product.reviews.length,
		isFeatured: product.isFeatured,
		isNew:
			Date.now() - (product.publishedAt ?? product.createdAt).getTime() <
			90 * 24 * 60 * 60 * 1000,
		unitsSold: product.unitsSold,
		addedAt: (product.publishedAt ?? product.createdAt).toISOString(),
		specifications: parseSpecifications(product.specifications),
		reviews: detailedReviews,
		variants: (product.variants ?? []).map((variant) => ({
			id: variant.id,
			name: variant.name,
			sku: variant.sku,
			priceInPesewas: variant.priceInPesewas,
			compareAtInPesewas: variant.compareAtInPesewas ?? undefined,
			stockQuantity: variant.stockQuantity,
			attributes: parseSpecifications(variant.attributes),
		})),
	};
}

export async function getLiveCategories(options?: {
	/** Drop departments with nothing on the shelf. */
	stockedOnly?: boolean;
}): Promise<StoreCategory[]> {
	const categories = await getStoreCategories();
	return categories
		.filter(
			(category) =>
				!options?.stockedOnly || (category._count?.products ?? 0) > 0,
		)
		.map((category) => ({
			name: category.name,
			slug: category.slug,
			description:
				category.description ?? "Browse products in this category.",
			imageUrl: category.imageUrl ?? "/images/product-placeholder.svg",
		}));
}

/**
 * Manual collections come from the database. The smart ones are rules, so
 * they are appended from the shared definition rather than stored.
 */
export async function getLiveCollections(options?: {
	onLandingOnly?: boolean;
	includeSmart?: boolean;
}): Promise<StoreCollection[]> {
	const collections = await getStoreCollections({
		onLandingOnly: options?.onLandingOnly,
	});

	const manual: StoreCollection[] = collections
		.filter((collection) => (collection._count?.products ?? 0) > 0)
		.map((collection) => ({
			name: collection.name,
			slug: collection.slug,
			description:
				collection.description ?? "A hand-picked group of products.",
			imageUrl: collection.imageUrl ?? undefined,
			onLanding: collection.onLanding,
			kind: "manual" as const,
		}));

	if (!options?.includeSmart) {
		return manual;
	}

	return [...manual, ...SMART_COLLECTIONS];
}

export async function getLiveCollectionBySlug(
	slug: string,
): Promise<StoreCollection | null> {
	const smart = getSmartCollection(slug);

	if (smart) {
		return smart;
	}

	const collections = await getLiveCollections();
	return collections.find((entry) => entry.slug === slug) ?? null;
}

export async function getLiveProducts(
	filters: ProductFilters = {},
): Promise<StoreProduct[]> {
	// A smart collection ranks the whole catalogue; a manual one reads its
	// stored membership. Only one of the two ever applies.
	const smart = filters.collection
		? getSmartCollection(filters.collection)
		: undefined;

	const products = await getPublishedStoreProducts({
		query: filters.query,
		categorySlug: filters.category,
		collectionSlug: smart ? undefined : filters.collection,
		smartRule: smart?.rule,
		limit: smart?.limit,
		brand: filters.brand,
		brands: filters.brands,
		minPriceInPesewas: filters.minPriceInPesewas,
		maxPriceInPesewas: filters.maxPriceInPesewas,
		inStockOnly: filters.inStock,
		onSaleOnly: filters.onSale,
	});
	const mappedProducts = products
		.map(mapProduct)
		// "On sale" means the compare-at price genuinely beats the current one,
		// which needs both values side by side.
		.filter(
			(product) =>
				!filters.onSale ||
				(product.compareAtInPesewas !== undefined &&
					product.compareAtInPesewas > product.priceInPesewas),
		);

	return mappedProducts.sort((left, right) => {
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
				// A smart collection's own ranking is the point of it, so an
				// unspecified sort leaves the database order alone.
				return smart
					? 0
					: Number(right.isFeatured) - Number(left.isFeatured);
		}
	});
}

export async function getLiveProductBySlug(
	slug: string,
): Promise<StoreProduct | null> {
	const product = await getPublishedStoreProductBySlug(slug);
	return product ? mapProduct(product) : null;
}
