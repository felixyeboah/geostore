export interface StoreCategory {
	name: string;
	slug: string;
	description: string;
	imageUrl: string;
}

export interface StoreProduct {
	id: string;
	name: string;
	slug: string;
	brand: string;
	categorySlug: string;
	shortDescription: string;
	description: string;
	sku: string;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	stockQuantity: number;
	imageUrl: string;
	images: string[];
	rating: number;
	reviewCount: number;
	isFeatured: boolean;
	isNew: boolean;
	specifications: Record<string, string>;
	reviews?: StoreReview[];
}

export interface StoreReview {
	rating: number;
	title: string;
	body: string;
	createdAt: string;
	customerName: string;
}

export type ProductSort = "featured" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
	query?: string;
	category?: string;
	brand?: string;
	sort?: ProductSort;
}
