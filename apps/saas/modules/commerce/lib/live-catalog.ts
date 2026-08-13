import {
	getPublishedStoreProductBySlug,
	getPublishedStoreProducts,
	getStoreCategories,
} from "@repo/database";
import type {
	ProductFilters,
	StoreCategory,
	StoreProduct,
	StoreReview,
} from "../types";

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
	user: { name: string };
}): StoreReview {
	return {
		rating: review.rating,
		title: review.title ?? "Verified purchase",
		body: review.body,
		createdAt: review.createdAt.toISOString(),
		customerName: review.user.name,
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
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	stockQuantity: number;
	isFeatured: boolean;
	createdAt: Date;
	specifications: unknown;
	category: { slug: string };
	images: Array<{ url: string }>;
	reviews: Array<{
		rating: number;
		title?: string | null;
		body?: string;
		createdAt?: Date;
		user?: { name: string };
	}>;
}): StoreProduct {
	const images = product.images.map((image) => image.url);
	const detailedReviews = product.reviews.flatMap((review) =>
		review.body && review.createdAt && review.user
			? [
					mapReview({
						rating: review.rating,
						title: review.title ?? null,
						body: review.body,
						createdAt: review.createdAt,
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
		priceInPesewas: product.priceInPesewas,
		compareAtInPesewas: product.compareAtInPesewas ?? undefined,
		stockQuantity: product.stockQuantity,
		imageUrl: images[0] ?? "/images/product-placeholder.svg",
		images,
		rating: calculateRating(product.reviews),
		reviewCount: product.reviews.length,
		isFeatured: product.isFeatured,
		isNew:
			Date.now() - product.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000,
		specifications: parseSpecifications(product.specifications),
		reviews: detailedReviews,
	};
}

export async function getLiveCategories(): Promise<StoreCategory[]> {
	const categories = await getStoreCategories();
	return categories.map((category) => ({
		name: category.name,
		slug: category.slug,
		description:
			category.description ?? "Browse products in this category.",
		imageUrl: category.imageUrl ?? "/images/product-placeholder.svg",
	}));
}

export async function getLiveProducts(
	filters: ProductFilters = {},
): Promise<StoreProduct[]> {
	const products = await getPublishedStoreProducts({
		query: filters.query,
		categorySlug: filters.category,
		brand: filters.brand,
	});
	const mappedProducts = products.map(mapProduct);

	return mappedProducts.sort((left, right) => {
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

export async function getLiveProductBySlug(
	slug: string,
): Promise<StoreProduct | null> {
	const product = await getPublishedStoreProductBySlug(slug);
	return product ? mapProduct(product) : null;
}
