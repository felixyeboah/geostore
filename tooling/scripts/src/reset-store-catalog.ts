import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type InStatement, type InValue } from "@libsql/client";
import {
	normalizeOptionMedia,
	normalizeVariantAttributes,
	variantDisplayName,
} from "@repo/commerce";
import {
	STORE_CATEGORIES,
	STORE_COLLECTIONS,
	STORE_PRODUCTS,
} from "@repo/commerce/seed-catalog";

// A destructive reset is separate from the convergent, non-destructive seed command.
// Default invocation only reports counts. The host must be explicitly repeated.
const HISTORY_TABLES = [
	"store_webhook_event",
	"store_inventory_event",
	"store_review",
	"store_order_item",
	"store_transaction",
	"store_order_status_event",
	"store_order",
] as const;

const TABLES = [
	...HISTORY_TABLES,
	"store_product_collection",
	"store_product_image",
	"store_product_variant",
	"store_product",
	"store_collection",
	"store_category",
] as const;

function insert(table: string, data: Record<string, InValue>): InStatement {
	const columns = Object.keys(data);
	return {
		sql: `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
		args: Object.values(data),
	};
}

function catalogStatements(): InStatement[] {
	const now = new Date().toISOString();
	const statements: InStatement[] = [];
	const categoryIds = new Map(
		STORE_CATEGORIES.map((category) => [
			category.slug,
			`category-${category.slug}`,
		]),
	);
	const manualCollections = STORE_COLLECTIONS.filter(
		(collection) => collection.kind === "manual",
	);
	const collectionIds = new Map(
		manualCollections.map((collection) => [
			collection.slug,
			`collection-${collection.slug}`,
		]),
	);
	for (const [sortOrder, category] of STORE_CATEGORIES.entries()) {
		statements.push(
			insert("store_category", {
				id: `category-${category.slug}`,
				name: category.name,
				slug: category.slug,
				description: category.description,
				imageUrl: category.imageUrl ?? null,
				isActive: true,
				sortOrder,
				createdAt: now,
				updatedAt: now,
			}),
		);
	}
	for (const [sortOrder, collection] of manualCollections.entries()) {
		statements.push(
			insert("store_collection", {
				id: `collection-${collection.slug}`,
				name: collection.name,
				slug: collection.slug,
				description: collection.description,
				imageUrl: collection.imageUrl ?? null,
				isActive: true,
				onLanding: collection.onLanding,
				sortOrder,
				createdAt: now,
				updatedAt: now,
			}),
		);
	}
	for (const product of STORE_PRODUCTS) {
		const categoryId = categoryIds.get(product.categorySlug);
		if (!categoryId) {
			throw new Error(`Missing category: ${product.slug}`);
		}
		const variants = product.variants ?? [];
		const media = normalizeOptionMedia(product.optionMedia ?? []);
		statements.push(
			insert("store_product", {
				id: product.id,
				name: product.name,
				slug: product.slug,
				sku: product.sku,
				shortDescription: product.shortDescription,
				description: product.description,
				brand: product.brand,
				status: "ACTIVE",
				condition: product.condition,
				priceInPesewas: product.priceInPesewas,
				compareAtInPesewas: product.compareAtInPesewas ?? null,
				stockQuantity: variants.length
					? variants.reduce(
							(sum, variant) => sum + variant.stockQuantity,
							0,
						)
					: product.stockQuantity,
				lowStockThreshold: 5,
				isFeatured: product.isFeatured,
				unitsSold: 0,
				specifications: JSON.stringify(product.specifications),
				optionStyles: JSON.stringify(
					media
						.filter((item) => item.hex)
						.map(({ axis, value, hex }) => ({ axis, value, hex })),
				),
				categoryId,
				publishedAt: new Date(product.addedAt).toISOString(),
				createdAt: now,
				updatedAt: now,
			}),
		);
		const images = [
			...product.images.map((url) => ({
				url,
				alt: product.name,
				optionAxis: null,
				optionValue: null,
			})),
			...media.flatMap((item) =>
				item.images.map((url) => ({
					url,
					alt: `${product.name} — ${item.value}`,
					optionAxis: item.axis,
					optionValue: item.value,
				})),
			),
		];
		for (const [sortOrder, image] of images.entries()) {
			statements.push(
				insert("store_product_image", {
					id: randomUUID(),
					productId: product.id,
					...image,
					sortOrder,
					createdAt: now,
				}),
			);
		}
		for (const variant of variants) {
			statements.push(
				insert("store_product_variant", {
					id: variant.id,
					productId: product.id,
					name: variantDisplayName(variant),
					sku: variant.sku,
					attributes: JSON.stringify(
						normalizeVariantAttributes(variant.attributes),
					),
					priceInPesewas: variant.priceInPesewas,
					compareAtInPesewas: variant.compareAtInPesewas ?? null,
					stockQuantity: variant.stockQuantity,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				}),
			);
		}
		for (const [sortOrder, slug] of (
			product.collectionSlugs ?? []
		).entries()) {
			const collectionId = collectionIds.get(slug);
			if (!collectionId) {
				throw new Error(`Missing manual collection: ${slug}`);
			}
			statements.push(
				insert("store_product_collection", {
					productId: product.id,
					collectionId,
					sortOrder,
					createdAt: now,
				}),
			);
		}
	}
	return statements;
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}
	const host = new URL(databaseUrl).hostname;
	const apply = process.argv.includes("--apply");
	const confirmedHost = process.argv
		.find((arg) => arg.startsWith("--database-host="))
		?.slice("--database-host=".length);
	if (
		apply &&
		(confirmedHost !== host ||
			!process.argv.includes("--clear-commerce-history"))
	) {
		throw new Error(
			"Apply requires --database-host=<exact target host> and --clear-commerce-history",
		);
	}
	const client = createClient({
		url: databaseUrl,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	try {
		const counts = await client.batch(
			TABLES.map(
				(table) =>
					`SELECT '${table}' AS name, COUNT(*) AS count FROM "${table}"`,
			),
			"read",
		);
		console.info(
			JSON.stringify(
				{
					host,
					apply,
					existing: counts.flatMap((result) => result.rows),
					replacement: {
						categories: STORE_CATEGORIES.length,
						collections: STORE_COLLECTIONS.filter(
							(row) => row.kind === "manual",
						).length,
						products: STORE_PRODUCTS.length,
					},
				},
				null,
				2,
			),
		);
		const seed = catalogStatements();
		if (!apply) {
			return;
		}
		const backupDir = process.env.CATALOG_BACKUP_DIR;
		if (!backupDir) {
			throw new Error("CATALOG_BACKUP_DIR is required for apply");
		}
		await mkdir(backupDir, { recursive: true, mode: 0o700 });
		// Hold a write transaction from backup through replacement: no commerce
		// rows can appear between the snapshot and its atomic deletion/reseed.
		const transaction = await client.transaction("write");
		try {
			const rows = await transaction.batch(
				TABLES.map((table) => `SELECT * FROM "${table}"`),
			);
			const snapshot = Object.fromEntries(
				TABLES.map((table, index) => [table, rows[index].rows]),
			);
			// Re-enriching the production seed must not erase commerce that
			// arrived since the previous seed. Check under the same write lock.
			if (
				process.argv.includes("--require-empty-commerce-history") &&
				HISTORY_TABLES.some((table) => snapshot[table].length > 0)
			) {
				throw new Error(
					"Commerce history exists; refusing catalog replacement. Use a preserving migration instead.",
				);
			}
			const backupPath = path.join(
				backupDir,
				`catalog-${Date.now()}.json`,
			);
			await writeFile(
				backupPath,
				JSON.stringify(
					{
						host,
						tables: snapshot,
					},
					null,
					2,
				),
				{ mode: 0o600, flag: "wx" },
			);
			await transaction.batch([
				...TABLES.map((table) => `DELETE FROM "${table}"`),
				...seed,
			]);
			const foreignKeys = await transaction.execute(
				"PRAGMA foreign_key_check",
			);
			if (foreignKeys.rows.length) {
				throw new Error("Catalog replacement violates foreign keys");
			}
			await transaction.commit();
			console.info(`Catalog reset committed. Backup: ${backupPath}`);
		} catch (error) {
			await transaction.rollback();
			throw error;
		} finally {
			transaction.close();
		}
	} finally {
		client.close();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
