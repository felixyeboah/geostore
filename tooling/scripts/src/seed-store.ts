import { normalizeVariantAttributes, variantDisplayName } from "@repo/commerce";
import {
	STORE_CATEGORIES,
	STORE_COLLECTIONS,
	STORE_PRODUCTS,
} from "@repo/commerce/seed-catalog";
import { db } from "@repo/database";

/**
 * Departments that were renamed after launch. Upserting by slug would leave
 * the old row behind with its products still attached, so the rename has to
 * happen before anything else. The storefront redirects the old URLs.
 */
const RENAMED_CATEGORY_SLUGS: Array<{ from: string; to: string }> = [
	{ from: "wearables", to: "watches-wearables" },
	{ from: "home-tech", to: "home-tv" },
];

/**
 * Products whose slug carried a now-variant dimension — "…-55-tv" made no
 * sense once the listing gained a size axis. The old rows are archived rather
 * than deleted so any order lines pointing at them keep their product.
 */
const RETIRED_PRODUCT_SLUGS = [
	"samsung-55-crystal-uhd-tv",
	"hisense-43-smart-tv",
	"lg-65-qned-4k-tv",
	"sandisk-ultra-128gb-microsd",
];

async function renameLegacyCategories() {
	for (const { from, to } of RENAMED_CATEGORY_SLUGS) {
		const existing = await db.category.findUnique({
			where: { slug: from },
		});

		if (!existing) {
			continue;
		}

		const target = await db.category.findUnique({ where: { slug: to } });

		if (target) {
			// Both exist, so move the products across and drop the old row.
			await db.product.updateMany({
				where: { categoryId: existing.id },
				data: { categoryId: target.id },
			});
			await db.category.delete({ where: { id: existing.id } });
		} else {
			await db.category.update({
				where: { id: existing.id },
				data: { slug: to },
			});
		}

		console.info(`Renamed department ${from} to ${to}.`);
	}
}

async function seedStore() {
	await renameLegacyCategories();
	await db.product.updateMany({
		where: { slug: { in: RETIRED_PRODUCT_SLUGS } },
		data: { status: "ARCHIVED" },
	});

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

	// Smart collections carry no stored membership, so only the manual ones
	// get rows in the join table.
	const collectionIds = new Map<string, string>();

	for (const [sortOrder, collection] of STORE_COLLECTIONS.entries()) {
		if (collection.kind !== "manual") {
			continue;
		}

		const savedCollection = await db.collection.upsert({
			where: { slug: collection.slug },
			create: {
				name: collection.name,
				slug: collection.slug,
				description: collection.description,
				imageUrl: collection.imageUrl,
				onLanding: collection.onLanding,
				isActive: true,
				sortOrder,
			},
			update: {
				name: collection.name,
				description: collection.description,
				imageUrl: collection.imageUrl,
				onLanding: collection.onLanding,
				isActive: true,
				sortOrder,
			},
		});

		collectionIds.set(collection.slug, savedCollection.id);
	}

	for (const product of STORE_PRODUCTS) {
		const categoryId = categoryIds.get(product.categorySlug);

		if (!categoryId) {
			throw new Error(`Missing category for ${product.name}`);
		}

		const shared = {
			name: product.name,
			shortDescription: product.shortDescription,
			description: product.description,
			brand: product.brand,
			sku: product.sku,
			status: "ACTIVE" as const,
			condition: product.condition,
			priceInPesewas: product.priceInPesewas,
			compareAtInPesewas: product.compareAtInPesewas ?? null,
			stockQuantity: product.stockQuantity,
			isFeatured: product.isFeatured,
			unitsSold: product.unitsSold,
			specifications: product.specifications,
			categoryId,
			publishedAt: new Date(product.addedAt),
		};

		const images = product.images.map((url, sortOrder) => ({
			url,
			alt: product.name,
			sortOrder,
		}));

		const variants = (product.variants ?? []).map((variant) => ({
			id: variant.id,
			name: variantDisplayName(variant),
			sku: variant.sku,
			priceInPesewas: variant.priceInPesewas,
			compareAtInPesewas: variant.compareAtInPesewas ?? null,
			stockQuantity: variant.stockQuantity,
			attributes: normalizeVariantAttributes(variant.attributes),
			isActive: true,
		}));

		// With variants the row-level stock is only a fallback — the real count
		// lives on the options, so keep it as their sum for the admin table.
		const stockQuantity = variants.length
			? variants.reduce((sum, variant) => sum + variant.stockQuantity, 0)
			: shared.stockQuantity;

		const saved = await db.product.upsert({
			where: { slug: product.slug },
			create: {
				id: product.id,
				slug: product.slug,
				...shared,
				stockQuantity,
				images: { create: images },
				variants: { create: variants },
			},
			update: {
				...shared,
				stockQuantity,
				images: { deleteMany: {}, create: images },
			},
		});

		// Reseeds converge options too: skus in the catalogue are upserted, and
		// ones that left the catalogue are retired rather than deleted, since an
		// order line may still point at them.
		const keepSkus = variants.map((variant) => variant.sku);
		await db.productVariant.updateMany({
			where: { productId: saved.id, sku: { notIn: keepSkus } },
			data: { isActive: false },
		});
		for (const variant of variants) {
			await db.productVariant.upsert({
				where: { sku: variant.sku },
				create: { ...variant, productId: saved.id },
				update: {
					name: variant.name,
					priceInPesewas: variant.priceInPesewas,
					compareAtInPesewas: variant.compareAtInPesewas,
					stockQuantity: variant.stockQuantity,
					attributes: variant.attributes,
					isActive: true,
				},
			});
		}

		// Rewrite membership rather than merging it, so removing a product
		// from a collection in the catalogue actually removes it here.
		await db.productCollection.deleteMany({
			where: { productId: product.id },
		});

		const memberships = (product.collectionSlugs ?? [])
			.map((slug, sortOrder) => ({
				collectionId: collectionIds.get(slug),
				sortOrder,
			}))
			.filter(
				(row): row is { collectionId: string; sortOrder: number } =>
					row.collectionId !== undefined,
			);

		if (memberships.length > 0) {
			await db.productCollection.createMany({
				data: memberships.map((row) => ({
					productId: product.id,
					collectionId: row.collectionId,
					sortOrder: row.sortOrder,
				})),
			});
		}
	}

	console.info(
		`Seeded ${STORE_CATEGORIES.length} departments, ${collectionIds.size} collections and ${STORE_PRODUCTS.length} products.`,
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
