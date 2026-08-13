import { db } from "@repo/database";
import {
	STORE_CATEGORIES,
	STORE_PRODUCTS,
} from "../../../apps/saas/modules/commerce/data/catalog";

async function seedStore() {
	const categoryIds = new Map<string, string>();

	for (const [sortOrder, category] of STORE_CATEGORIES.entries()) {
		const savedCategory = await db.category.upsert({
			where: { slug: category.slug },
			create: {
				name: category.name,
				slug: category.slug,
				description: category.description,
				imageUrl: category.imageUrl,
				isActive: true,
				sortOrder,
			},
			update: {
				name: category.name,
				description: category.description,
				imageUrl: category.imageUrl,
				isActive: true,
				sortOrder,
			},
		});

		categoryIds.set(category.slug, savedCategory.id);
	}

	for (const product of STORE_PRODUCTS) {
		const categoryId = categoryIds.get(product.categorySlug);

		if (!categoryId) {
			throw new Error(`Missing category for ${product.name}`);
		}

		await db.product.upsert({
			where: { slug: product.slug },
			create: {
				id: product.id,
				name: product.name,
				slug: product.slug,
				shortDescription: product.shortDescription,
				description: product.description,
				brand: product.brand,
				sku: product.sku,
				status: "ACTIVE",
				priceInPesewas: product.priceInPesewas,
				compareAtInPesewas: product.compareAtInPesewas,
				stockQuantity: product.stockQuantity,
				isFeatured: product.isFeatured,
				specifications: product.specifications,
				categoryId,
				publishedAt: new Date(),
				images: {
					create: product.images.map((url, sortOrder) => ({
						url,
						alt: product.name,
						sortOrder,
					})),
				},
			},
			update: {
				name: product.name,
				shortDescription: product.shortDescription,
				description: product.description,
				brand: product.brand,
				sku: product.sku,
				status: "ACTIVE",
				priceInPesewas: product.priceInPesewas,
				compareAtInPesewas: product.compareAtInPesewas,
				stockQuantity: product.stockQuantity,
				isFeatured: product.isFeatured,
				specifications: product.specifications,
				categoryId,
				publishedAt: new Date(),
				images: {
					deleteMany: {},
					create: product.images.map((url, sortOrder) => ({
						url,
						alt: product.name,
						sortOrder,
					})),
				},
			},
		});
	}

	console.info(
		`Seeded ${STORE_CATEGORIES.length} categories and ${STORE_PRODUCTS.length} products.`,
	);
}

seedStore()
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
