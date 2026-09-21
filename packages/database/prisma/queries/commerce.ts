import { randomUUID } from "node:crypto";
import {
	calculateDeliveryFeeInPesewas,
	DEFAULT_DISPATCH_WINDOW_HOURS,
} from "@repo/utils";
import { db } from "../client";
import {
	type OrderStatus,
	Prisma,
	type ProductCondition,
	type ProductStatus,
	type StorePaymentMethod,
	type StorePaymentStatus,
} from "../generated/client";
import { StoreOperationError } from "./errors";
import { newProductSku, newVariantSku } from "./product-sku";
import { getDeliveryRule } from "./store-settings";
import { storefrontSearchWhere } from "./storefront-search";

/** How a smart collection ranks the catalogue to find its own members. */
export type StoreSmartCollectionRule = "best-selling" | "newest";

export interface StoreProductFilters {
	query?: string;
	categorySlug?: string;
	/** Membership of a stored (manual) collection. */
	collectionSlug?: string;
	/**
	 * Rank the whole catalogue instead of reading stored membership. This is
	 * how a smart collection such as "Best sellers" resolves; combine it with
	 * `limit` to cap the result.
	 */
	smartRule?: StoreSmartCollectionRule;
	limit?: number;
	/** Single brand, kept for the admin catalogue. */
	brand?: string;
	/** Several brands at once, which is what the storefront filter bar sends. */
	brands?: string[];
	minPriceInPesewas?: number;
	maxPriceInPesewas?: number;
	/** Only products with stock on hand. */
	inStockOnly?: boolean;
	/** Only products carrying a compare-at price. */
	onSaleOnly?: boolean;
	status?: ProductStatus;
}

export interface SaveStoreProductInput {
	name: string;
	slug: string;
	shortDescription?: string;
	description: string;
	brand: string;
	sku?: string;
	status: ProductStatus;
	condition: ProductCondition;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	stockQuantity: number;
	lowStockThreshold: number;
	isFeatured: boolean;
	specifications?: Prisma.InputJsonValue;
	categoryId: string;
	imageUrls: string[];
	/**
	 * Media and swatches keyed to option values — expected already
	 * normalised (lowercase axis, trimmed value, valid hex). Images become
	 * tagged `ProductImage` rows; hexes land in `Product.optionStyles`.
	 */
	optionMedia?: Array<{
		axis: string;
		value: string;
		hex?: string;
		images: string[];
	}>;
	variants?: Array<{
		id?: string;
		name: string;
		sku?: string;
		priceInPesewas: number;
		compareAtInPesewas?: number;
		stockQuantity: number;
		attributes: Prisma.InputJsonValue;
		isActive: boolean;
	}>;
}

export interface CreateStoreCategoryInput {
	name: string;
	slug: string;
	description?: string;
	imageUrl?: string;
	isActive: boolean;
	sortOrder: number;
}

export interface UpdateStoreCategoryInput
	extends Omit<CreateStoreCategoryInput, "imageUrl"> {
	/** `null` clears the stored banner; `undefined` leaves it unchanged. */
	imageUrl?: string | null;
}

export interface CreateMockStoreOrderInput {
	userId?: string;
	customer: {
		name: string;
		email: string;
		phone: string;
	};
	address: {
		line1: string;
		line2?: string;
		city: string;
		region: string;
	};
	items: Array<{ productId: string; variantId?: string; quantity: number }>;
	customerNote?: string;
	/**
	 * Sent by the checkout form, one per attempt. A retry that carries the same
	 * key returns the order that was already created rather than reserving the
	 * stock and charging the customer a second time.
	 */
	idempotencyKey?: string;
}

/**
 * The order a previous attempt with this key already created, if any.
 */
async function findOrderByIdempotencyKey(key: string | undefined) {
	if (!key) {
		return null;
	}

	return db.order.findUnique({
		where: { idempotencyKey: key },
		include: { items: true, transactions: true },
	});
}

export async function getStoreCategories(options?: {
	includeInactive?: boolean;
}) {
	return db.category.findMany({
		where: options?.includeInactive ? undefined : { isActive: true },
		orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		include: {
			_count: { select: { products: true } },
		},
	});
}

export async function getPublishedStoreProducts(
	filters: StoreProductFilters = {},
) {
	return db.product.findMany({
		where: {
			status: filters.status ?? "ACTIVE",
			category: filters.categorySlug
				? { slug: filters.categorySlug, isActive: true }
				: { isActive: true },
			collections: filters.collectionSlug
				? {
						some: {
							collection: {
								slug: filters.collectionSlug,
								isActive: true,
							},
						},
					}
				: undefined,
			brand: filters.brands?.length
				? { in: filters.brands }
				: filters.brand
					? { equals: filters.brand }
					: undefined,
			priceInPesewas:
				filters.minPriceInPesewas !== undefined ||
				filters.maxPriceInPesewas !== undefined
					? {
							gte: filters.minPriceInPesewas,
							lte: filters.maxPriceInPesewas,
						}
					: undefined,
			stockQuantity: filters.inStockOnly ? { gt: 0 } : undefined,
			// A compare-at price is what marks a product as reduced. Whether it
			// actually beats the current price is checked after mapping, where
			// both numbers are to hand.
			compareAtInPesewas: filters.onSaleOnly ? { not: null } : undefined,
			...storefrontSearchWhere(filters.query),
		},
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
			variants: { where: { isActive: true }, orderBy: { name: "asc" } },
			reviews: {
				where: { isApproved: true },
				select: { rating: true },
			},
		},
		orderBy:
			filters.smartRule === "best-selling"
				? [{ unitsSold: "desc" }, { createdAt: "desc" }]
				: filters.smartRule === "newest"
					? [{ publishedAt: "desc" }, { createdAt: "desc" }]
					: [{ isFeatured: "desc" }, { createdAt: "desc" }],
		take: filters.limit,
	});
}

export interface CreateStoreCollectionInput {
	name: string;
	slug: string;
	description?: string;
	imageUrl?: string;
	isActive: boolean;
	/** Tile this collection in the landing "shop by need" band. */
	onLanding: boolean;
	sortOrder: number;
}

export interface UpdateStoreCollectionInput
	extends Omit<CreateStoreCollectionInput, "imageUrl"> {
	/** `null` clears the stored banner; `undefined` leaves it unchanged. */
	imageUrl?: string | null;
}

/**
 * The admin list.
 *
 * Unlike the storefront's, this one carries each collection's membership: the
 * screen has to show what is already in before anyone can change it.
 */
export async function getAdminStoreCollections() {
	return db.collection.findMany({
		orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		include: {
			_count: { select: { products: true } },
			products: {
				orderBy: { sortOrder: "asc" },
				select: { productId: true },
			},
		},
	});
}

export async function getStoreCollectionById(id: string) {
	return db.collection.findUnique({
		where: { id },
		include: {
			products: {
				orderBy: { sortOrder: "asc" },
				select: { productId: true },
			},
		},
	});
}

export async function createStoreCollection(input: CreateStoreCollectionInput) {
	return db.collection.create({ data: input });
}

export async function updateStoreCollection(
	id: string,
	input: UpdateStoreCollectionInput,
) {
	return db.collection.update({ where: { id }, data: input });
}

/**
 * Deleting a collection only removes the grouping.
 *
 * `ProductCollection` cascades, so the join rows go with it and the products
 * themselves are untouched — which is why this needs no guard, unlike a
 * department, where every product must belong to one.
 */
export async function deleteStoreCollection(id: string) {
	return db.collection.delete({ where: { id } });
}

/**
 * Writes the running order of the collections.
 *
 * Takes the full list and rewrites every row from its index, for the same
 * reason the departments do: seeded rows can share a `sortOrder`, and swapping
 * two equal values changes nothing.
 */
export async function reorderStoreCollections(ids: string[]) {
	return db.$transaction(
		ids.map((id, index) =>
			db.collection.update({ where: { id }, data: { sortOrder: index } }),
		),
	);
}

/**
 * Replaces a collection's membership.
 *
 * The incoming order becomes the stored `sortOrder`, which is the order the
 * storefront rail shows them in — so this is how an editor merchandises a
 * collection, not just which products are in it.
 */
export async function setStoreCollectionProducts(
	collectionId: string,
	productIds: string[],
) {
	return db.$transaction(async (transaction) => {
		await transaction.productCollection.deleteMany({
			where: { collectionId },
		});

		if (productIds.length) {
			await transaction.productCollection.createMany({
				data: productIds.map((productId, sortOrder) => ({
					collectionId,
					productId,
					sortOrder,
				})),
			});
		}

		return transaction.collection.findUnique({
			where: { id: collectionId },
		});
	});
}

/**
 * The brands the shop actually carries.
 *
 * Brand is free text on a product rather than a table of its own, so this is
 * the distinct set in use. It is what the landing page's brand picker offers,
 * which keeps the front page from naming something no longer stocked.
 */
export async function getStoreBrands(): Promise<string[]> {
	const rows = await db.product.findMany({
		where: { status: "ACTIVE", category: { isActive: true } },
		select: { brand: true },
		distinct: ["brand"],
		orderBy: { brand: "asc" },
	});

	return rows
		.map((row) => row.brand)
		.filter((brand) => brand.trim().length > 0);
}

/**
 * Published products by id, in the order asked for.
 *
 * Backs the landing page's product references: a band stores an id, and the
 * name, photograph and price it shows are read here at render time rather than
 * copied into the band and left to go stale.
 */
export async function getPublishedStoreProductsByIds(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}

	const products = await db.product.findMany({
		where: {
			id: { in: ids },
			status: "ACTIVE",
			category: { isActive: true },
		},
		include: {
			category: { select: { slug: true, name: true } },
			images: { orderBy: { sortOrder: "asc" }, take: 1 },
			reviews: { where: { isApproved: true }, select: { rating: true } },
		},
	});
	const byId = new Map(products.map((product) => [product.id, product]));

	return ids.flatMap((id) => {
		const product = byId.get(id);
		return product ? [product] : [];
	});
}

/** Stored, editor-picked collections. Smart ones are resolved by rule. */
export async function getStoreCollections(options?: {
	includeInactive?: boolean;
	onLandingOnly?: boolean;
}) {
	return db.collection.findMany({
		where: {
			...(options?.includeInactive ? {} : { isActive: true }),
			...(options?.onLandingOnly ? { onLanding: true } : {}),
		},
		orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		include: {
			_count: { select: { products: true } },
		},
	});
}

export async function getPublishedStoreProductBySlug(slug: string) {
	return db.product.findFirst({
		where: { slug, status: "ACTIVE", category: { isActive: true } },
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
			variants: { where: { isActive: true }, orderBy: { name: "asc" } },
			reviews: {
				where: { isApproved: true },
				include: {
					user: { select: { name: true, image: true } },
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

export type AdminProductSort = "updated" | "name" | "price" | "stock";

export type AdminStockState = "OUT" | "LOW" | "OK";

export interface AdminProductListQuery {
	q?: string;
	status?: ProductStatus;
	stock?: AdminStockState;
	categoryId?: string;
	sort?: AdminProductSort;
	dir?: "asc" | "desc";
	/** Product ids to leave out, e.g. ones a picker already shows as chosen. */
	excludeIds?: string[];
	/** 1-based. */
	page?: number;
	perPage?: number;
}

const ADMIN_PRODUCTS_PER_PAGE = 25;

function adminProductSearchWhere(q?: string): Prisma.ProductWhereInput {
	const query = q?.trim();

	if (!query) {
		return {};
	}

	// SQLite has no case-insensitive `contains` mode, so this matches the
	// stored casing. It is the same limitation the storefront filters carry.
	return {
		OR: [
			{ name: { contains: query } },
			{ sku: { contains: query } },
			{ brand: { contains: query } },
			{ category: { name: { contains: query } } },
		],
	};
}

/**
 * "Low" is a comparison between two columns, which is why this uses a Prisma
 * field reference rather than a literal — the threshold is per product.
 */
function adminProductStockWhere(
	stock?: AdminStockState,
): Prisma.ProductWhereInput {
	switch (stock) {
		case "OUT":
			return { stockQuantity: { lte: 0 } };
		case "LOW":
			return {
				stockQuantity: {
					gt: 0,
					lte: db.product.fields.lowStockThreshold,
				},
			};
		case "OK":
			return {
				stockQuantity: { gt: db.product.fields.lowStockThreshold },
			};
		default:
			return {};
	}
}

function adminProductOrderBy(
	sort: AdminProductSort = "updated",
	dir: "asc" | "desc" = "desc",
): Prisma.ProductOrderByWithRelationInput[] {
	switch (sort) {
		case "name":
			return [{ name: dir }, { id: "asc" }];
		case "price":
			return [{ priceInPesewas: dir }, { id: "asc" }];
		case "stock":
			return [{ stockQuantity: dir }, { id: "asc" }];
		default:
			return [{ updatedAt: dir }, { id: "asc" }];
	}
}

/**
 * One page of the admin catalogue, with the counts its filter bar shows.
 *
 * Filtering, sorting and paging all happen in the database. Each facet is
 * counted with the *other* filters applied but not its own, which is what
 * makes "Draft (3)" mean "3 more rows if you switch to Draft" rather than
 * "3 rows in the whole table".
 */
export async function getAdminProductList(query: AdminProductListQuery = {}) {
	const perPage = query.perPage ?? ADMIN_PRODUCTS_PER_PAGE;
	const search = adminProductSearchWhere(query.q);
	const byStatus: Prisma.ProductWhereInput = query.status
		? { status: query.status }
		: {};
	const byCategory: Prisma.ProductWhereInput = query.categoryId
		? { categoryId: query.categoryId }
		: {};
	const byStock = adminProductStockWhere(query.stock);
	const byExclusion: Prisma.ProductWhereInput = query.excludeIds?.length
		? { id: { notIn: query.excludeIds } }
		: {};

	const where: Prisma.ProductWhereInput = {
		AND: [search, byStatus, byCategory, byStock, byExclusion],
	};

	const total = await db.product.count({ where });
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	// A filter change can leave the requested page past the end of the result.
	const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

	const [
		products,
		statusGroups,
		categoryGroups,
		outCount,
		lowCount,
		okCount,
	] = await Promise.all([
		db.product.findMany({
			where,
			include: {
				category: true,
				images: { orderBy: { sortOrder: "asc" }, take: 1 },
			},
			orderBy: adminProductOrderBy(query.sort, query.dir),
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.product.groupBy({
			by: ["status"],
			where: { AND: [search, byCategory, byStock, byExclusion] },
			_count: { _all: true },
		}),
		db.product.groupBy({
			by: ["categoryId"],
			where: { AND: [search, byStatus, byStock, byExclusion] },
			_count: { _all: true },
		}),
		db.product.count({
			where: {
				AND: [
					search,
					byStatus,
					byCategory,
					byExclusion,
					adminProductStockWhere("OUT"),
				],
			},
		}),
		db.product.count({
			where: {
				AND: [
					search,
					byStatus,
					byCategory,
					byExclusion,
					adminProductStockWhere("LOW"),
				],
			},
		}),
		db.product.count({
			where: {
				AND: [
					search,
					byStatus,
					byCategory,
					byExclusion,
					adminProductStockWhere("OK"),
				],
			},
		}),
	]);

	const categoryNames = await db.category.findMany({
		where: { id: { in: categoryGroups.map((group) => group.categoryId) } },
		select: { id: true, name: true },
	});
	const nameById = new Map(
		categoryNames.map((category) => [category.id, category.name]),
	);

	return {
		products,
		total,
		page,
		pageCount,
		perPage,
		facets: {
			status: Object.fromEntries(
				statusGroups.map((group) => [group.status, group._count._all]),
			) as Partial<Record<ProductStatus, number>>,
			stock: { OUT: outCount, LOW: lowCount, OK: okCount },
			categories: categoryGroups
				.map((group) => ({
					id: group.categoryId,
					name: nameById.get(group.categoryId) ?? "Unknown",
					count: group._count._all,
				}))
				.sort((left, right) => left.name.localeCompare(right.name)),
		},
	};
}

export type AdminProductList = Awaited<ReturnType<typeof getAdminProductList>>;

/**
 * Catalogue-wide totals for the triage band.
 *
 * Deliberately unfiltered: the band reports the state of the shop, so it must
 * not change when someone narrows the table to one department.
 */
export async function getAdminProductSummary() {
	const [total, drafts, outOfStock, lowStock, liveValue] = await Promise.all([
		db.product.count(),
		db.product.count({ where: { status: "DRAFT" } }),
		db.product.count({ where: adminProductStockWhere("OUT") }),
		db.product.count({ where: adminProductStockWhere("LOW") }),
		// Prisma cannot multiply two columns in an aggregate, so the value of
		// published stock is summed in SQL.
		db.$queryRaw<Array<{ value: number | bigint | null }>>`
			SELECT COALESCE(SUM("priceInPesewas" * "stockQuantity"), 0) AS value
			FROM "store_product"
			WHERE "status" = 'ACTIVE'
		`,
	]);

	return {
		total,
		drafts,
		outOfStock,
		lowStock,
		liveStockValueInPesewas: Number(liveValue[0]?.value ?? 0),
	};
}

/**
 * An explicit set of products, in the order the caller asked for them.
 *
 * A picker needs this alongside its search: what is already chosen has to stay
 * visible and in its stored order even when the current query does not match
 * it, and `findMany` returns rows in the database's order, not the argument's.
 */
export async function getAdminStoreProductsByIds(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}

	const products = await db.product.findMany({
		where: { id: { in: ids } },
		include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
	});
	const byId = new Map(products.map((product) => [product.id, product]));

	return ids.flatMap((id) => {
		const product = byId.get(id);
		return product ? [product] : [];
	});
}

export async function getAdminStoreProductById(id: string) {
	return db.product.findUnique({
		where: { id },
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
			variants: { orderBy: { name: "asc" } },
		},
	});
}

function variantCreateData(
	variants: NonNullable<SaveStoreProductInput["variants"]>,
	parentSku: string,
) {
	return variants.map((variant) => ({
		name: variant.name,
		sku: newVariantSku(parentSku, variant.attributes),
		priceInPesewas: variant.priceInPesewas,
		compareAtInPesewas: variant.compareAtInPesewas ?? null,
		stockQuantity: variant.stockQuantity,
		attributes: variant.attributes,
		isActive: variant.isActive,
	}));
}

/**
 * Flattens option media into the two places it is stored: hexes become the
 * `optionStyles` list — `[{axis, value, hex}]`, keeping the value's display
 * case — and images become tagged `ProductImage` rows ordered after the
 * untagged product shots.
 */
function optionMediaWriteData(
	name: string,
	imageUrls: string[],
	optionMedia: NonNullable<SaveStoreProductInput["optionMedia"]>,
) {
	const optionStyles = optionMedia.flatMap((media) =>
		media.hex
			? [{ axis: media.axis, value: media.value, hex: media.hex }]
			: [],
	);
	const tagged = optionMedia.flatMap((media) =>
		media.images.map((url) => ({ url, media })),
	);

	return {
		optionStyles: optionStyles.length ? optionStyles : Prisma.DbNull,
		images: [
			...imageUrls.map((url, sortOrder) => ({
				url,
				alt: name,
				sortOrder,
				optionAxis: null,
				optionValue: null,
			})),
			...tagged.map(({ url, media }, index) => ({
				url,
				alt: `${name} — ${media.value}`,
				sortOrder: imageUrls.length + index,
				optionAxis: media.axis,
				optionValue: media.value,
			})),
		],
	};
}

function productStockQuantity(input: SaveStoreProductInput): number {
	return input.variants?.length
		? input.variants.reduce(
				(total, variant) =>
					total + (variant.isActive ? variant.stockQuantity : 0),
				0,
			)
		: input.stockQuantity;
}

export async function createStoreProduct(input: SaveStoreProductInput) {
	const sku = newProductSku(input.name);
	const { imageUrls, optionMedia = [], variants = [], ...product } = input;
	const optionData = optionMediaWriteData(input.name, imageUrls, optionMedia);
	return db.product.create({
		data: {
			...product,
			sku,
			stockQuantity: productStockQuantity(input),
			optionStyles: optionData.optionStyles,
			publishedAt: input.status === "ACTIVE" ? new Date() : null,
			images: {
				create: optionData.images,
			},
			variants: { create: variantCreateData(variants, sku) },
		},
		include: { category: { select: { slug: true } } },
	});
}

export async function updateStoreProduct(
	id: string,
	input: SaveStoreProductInput,
) {
	const { imageUrls, optionMedia = [], variants = [], ...product } = input;
	const existingVariantIds = variants
		.map((variant) => variant.id)
		.filter((variantId): variantId is string => Boolean(variantId));

	return db.$transaction(async (transaction) => {
		const existing = await transaction.product.findUniqueOrThrow({
			where: { id },
			select: { sku: true },
		});
		const ownedVariants = await transaction.productVariant.findMany({
			where: { productId: id },
			select: {
				id: true,
				sku: true,
				_count: { select: { orderItems: true } },
			},
		});
		const ownedIds = new Set(ownedVariants.map((variant) => variant.id));
		if (
			new Set(existingVariantIds).size !== existingVariantIds.length ||
			existingVariantIds.some((variantId) => !ownedIds.has(variantId))
		) {
			throw new StoreOperationError(
				"A variant does not belong to this product or was submitted twice. Refresh and try again.",
			);
		}
		if (
			ownedVariants.some(
				(variant) =>
					!existingVariantIds.includes(variant.id) &&
					variant._count.orderItems > 0,
			)
		) {
			throw new StoreOperationError(
				"An ordered variant cannot be removed. Deactivate it instead to preserve order history.",
			);
		}
		await transaction.productVariant.deleteMany({
			where: {
				productId: id,
				id: { notIn: existingVariantIds },
			},
		});

		for (const variant of variants) {
			const data = {
				name: variant.name,
				sku:
					ownedVariants.find((owned) => owned.id === variant.id)
						?.sku ??
					newVariantSku(existing.sku, variant.attributes),
				priceInPesewas: variant.priceInPesewas,
				// The admin editor does not expose variant compare-at prices yet.
				// Omission preserves this independently stored value.
				compareAtInPesewas: variant.compareAtInPesewas,
				stockQuantity: variant.stockQuantity,
				attributes: variant.attributes,
				isActive: variant.isActive,
			};
			if (variant.id) {
				await transaction.productVariant.update({
					where: { id: variant.id, productId: id },
					data,
				});
			} else {
				await transaction.productVariant.create({
					data: { ...data, productId: id },
				});
			}
		}

		const optionData = optionMediaWriteData(
			input.name,
			imageUrls,
			optionMedia,
		);
		return transaction.product.update({
			where: { id },
			data: {
				...product,
				sku: existing.sku,
				stockQuantity: productStockQuantity(input),
				shortDescription: input.shortDescription ?? null,
				compareAtInPesewas: input.compareAtInPesewas ?? null,
				specifications: input.specifications ?? Prisma.DbNull,
				optionStyles: optionData.optionStyles,
				publishedAt: input.status === "ACTIVE" ? new Date() : null,
				images: {
					deleteMany: {},
					create: optionData.images,
				},
			},
			include: { category: { select: { slug: true } } },
		});
	});
}

export async function updateStoreProductStatus(
	id: string,
	status: ProductStatus,
) {
	return db.product.update({
		where: { id },
		data: {
			status,
			publishedAt: status === "ACTIVE" ? new Date() : null,
		},
		include: { category: { select: { slug: true } } },
	});
}

/**
 * The outcome of asking to delete a product.
 *
 * A product that has ever been ordered cannot be removed: `OrderItem` holds it
 * with `onDelete: Restrict` on purpose, because deleting it would rewrite order
 * history. Everything else about a product — images, variants, collection
 * memberships, reviews, inventory events — cascades away with it.
 */
export type DeleteStoreProductResult =
	| {
			status: "deleted";
			product: {
				id: string;
				name: string;
				slug: string;
				categorySlug: string;
			};
	  }
	| { status: "has-orders"; orderCount: number }
	| { status: "not-found" };

export async function deleteStoreProduct(
	id: string,
): Promise<DeleteStoreProductResult> {
	const product = await db.product.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			slug: true,
			category: { select: { slug: true } },
			_count: { select: { orderItems: true } },
		},
	});

	if (!product) {
		return { status: "not-found" };
	}

	if (product._count.orderItems > 0) {
		return { status: "has-orders", orderCount: product._count.orderItems };
	}

	await db.product.delete({ where: { id } });

	return {
		status: "deleted",
		product: {
			id: product.id,
			name: product.name,
			slug: product.slug,
			categorySlug: product.category.slug,
		},
	};
}

export async function updateStoreProductStock(
	id: string,
	stockQuantity: number,
	actorId?: string,
) {
	return db.$transaction(async (transaction) => {
		const currentProduct = await transaction.product.findUniqueOrThrow({
			where: { id },
			select: { stockQuantity: true },
		});
		// The variant check rides inside the write itself: a concurrent
		// updateStoreProduct that adds variants cannot slip between a separate
		// count read and this update and leave the aggregate stale.
		const updated = await transaction.product.updateMany({
			where: { id, variants: { none: {} } },
			data: { stockQuantity },
		});
		if (updated.count === 0) {
			throw new StoreOperationError(
				"Update stock on the individual variants in the product editor.",
			);
		}
		const product = await transaction.product.findUniqueOrThrow({
			where: { id },
			include: { category: { select: { slug: true } } },
		});
		await transaction.inventoryEvent.create({
			data: {
				productId: id,
				type: "ADJUSTMENT",
				quantity: stockQuantity - currentProduct.stockQuantity,
				reason: "Admin set on-hand quantity",
				actorId,
			},
		});
		return product;
	});
}

interface ReservedOrderItem {
	productId: string;
	variantId?: string;
	productName: string;
	variantName?: string;
	sku: string;
	imageUrl?: string;
	unitPriceInPesewas: number;
	quantity: number;
	lineTotalInPesewas: number;
}

async function reserveOrderItems(
	transaction: Prisma.TransactionClient,
	items: CreateMockStoreOrderInput["items"],
): Promise<ReservedOrderItem[]> {
	const products = await transaction.product.findMany({
		where: {
			id: { in: items.map((item) => item.productId) },
			status: "ACTIVE",
		},
		include: {
			images: { orderBy: { sortOrder: "asc" }, take: 1 },
			variants: true,
		},
	});
	const productMap = new Map(
		products.map((product) => [product.id, product]),
	);

	const reservedItems = items.map((item) => {
		const product = productMap.get(item.productId);
		if (!product) {
			throw new StoreOperationError(
				"A product in your bag is no longer available.",
			);
		}
		if (!Number.isInteger(item.quantity) || item.quantity < 1) {
			throw new StoreOperationError(
				`Choose a valid quantity for ${product.name}.`,
			);
		}

		const variant = item.variantId
			? product.variants.find(
					(candidate) =>
						candidate.id === item.variantId && candidate.isActive,
				)
			: undefined;
		if (item.variantId && !variant) {
			throw new StoreOperationError(
				`${product.name} is no longer available in that option.`,
			);
		}

		const stockQuantity = variant?.stockQuantity ?? product.stockQuantity;
		const unitPriceInPesewas =
			variant?.priceInPesewas ?? product.priceInPesewas;
		if (stockQuantity < item.quantity) {
			throw new StoreOperationError(
				`${product.name}${variant ? ` (${variant.name})` : ""} no longer has enough stock.`,
			);
		}

		return {
			productId: product.id,
			variantId: variant?.id,
			productName: product.name,
			variantName: variant?.name,
			sku: variant?.sku ?? product.sku,
			imageUrl: product.images[0]?.url,
			unitPriceInPesewas,
			quantity: item.quantity,
			lineTotalInPesewas: unitPriceInPesewas * item.quantity,
		};
	});

	for (const item of reservedItems) {
		if (item.variantId) {
			const updateResult = await transaction.productVariant.updateMany({
				where: {
					id: item.variantId,
					stockQuantity: { gte: item.quantity },
				},
				data: { stockQuantity: { decrement: item.quantity } },
			});
			if (updateResult.count !== 1) {
				throw new StoreOperationError(
					`${item.productName} no longer has enough stock.`,
				);
			}
			// The product row carries the aggregate shown in the admin table
			// and used by the in-stock filter — it has to follow the option.
			await transaction.product.update({
				where: { id: item.productId },
				data: { stockQuantity: { decrement: item.quantity } },
			});
		} else {
			const updateResult = await transaction.product.updateMany({
				where: {
					id: item.productId,
					stockQuantity: { gte: item.quantity },
				},
				data: { stockQuantity: { decrement: item.quantity } },
			});
			if (updateResult.count !== 1) {
				throw new StoreOperationError(
					`${item.productName} no longer has enough stock.`,
				);
			}
		}

		// Denormalised so the "Best sellers" collection is a single indexed
		// read rather than an aggregate over every order item.
		await transaction.product.update({
			where: { id: item.productId },
			data: { unitsSold: { increment: item.quantity } },
		});
	}

	return reservedItems;
}

async function restockOrderItems(
	transaction: Prisma.TransactionClient,
	items: Array<{
		id: string;
		productId: string;
		variantId: string | null;
		productName: string;
		quantity: number;
	}>,
	reason: string,
	actorId?: string,
) {
	for (const item of items) {
		if (item.variantId) {
			const variant = await transaction.productVariant.update({
				where: { id: item.variantId },
				data: { stockQuantity: { increment: item.quantity } },
			});
			if (variant.isActive) {
				await transaction.product.update({
					where: { id: item.productId },
					data: { stockQuantity: { increment: item.quantity } },
				});
			}
		} else {
			await transaction.product.update({
				where: { id: item.productId },
				data: { stockQuantity: { increment: item.quantity } },
			});
		}
		await transaction.product.update({
			where: { id: item.productId },
			data: { unitsSold: { decrement: item.quantity } },
		});
		await transaction.inventoryEvent.create({
			data: {
				productId: item.productId,
				variantId: item.variantId,
				orderItemId: item.id,
				type: "RETURN",
				quantity: item.quantity,
				reason,
				actorId,
			},
		});
	}
}

function createOrderNumber() {
	return `GST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createMockStoreOrder(input: CreateMockStoreOrderInput) {
	if (input.items.length === 0) {
		throw new StoreOperationError("An order requires at least one item.");
	}

	const existing = await findOrderByIdempotencyKey(input.idempotencyKey);
	if (existing) {
		return existing;
	}

	// Read before the transaction opens: the rule is a separate row, and
	// holding the write lock open while fetching it buys nothing.
	const deliveryRule = await getDeliveryRule();

	return db.$transaction(async (transaction) => {
		const orderItems = await reserveOrderItems(transaction, input.items);
		const subtotalInPesewas = orderItems.reduce(
			(total, item) => total + item.lineTotalInPesewas,
			0,
		);
		const deliveryInPesewas = calculateDeliveryFeeInPesewas(
			subtotalInPesewas,
			deliveryRule,
		);
		const orderNumber = createOrderNumber();

		const order = await transaction.order.create({
			data: {
				orderNumber,
				idempotencyKey: input.idempotencyKey,
				userId: input.userId,
				status: "CONFIRMED",
				paymentStatus: "PAID",
				paymentMethod: "MOCK",
				subtotalInPesewas,
				deliveryInPesewas,
				totalInPesewas: subtotalInPesewas + deliveryInPesewas,
				customerEmail: input.customer.email,
				customerPhone: input.customer.phone,
				recipientName: input.customer.name,
				shippingAddress: {
					...input.address,
					recipientName: input.customer.name,
				},
				customerNote: input.customerNote,
				items: { create: orderItems },
				transactions: {
					create: {
						reference: `MOCK-${randomUUID().toUpperCase()}`,
						provider: "mock",
						paymentMethod: "MOCK",
						status: "PAID",
						amountInPesewas: subtotalInPesewas + deliveryInPesewas,
						processedAt: new Date(),
					},
				},
				statusEvents: {
					create: { status: "CONFIRMED", actorId: input.userId },
				},
			},
			include: { items: true, transactions: true },
		});

		for (const item of order.items) {
			await transaction.inventoryEvent.create({
				data: {
					productId: item.productId,
					variantId: item.variantId,
					orderItemId: item.id,
					type: "SALE",
					quantity: -item.quantity,
					reason: `Mock order ${orderNumber}`,
					actorId: input.userId,
				},
			});
		}

		return order;
	});
}

export async function createPendingStoreOrder(
	input: CreateMockStoreOrderInput & {
		paymentMethod: Exclude<StorePaymentMethod, "MOCK">;
	},
) {
	if (input.items.length === 0) {
		throw new StoreOperationError("An order requires at least one item.");
	}

	const existing = await findOrderByIdempotencyKey(input.idempotencyKey);
	if (existing) {
		return existing;
	}

	// WhatsApp orders settle like cash on delivery: confirmed at placement,
	// money arranged in chat or collected at the door — no payment intent.
	const settlesOnDelivery =
		input.paymentMethod === "CASH_ON_DELIVERY" ||
		input.paymentMethod === "WHATSAPP";

	// Read before the transaction opens: the rule is a separate row, and
	// holding the write lock open while fetching it buys nothing.
	const deliveryRule = await getDeliveryRule();

	return db.$transaction(async (transaction) => {
		const orderItems = await reserveOrderItems(transaction, input.items);
		const subtotalInPesewas = orderItems.reduce(
			(total, item) => total + item.lineTotalInPesewas,
			0,
		);
		const deliveryInPesewas = calculateDeliveryFeeInPesewas(
			subtotalInPesewas,
			deliveryRule,
		);
		const orderNumber = createOrderNumber();
		const status = settlesOnDelivery ? "CONFIRMED" : "PENDING";

		const order = await transaction.order.create({
			data: {
				orderNumber,
				idempotencyKey: input.idempotencyKey,
				userId: input.userId,
				status,
				paymentStatus: "PENDING",
				paymentMethod: input.paymentMethod,
				subtotalInPesewas,
				deliveryInPesewas,
				totalInPesewas: subtotalInPesewas + deliveryInPesewas,
				customerEmail: input.customer.email,
				customerPhone: input.customer.phone,
				recipientName: input.customer.name,
				shippingAddress: {
					...input.address,
					recipientName: input.customer.name,
				},
				customerNote: input.customerNote,
				items: { create: orderItems },
				transactions: {
					create: {
						reference: `PEND-${randomUUID().toUpperCase()}`,
						provider:
							input.paymentMethod === "WHATSAPP"
								? "whatsapp"
								: settlesOnDelivery
									? "cash"
									: "reevit",
						paymentMethod: input.paymentMethod,
						status: "PENDING",
						amountInPesewas: subtotalInPesewas + deliveryInPesewas,
					},
				},
				statusEvents: {
					create: { status, actorId: input.userId },
				},
			},
			include: { items: true, transactions: true },
		});

		for (const item of order.items) {
			await transaction.inventoryEvent.create({
				data: {
					productId: item.productId,
					variantId: item.variantId,
					orderItemId: item.id,
					type: "SALE",
					quantity: -item.quantity,
					reason: `Reserved for ${orderNumber}`,
					actorId: input.userId,
				},
			});
		}

		return order;
	});
}

/** Resolve an event to one attempt; never borrow a retry when its predecessor is terminal. */
async function findPendingPaymentAttempt(
	transaction: Prisma.TransactionClient,
	orderId: string,
	providerPaymentId?: string,
	allowUnassigned = true,
) {
	if (providerPaymentId) {
		const assigned = await transaction.storeTransaction.findMany({
			where: { orderId, providerPaymentId },
			take: 2,
		});
		if (assigned.length) {
			return assigned.length === 1 && assigned[0].status === "PENDING"
				? assigned[0]
				: undefined;
		}
	}
	if (!allowUnassigned) {
		return undefined;
	}
	const unassigned = await transaction.storeTransaction.findMany({
		where: { orderId, providerPaymentId: null, status: "PENDING" },
		take: 2,
	});
	return unassigned.length === 1 ? unassigned[0] : undefined;
}

export async function attachStorePaymentIntent(input: {
	orderId: string;
	providerPaymentId: string;
}) {
	return db.$transaction(async (transaction) => {
		const assigned = await transaction.storeTransaction.findMany({
			where: {
				orderId: input.orderId,
				providerPaymentId: input.providerPaymentId,
			},
			take: 2,
		});
		// Includes a success webhook that arrived before createIntent returned.
		if (assigned.length === 1) {
			return { count: 0 };
		}
		if (assigned.length > 1) {
			throw new StoreOperationError("Ambiguous payment attempt.");
		}
		const attempt = await findPendingPaymentAttempt(
			transaction,
			input.orderId,
		);
		if (!attempt) {
			throw new StoreOperationError(
				"No unique unassigned payment attempt.",
			);
		}
		await transaction.storeTransaction.update({
			where: { id: attempt.id },
			data: {
				providerPaymentId: input.providerPaymentId,
				reference: input.providerPaymentId,
			},
		});
		return { count: 1 };
	});
}

/** A refund must target the settled Reevit attempt, not the latest retry. */
export function getStoreOrderRefundPaymentId(
	transactions: Array<{
		status: StorePaymentStatus;
		provider: string;
		providerPaymentId: string | null;
	}>,
) {
	const settled = transactions.filter(
		(attempt) => attempt.status === "PAID" && attempt.provider === "reevit",
	);
	if (settled.length > 1) {
		throw new StoreOperationError(
			"Multiple captured payments require reconciliation. Refund duplicate payments in Reevit before requesting the order refund.",
		);
	}
	if (settled.length !== 1 || !settled[0].providerPaymentId) {
		throw new StoreOperationError(
			"No unique settled Reevit payment on this order.",
		);
	}
	return settled[0].providerPaymentId;
}

export async function markStoreOrderPaid(input: {
	orderId: string;
	providerPaymentId: string;
	providerPayload: Prisma.InputJsonValue;
}) {
	return db.$transaction(async (transaction) => {
		const order = await transaction.order.findUnique({
			where: { id: input.orderId },
		});
		if (!order) {
			throw new StoreOperationError("Order not found.");
		}

		const assigned = await transaction.storeTransaction.findMany({
			where: {
				orderId: order.id,
				providerPaymentId: input.providerPaymentId,
			},
			take: 2,
		});
		if (assigned.length > 1) {
			throw new StoreOperationError("Ambiguous payment attempt.");
		}
		const identified = assigned[0];
		// A refunded capture remains refunded when its older success event arrives.
		if (
			identified?.status === "PAID" ||
			identified?.status === "REFUNDED"
		) {
			return { ...order, paymentTransition: "already-paid" as const };
		}
		const preserveFulfillment =
			order.status === "CANCELLED" ||
			order.status === "REFUNDED" ||
			order.paymentStatus === "REFUNDED";
		const alreadyPaid = order.paymentStatus === "PAID";
		// A provider can resolve an earlier failure as captured. Update that exact
		// attempt; never consume the pending retry beside it.
		const attempt =
			identified ??
			(await findPendingPaymentAttempt(
				transaction,
				order.id,
				input.providerPaymentId,
				!preserveFulfillment && !alreadyPaid,
			));
		if (!attempt) {
			throw new StoreOperationError("No matching payment attempt.");
		}
		if (!alreadyPaid) {
			await transaction.order.update({
				where: { id: order.id },
				data: {
					paymentStatus: "PAID",
					status: preserveFulfillment ? order.status : "CONFIRMED",
				},
			});
		}

		await transaction.storeTransaction.update({
			where: { id: attempt.id },
			data: {
				status: "PAID",
				providerPaymentId: input.providerPaymentId,
				providerPayload: input.providerPayload,
				processedAt: new Date(),
			},
		});

		const reconciliation = preserveFulfillment || alreadyPaid;
		await transaction.orderStatusEvent.create({
			data: {
				orderId: order.id,
				status: reconciliation ? order.status : "CONFIRMED",
				note: reconciliation
					? `Payment ${input.providerPaymentId} captured${attempt.status === "FAILED" ? " after an earlier failure" : ""}; reconciliation required`
					: attempt.status === "FAILED"
						? `Payment ${input.providerPaymentId} confirmed after an earlier failure`
						: "Payment confirmed",
			},
		});
		const result = await transaction.order.findUniqueOrThrow({
			where: { id: order.id },
		});
		return {
			...result,
			paymentTransition: preserveFulfillment
				? ("reconciliation" as const)
				: alreadyPaid
					? ("additional" as const)
					: ("confirmed" as const),
		};
	});
}

export async function markStoreOrderPaymentFailed(
	orderId: string,
	providerPaymentId?: string,
) {
	return db.$transaction(async (transaction) => {
		const order = await transaction.order.findUnique({
			where: { id: orderId },
			include: { items: true },
		});
		if (!order) {
			throw new StoreOperationError("Order not found.");
		}

		const preserveOrder =
			order.paymentStatus === "PAID" ||
			order.paymentStatus === "REFUNDED" ||
			order.status === "CANCELLED" ||
			order.status === "REFUNDED";
		if (preserveOrder && !providerPaymentId) {
			return { ...order, failureTransition: "ignored" as const };
		}

		const attempt = await findPendingPaymentAttempt(
			transaction,
			orderId,
			providerPaymentId,
			!preserveOrder,
		);
		// Unknown or already resolved events cannot fail a different retry.
		if (!attempt) {
			return { ...order, failureTransition: "ignored" as const };
		}
		await transaction.storeTransaction.update({
			where: { id: attempt.id },
			data: {
				status: "FAILED",
				processedAt: new Date(),
				...(providerPaymentId ? { providerPaymentId } : {}),
			},
		});
		if (preserveOrder) {
			return { ...order, failureTransition: "attempt-failed" as const };
		}
		const remaining = await transaction.storeTransaction.count({
			where: { orderId, status: { in: ["PENDING", "PAID"] } },
		});
		if (remaining > 0) {
			return { ...order, failureTransition: "attempt-failed" as const };
		}

		await restockOrderItems(
			transaction,
			order.items,
			`Payment failed for ${order.orderNumber}`,
		);
		await transaction.order.update({
			where: { id: orderId },
			data: { paymentStatus: "FAILED", status: "CANCELLED" },
		});
		await transaction.orderStatusEvent.create({
			data: { orderId, status: "CANCELLED", note: "Payment failed" },
		});

		const failed = await transaction.order.findUniqueOrThrow({
			where: { id: orderId },
		});
		return { ...failed, failureTransition: "failed" as const };
	});
}

export async function markStoreOrderRefunded(
	orderId: string,
	providerPaymentId?: string,
) {
	return db.$transaction(async (transaction) => {
		const order = await transaction.order.findUnique({
			where: { id: orderId },
			include: { items: true },
		});
		if (!order) {
			throw new StoreOperationError("Order not found.");
		}
		if (!providerPaymentId && order.paymentStatus === "REFUNDED") {
			return { ...order, refundTransition: "already-refunded" as const };
		}
		const attempts = await transaction.storeTransaction.findMany({
			where: {
				orderId,
				...(providerPaymentId
					? {
							providerPaymentId,
							status: { in: ["PAID", "REFUNDED"] },
						}
					: { status: "PAID" }),
			},
			take: 2,
		});
		if (attempts.length !== 1) {
			throw new StoreOperationError(
				providerPaymentId
					? "Refund does not match a unique settled payment attempt."
					: "Only uniquely paid orders can be refunded.",
			);
		}
		const attempt = attempts[0];
		if (attempt.status === "REFUNDED") {
			return { ...order, refundTransition: "already-refunded" as const };
		}
		if (!providerPaymentId && order.paymentStatus !== "PAID") {
			throw new StoreOperationError("Only paid orders can be refunded.");
		}
		await transaction.storeTransaction.update({
			where: { id: attempt.id },
			data: { status: "REFUNDED", processedAt: new Date() },
		});
		const retained = await transaction.storeTransaction.count({
			where: { orderId, status: "PAID" },
		});
		if (retained > 0) {
			// Refunding a duplicate charge does not cancel the customer's paid order.
			await transaction.orderStatusEvent.create({
				data: {
					orderId,
					status: order.status,
					note: `Payment ${attempt.providerPaymentId ?? attempt.reference} refunded; another settled payment remains`,
				},
			});
			return { ...order, refundTransition: "partial" as const };
		}
		if (order.status !== "CANCELLED" && order.status !== "REFUNDED") {
			await restockOrderItems(
				transaction,
				order.items,
				`Refund ${order.orderNumber}`,
			);
		}
		const refunded = await transaction.order.update({
			where: { id: orderId },
			data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
		});
		await transaction.orderStatusEvent.create({
			data: { orderId, status: "REFUNDED", note: "Refund confirmed" },
		});
		return { ...refunded, refundTransition: "full" as const };
	});
}

/** A marker means the payment mutation completed, never merely started. */
export async function hasProcessedWebhookEvent(id: string): Promise<boolean> {
	return (
		(await db.webhookEvent.findUnique({
			where: { id },
			select: { id: true },
		})) !== null
	);
}

export async function recordWebhookEvent(
	id: string,
	type: string,
	payload: Prisma.InputJsonValue,
) {
	try {
		await db.webhookEvent.create({
			data: {
				id,
				type,
				payload,
			},
		});
		return { duplicate: false };
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { duplicate: true };
		}
		throw error;
	}
}

export async function getStoreOrderById(id: string) {
	return db.order.findUnique({
		where: { id },
		include: {
			items: true,
			transactions: { orderBy: { createdAt: "desc" } },
			statusEvents: { orderBy: { createdAt: "asc" } },
		},
	});
}

export async function getStoreOrderByNumber(orderNumber: string) {
	return db.order.findUnique({
		where: { orderNumber },
		include: {
			items: true,
			transactions: { orderBy: { createdAt: "desc" } },
		},
	});
}

const ADMIN_ORDER_INCLUDE = {
	items: true,
	transactions: { orderBy: { createdAt: "desc" as const } },
	statusEvents: { orderBy: { createdAt: "asc" as const } },
	user: { select: { name: true, email: true, image: true } },
};

export async function getAdminStoreOrder(id: string) {
	return db.order.findUnique({ where: { id }, include: ADMIN_ORDER_INCLUDE });
}

export async function getAdminStoreOrderByNumber(orderNumber: string) {
	return db.order.findUnique({
		where: { orderNumber },
		include: ADMIN_ORDER_INCLUDE,
	});
}

export async function markCashOnDeliveryPaid(orderId: string, actorId: string) {
	return db.$transaction(async (transaction) => {
		const order = await transaction.order.findUniqueOrThrow({
			where: { id: orderId },
		});
		if (
			order.paymentMethod !== "CASH_ON_DELIVERY" &&
			order.paymentMethod !== "WHATSAPP"
		) {
			throw new StoreOperationError(
				"Only orders settled on delivery can be marked paid this way.",
			);
		}
		if (order.paymentStatus === "PAID") {
			return order;
		}

		await transaction.order.update({
			where: { id: orderId },
			data: { paymentStatus: "PAID" },
		});
		await transaction.storeTransaction.updateMany({
			where: { orderId },
			data: { status: "PAID", processedAt: new Date() },
		});
		await transaction.orderStatusEvent.create({
			data: {
				orderId,
				status: order.status,
				note: "Cash received",
				actorId,
			},
		});
		return transaction.order.findUniqueOrThrow({ where: { id: orderId } });
	});
}

export async function getAdminStoreOrders(filters?: {
	status?: OrderStatus;
	paymentStatus?: StorePaymentStatus;
	take?: number;
}) {
	const { take, ...where } = filters ?? {};
	return db.order.findMany({
		where,
		include: {
			user: { select: { name: true, email: true, image: true } },
			items: true,
			transactions: { orderBy: { createdAt: "desc" } },
		},
		orderBy: { placedAt: "desc" },
		take,
	});
}

export type AdminOrderSort = "placed" | "total" | "customer";

export interface AdminOrderListQuery {
	q?: string;
	status?: OrderStatus;
	paymentStatus?: StorePaymentStatus;
	sort?: AdminOrderSort;
	dir?: "asc" | "desc";
	/** 1-based. */
	page?: number;
	perPage?: number;
}

const ADMIN_ORDERS_PER_PAGE = 25;

function adminOrderSearchWhere(q?: string): Prisma.OrderWhereInput {
	const query = q?.trim();

	if (!query) {
		return {};
	}

	// `recipientName` is a denormalized column, so guest recipients filter
	// inside the same paginated query as every other field — no JSON
	// functions and no materialized id lists.
	return {
		OR: [
			{ orderNumber: { contains: query } },
			{ customerEmail: { contains: query } },
			{ customerPhone: { contains: query } },
			{ recipientName: { contains: query } },
			{ user: { name: { contains: query } } },
		],
	};
}

function adminOrderOrderBy(
	sort: AdminOrderSort = "placed",
	dir: "asc" | "desc" = "desc",
): Prisma.OrderOrderByWithRelationInput[] {
	switch (sort) {
		case "total":
			return [{ totalInPesewas: dir }, { id: "asc" }];
		case "customer":
			return [{ customerEmail: dir }, { id: "asc" }];
		default:
			return [{ placedAt: dir }, { id: "asc" }];
	}
}

/**
 * One page of the order book, with the counts its filter bar shows.
 *
 * Same shape as the catalogue list: the database filters, sorts and pages, and
 * each facet is counted with the other filters applied but not its own.
 */
export async function getAdminOrderList(query: AdminOrderListQuery = {}) {
	const perPage = query.perPage ?? ADMIN_ORDERS_PER_PAGE;
	const search = adminOrderSearchWhere(query.q);
	const byStatus: Prisma.OrderWhereInput = query.status
		? { status: query.status }
		: {};
	const byPayment: Prisma.OrderWhereInput = query.paymentStatus
		? { paymentStatus: query.paymentStatus }
		: {};

	const where: Prisma.OrderWhereInput = {
		AND: [search, byStatus, byPayment],
	};

	const total = await db.order.count({ where });
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

	const [orders, statusGroups, paymentGroups] = await Promise.all([
		db.order.findMany({
			where,
			include: {
				user: { select: { name: true, email: true, image: true } },
				items: { select: { id: true } },
				transactions: { orderBy: { createdAt: "desc" } },
			},
			orderBy: adminOrderOrderBy(query.sort, query.dir),
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.order.groupBy({
			by: ["status"],
			where: { AND: [search, byPayment] },
			_count: { _all: true },
		}),
		db.order.groupBy({
			by: ["paymentStatus"],
			where: { AND: [search, byStatus] },
			_count: { _all: true },
		}),
	]);

	return {
		orders,
		total,
		page,
		pageCount,
		perPage,
		facets: {
			status: Object.fromEntries(
				statusGroups.map((group) => [group.status, group._count._all]),
			) as Partial<Record<OrderStatus, number>>,
			payment: Object.fromEntries(
				paymentGroups.map((group) => [
					group.paymentStatus,
					group._count._all,
				]),
			) as Partial<Record<StorePaymentStatus, number>>,
		},
	};
}

export type AdminOrderList = Awaited<ReturnType<typeof getAdminOrderList>>;

/**
 * Whole-book counts for the triage band above the orders table.
 *
 * Unfiltered on purpose: the band says what is waiting on the shop, which must
 * not change when someone narrows the table to one status.
 */
export async function getAdminOrderSummary(dispatchWindowHours: number) {
	const cutoff = new Date(Date.now() - dispatchWindowHours * 60 * 60 * 1000);

	const [total, late, awaitingDispatch, unpaid] = await Promise.all([
		db.order.count(),
		db.order.count({
			where: {
				...AWAITING_DISPATCH_WHERE,
				placedAt: { lt: cutoff },
			},
		}),
		db.order.count({
			where: AWAITING_DISPATCH_WHERE,
		}),
		db.order.aggregate({
			where: {
				paymentStatus: { not: "PAID" },
				status: { notIn: ["CANCELLED", "REFUNDED"] },
			},
			_count: { _all: true },
			_sum: { totalInPesewas: true },
		}),
	]);

	return {
		total,
		late,
		awaitingDispatch,
		unpaid: unpaid._count._all,
		unpaidValueInPesewas: unpaid._sum.totalInPesewas ?? 0,
	};
}

export type AdminTransactionSort = "created" | "amount";

export interface AdminTransactionListQuery {
	q?: string;
	status?: StorePaymentStatus;
	method?: StorePaymentMethod;
	sort?: AdminTransactionSort;
	dir?: "asc" | "desc";
	/** 1-based. */
	page?: number;
	perPage?: number;
}

const ADMIN_TRANSACTIONS_PER_PAGE = 25;

function adminTransactionSearchWhere(
	q?: string,
): Prisma.StoreTransactionWhereInput {
	const query = q?.trim();

	if (!query) {
		return {};
	}

	return {
		OR: [
			{ reference: { contains: query } },
			{ providerPaymentId: { contains: query } },
			{ order: { orderNumber: { contains: query } } },
			{ order: { customerEmail: { contains: query } } },
		],
	};
}

/**
 * One page of the payment ledger.
 *
 * The screen used to load every order and flatten their transactions in the
 * browser, which meant reconciling a hundred payments cost the whole order
 * book. The database filters, sorts and pages it, like the other admin lists.
 */
export async function getAdminTransactionList(
	query: AdminTransactionListQuery = {},
) {
	const perPage = query.perPage ?? ADMIN_TRANSACTIONS_PER_PAGE;
	const search = adminTransactionSearchWhere(query.q);
	const byStatus: Prisma.StoreTransactionWhereInput = query.status
		? { status: query.status }
		: {};
	const byMethod: Prisma.StoreTransactionWhereInput = query.method
		? { paymentMethod: query.method }
		: {};

	const where: Prisma.StoreTransactionWhereInput = {
		AND: [search, byStatus, byMethod],
	};

	const total = await db.storeTransaction.count({ where });
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

	const [transactions, statusGroups, methodGroups] = await Promise.all([
		db.storeTransaction.findMany({
			where,
			include: {
				order: {
					select: {
						id: true,
						orderNumber: true,
						customerEmail: true,
					},
				},
			},
			orderBy:
				query.sort === "amount"
					? [{ amountInPesewas: query.dir ?? "desc" }, { id: "asc" }]
					: [{ createdAt: query.dir ?? "desc" }, { id: "asc" }],
			skip: (page - 1) * perPage,
			take: perPage,
		}),
		db.storeTransaction.groupBy({
			by: ["status"],
			where: { AND: [search, byMethod] },
			_count: { _all: true },
		}),
		db.storeTransaction.groupBy({
			by: ["paymentMethod"],
			where: { AND: [search, byStatus] },
			_count: { _all: true },
		}),
	]);

	return {
		transactions,
		total,
		page,
		pageCount,
		perPage,
		facets: {
			status: Object.fromEntries(
				statusGroups.map((group) => [group.status, group._count._all]),
			) as Partial<Record<StorePaymentStatus, number>>,
			method: Object.fromEntries(
				methodGroups.map((group) => [
					group.paymentMethod,
					group._count._all,
				]),
			) as Partial<Record<StorePaymentMethod, number>>,
		},
	};
}

export type AdminTransactionList = Awaited<
	ReturnType<typeof getAdminTransactionList>
>;

/**
 * What the ledger adds up to, for reconciliation.
 *
 * Unfiltered on purpose: this is the position of the book, and it must not
 * change when someone narrows the table to one payment method.
 */
export async function getAdminTransactionSummary() {
	const [settled, refunded, failed, pending] = await Promise.all([
		db.storeTransaction.aggregate({
			where: { status: "PAID" },
			_count: { _all: true },
			_sum: { amountInPesewas: true },
		}),
		db.storeTransaction.aggregate({
			where: { status: "REFUNDED" },
			_count: { _all: true },
			_sum: { amountInPesewas: true },
		}),
		db.storeTransaction.count({ where: { status: "FAILED" } }),
		db.storeTransaction.count({ where: { status: "PENDING" } }),
	]);

	const retainedInPesewas = settled._sum.amountInPesewas ?? 0;
	const refundedInPesewas = refunded._sum.amountInPesewas ?? 0;
	// A refund changes the original payment row, rather than adding a debit.
	const settledInPesewas = retainedInPesewas + refundedInPesewas;

	return {
		settledCount: settled._count._all + refunded._count._all,
		settledInPesewas,
		refundedCount: refunded._count._all,
		refundedInPesewas,
		/** What the shop actually kept. */
		netInPesewas: retainedInPesewas,
		failedCount: failed,
		pendingCount: pending,
	};
}

export async function getStoreOrdersByUserId(userId: string) {
	return db.order.findMany({
		where: { userId },
		include: {
			items: {
				include: { review: true },
			},
			transactions: { orderBy: { createdAt: "desc" } },
			statusEvents: { orderBy: { createdAt: "asc" } },
		},
		orderBy: { placedAt: "desc" },
	});
}

/** The name to show beside a guest's review, from the order they placed. */
function reviewerNameFrom(shippingAddress: unknown, email: string): string {
	if (shippingAddress && typeof shippingAddress === "object") {
		const recipient = (shippingAddress as Record<string, unknown>)
			.recipientName;
		if (typeof recipient === "string" && recipient.trim().length > 1) {
			return recipient.trim();
		}
	}

	// Falls back to the part before the @, which is at least recognisably
	// theirs, rather than showing a stranger the whole address.
	return email.split("@")[0] ?? "Customer";
}

export interface GuestReviewInput {
	productId: string;
	/** Printed on the confirmation email; the reviewer copies it in. */
	orderNumber: string;
	email: string;
	rating: number;
	title?: string;
	body: string;
}

/**
 * A review from someone who bought the thing, without an account.
 *
 * This shop has no customer sign-up, so "are you allowed to review this?"
 * cannot be answered by a session. It is answered by the order instead: the
 * order number and the email it was placed with have to match, the order has
 * to be DELIVERED, and it has to actually contain this product. That is the
 * same promise the product page already makes to shoppers — every review here
 * is from someone who received the item.
 *
 * The unique `orderItemId` is what stops one purchase being reviewed twice;
 * a second submission edits the first rather than adding another.
 */
export async function createGuestStoreReview(input: GuestReviewInput) {
	const orderNumber = input.orderNumber.trim();
	const email = input.email.trim().toLowerCase();

	const order = await db.order.findUnique({
		where: { orderNumber },
		select: {
			id: true,
			status: true,
			userId: true,
			customerEmail: true,
			shippingAddress: true,
			items: {
				where: { productId: input.productId },
				select: { id: true },
				take: 1,
			},
		},
	});

	// One message for "no such order", "wrong email" and "not your order".
	// Distinguishing them would turn this form into a way to test whether an
	// order number and an address go together.
	const matches =
		order !== null && order.customerEmail.trim().toLowerCase() === email;

	if (!matches) {
		throw new StoreOperationError(
			"We could not match that order number and email address.",
		);
	}

	if (order.status !== "DELIVERED") {
		throw new StoreOperationError(
			"That order has not been delivered yet, so it cannot be reviewed.",
		);
	}

	const orderItem = order.items[0];
	if (!orderItem) {
		throw new StoreOperationError(
			"That order does not include this product.",
		);
	}

	const authorName = reviewerNameFrom(order.shippingAddress, email);

	return db.review.upsert({
		where: { orderItemId: orderItem.id },
		create: {
			productId: input.productId,
			orderItemId: orderItem.id,
			// Kept when the buyer happened to have an account, so their
			// reviews still hang together.
			userId: order.userId,
			authorName,
			authorEmail: email,
			rating: input.rating,
			title: input.title,
			body: input.body,
			isApproved: true,
		},
		update: {
			rating: input.rating,
			title: input.title,
			body: input.body,
		},
	});
}

export async function getUserStoreAddresses(userId: string) {
	return db.address.findMany({
		where: { userId },
		orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
	});
}

export interface SaveUserStoreAddressInput {
	id?: string;
	label: string;
	recipientName: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	region: string;
	postalCode?: string;
	isDefault: boolean;
}

export async function saveUserStoreAddress(
	userId: string,
	input: SaveUserStoreAddressInput,
) {
	return db.$transaction(async (transaction) => {
		const addressCount = await transaction.address.count({
			where: { userId },
		});
		const shouldBeDefault = input.isDefault || addressCount === 0;

		if (shouldBeDefault) {
			await transaction.address.updateMany({
				where: { userId },
				data: { isDefault: false },
			});
		}

		const data = {
			label: input.label,
			recipientName: input.recipientName,
			phone: input.phone,
			line1: input.line1,
			line2: input.line2,
			city: input.city,
			region: input.region,
			postalCode: input.postalCode,
			isDefault: shouldBeDefault,
		};

		if (input.id) {
			const address = await transaction.address.findFirst({
				where: { id: input.id, userId },
				select: { id: true },
			});
			if (!address) {
				throw new StoreOperationError("Address not found.");
			}
			return transaction.address.update({
				where: { id: input.id },
				data,
			});
		}

		return transaction.address.create({ data: { ...data, userId } });
	});
}

export async function deleteUserStoreAddress(userId: string, id: string) {
	return db.$transaction(async (transaction) => {
		const address = await transaction.address.findFirst({
			where: { id, userId },
		});
		if (!address) {
			throw new StoreOperationError("Address not found.");
		}

		await transaction.address.delete({ where: { id } });
		if (address.isDefault) {
			const nextAddress = await transaction.address.findFirst({
				where: { userId },
				orderBy: { updatedAt: "desc" },
				select: { id: true },
			});
			if (nextAddress) {
				await transaction.address.update({
					where: { id: nextAddress.id },
					data: { isDefault: true },
				});
			}
		}
	});
}

export async function updateStoreOrderStatus(
	id: string,
	status: OrderStatus,
	actorId: string,
) {
	return db.$transaction(async (transaction) => {
		const current = await transaction.order.findUniqueOrThrow({
			where: { id },
			include: { items: true },
		});

		if (
			(current.status === "REFUNDED" ||
				(current.status === "CANCELLED" && status !== "REFUNDED")) &&
			status !== current.status
		) {
			throw new StoreOperationError(
				"A cancelled or refunded order cannot be reopened.",
			);
		}

		if (status === current.status) {
			return current;
		}
		if (status === "REFUNDED" && current.paymentStatus !== "PAID") {
			throw new StoreOperationError("Only paid orders can be refunded.");
		}

		const shouldRestock =
			(status === "CANCELLED" || status === "REFUNDED") &&
			current.status !== "CANCELLED" &&
			current.status !== "REFUNDED";

		if (shouldRestock) {
			await restockOrderItems(
				transaction,
				current.items,
				`${status} ${current.orderNumber}`,
				actorId,
			);
		}

		const order = await transaction.order.update({
			where: { id },
			data: {
				status,
				paymentStatus: status === "REFUNDED" ? "REFUNDED" : undefined,
			},
		});
		if (status === "REFUNDED") {
			await transaction.storeTransaction.updateMany({
				where: { orderId: id, status: "PAID" },
				data: { status: "REFUNDED", processedAt: new Date() },
			});
		}
		await transaction.orderStatusEvent.create({
			data: { orderId: id, status, actorId },
		});
		return order;
	});
}

export async function createStoreCategory(input: CreateStoreCategoryInput) {
	return db.category.create({ data: input });
}

export async function updateStoreCategory(
	id: string,
	input: UpdateStoreCategoryInput,
) {
	return db.category.update({ where: { id }, data: input });
}

export async function getStoreCategoryById(id: string) {
	return db.category.findUnique({ where: { id } });
}

/**
 * Flips one department's visibility.
 *
 * Its own function because `updateStoreCategory` takes the whole record — it
 * backs the form — and a row-level toggle has only the one field to hand.
 */
export async function setStoreCategoryActive(id: string, isActive: boolean) {
	return db.category.update({ where: { id }, data: { isActive } });
}

/**
 * The outcome of asking to delete a department.
 *
 * `Product.category` is `onDelete: Restrict`, so a department that still holds
 * products cannot be removed — every product must belong to one. Emptying it
 * first is the only route, and hiding it is usually what was meant anyway.
 */
export type DeleteStoreCategoryResult =
	| {
			status: "deleted";
			category: { id: string; name: string; slug: string };
	  }
	| { status: "has-products"; productCount: number }
	| { status: "not-found" };

export async function deleteStoreCategory(
	id: string,
): Promise<DeleteStoreCategoryResult> {
	const category = await db.category.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			slug: true,
			_count: { select: { products: true } },
		},
	});

	if (!category) {
		return { status: "not-found" };
	}

	if (category._count.products > 0) {
		return {
			status: "has-products",
			productCount: category._count.products,
		};
	}

	await db.category.delete({ where: { id } });

	return {
		status: "deleted",
		category: {
			id: category.id,
			name: category.name,
			slug: category.slug,
		},
	};
}

/**
 * Writes the running order of the departments.
 *
 * Takes the full list rather than swapping a pair, because stored `sortOrder`
 * values are not guaranteed to be distinct — everything seeded lands on 0, and
 * swapping two zeroes changes nothing. Rewriting every row from its index
 * leaves the sequence well-formed whatever it was before.
 */
export async function reorderStoreCategories(ids: string[]) {
	return db.$transaction(
		ids.map((id, index) =>
			db.category.update({ where: { id }, data: { sortOrder: index } }),
		),
	);
}

/** Slugs of the storefront pages an order's inventory movement affects. */
export async function getStorePagesForOrder(orderId: string) {
	const items = await db.orderItem.findMany({
		where: { orderId },
		select: {
			product: {
				select: { slug: true, category: { select: { slug: true } } },
			},
		},
	});

	return {
		productSlugs: [...new Set(items.map((item) => item.product.slug))],
		categorySlugs: [
			...new Set(items.map((item) => item.product.category.slug)),
		],
	};
}

/**
 * Records an audit entry without changing the order. Used when an action has
 * been requested from a payment provider but the order itself only moves once
 * the confirming webhook lands.
 */
export async function recordStoreOrderStatusNote(
	orderId: string,
	status: OrderStatus,
	actorId: string,
	note: string,
) {
	return db.orderStatusEvent.create({
		data: { orderId, status, actorId, note },
	});
}

export function getRecipientName(shippingAddress: unknown) {
	if (
		shippingAddress &&
		typeof shippingAddress === "object" &&
		"recipientName" in shippingAddress &&
		typeof shippingAddress.recipientName === "string"
	) {
		return shippingAddress.recipientName;
	}
	return "there";
}

/**
 * Revenue is only real when the customer paid AND we did not hand the goods
 * back. Cancelling a paid order restocks the inventory, so counting it as
 * revenue would overstate the books and double-count the stock.
 */
const REALISED_REVENUE_WHERE: Prisma.OrderWhereInput = {
	paymentStatus: "PAID",
	status: { notIn: ["CANCELLED", "REFUNDED"] },
};

export async function getStoreAdminMetrics() {
	const [
		products,
		activeProducts,
		lowStockProducts,
		orders,
		revenue,
		customers,
	] = await Promise.all([
		db.product.count(),
		db.product.count({ where: { status: "ACTIVE" } }),
		db.$queryRaw<
			{ id: string; name: string; stockQuantity: number }[]
		>`SELECT id, name, "stockQuantity" FROM store_product
			WHERE status = 'ACTIVE' AND "stockQuantity" <= "lowStockThreshold"
			ORDER BY "stockQuantity" ASC`,
		db.order.count(),
		db.order.aggregate({
			where: REALISED_REVENUE_WHERE,
			_sum: { totalInPesewas: true },
		}),
		db.user.count(),
	]);

	return {
		products,
		activeProducts,
		lowStockProducts,
		orders,
		revenueInPesewas: revenue._sum?.totalInPesewas ?? 0,
		customers,
	};
}

/**
 * Sales figures for a window of `days` calendar days ending today (UTC).
 * `periodsBack` shifts the whole window into the past by that many periods,
 * so `getStoreSalesAnalytics(30, 1)` is the 30 days immediately before the
 * current 30 — what the overview compares against.
 */
export async function getStoreSalesAnalytics(days = 30, periodsBack = 0) {
	const end = new Date();
	end.setUTCHours(0, 0, 0, 0);
	end.setUTCDate(end.getUTCDate() + 1 - days * periodsBack);
	const start = new Date(end);
	start.setUTCDate(end.getUTCDate() - days);

	const [orders, statusGroups, paymentGroups] = await Promise.all([
		db.order.findMany({
			where: { placedAt: { gte: start, lt: end } },
			include: { items: true },
			orderBy: { placedAt: "asc" },
		}),
		db.order.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		db.storeTransaction.groupBy({
			by: ["status"],
			where: {
				createdAt: { gte: start, lt: end },
				paymentMethod: { notIn: ["CASH_ON_DELIVERY", "WHATSAPP"] },
				status: { in: ["PAID", "FAILED", "REFUNDED"] },
			},
			_count: { _all: true },
		}),
	]);

	const daily = Array.from({ length: days }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		return {
			date: date.toISOString().slice(0, 10),
			orders: 0,
			revenueInPesewas: 0,
		};
	});
	const dailyByDate = new Map(daily.map((item) => [item.date, item]));
	const productPerformance = new Map<
		string,
		{ name: string; quantity: number; revenueInPesewas: number }
	>();

	const isRealisedRevenue = (order: (typeof orders)[number]) =>
		order.paymentStatus === "PAID" &&
		order.status !== "CANCELLED" &&
		order.status !== "REFUNDED";

	for (const order of orders) {
		const date = order.placedAt.toISOString().slice(0, 10);
		const day = dailyByDate.get(date);
		if (day) {
			day.orders += 1;
			if (isRealisedRevenue(order)) {
				day.revenueInPesewas += order.totalInPesewas;
			}
		}

		if (isRealisedRevenue(order)) {
			for (const item of order.items) {
				const current = productPerformance.get(item.productId) ?? {
					name: item.productName,
					quantity: 0,
					revenueInPesewas: 0,
				};
				current.quantity += item.quantity;
				current.revenueInPesewas += item.lineTotalInPesewas;
				productPerformance.set(item.productId, current);
			}
		}
	}

	const paidOrders = orders.filter(isRealisedRevenue);
	const revenueInPesewas = paidOrders.reduce(
		(total, order) => total + order.totalInPesewas,
		0,
	);

	// Count resolved payment attempts, including successful payments later refunded.
	const attemptedPaymentCount = paymentGroups.reduce(
		(total, group) => total + group._count._all,
		0,
	);
	const succeededPaymentCount = paymentGroups.reduce(
		(total, group) =>
			total + (group.status === "FAILED" ? 0 : group._count._all),
		0,
	);

	return {
		days,
		daily,
		orderCount: orders.length,
		paidOrderCount: paidOrders.length,
		attemptedPaymentCount,
		succeededPaymentCount,
		revenueInPesewas,
		averageOrderValueInPesewas:
			paidOrders.length > 0
				? Math.round(revenueInPesewas / paidOrders.length)
				: 0,
		statusBreakdown: statusGroups.map((group) => ({
			status: group.status,
			count: group._count._all,
		})),
		topProducts: [...productPerformance.entries()]
			.map(([productId, performance]) => ({ productId, ...performance }))
			.sort(
				(left, right) => right.revenueInPesewas - left.revenueInPesewas,
			)
			.slice(0, 5),
	};
}

// An order is waiting on the store once the customer has done their part:
// paid online, or chosen cash on delivery / WhatsApp checkout, both of which
// are only ever paid at the door.
const AWAITING_DISPATCH_WHERE: Prisma.OrderWhereInput = {
	status: {
		in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY"],
	},
	OR: [
		{ paymentStatus: "PAID" },
		{ paymentMethod: "CASH_ON_DELIVERY" },
		{ paymentMethod: "WHATSAPP" },
	],
};

export async function countOrdersAwaitingDispatch() {
	return db.order.count({ where: AWAITING_DISPATCH_WHERE });
}

export interface StoreOverviewOptions {
	/** Length of the reporting window in days. */
	days?: number;
	/** How many of the newest orders to return. */
	recentOrders?: number;
	/**
	 * How long a paid order may sit unshipped before it counts as late.
	 * Defaults to the shipped window; the overview passes the saved one.
	 */
	dispatchWindowHours?: number;
}

export async function getStoreOverview({
	days = 30,
	recentOrders = 6,
	dispatchWindowHours = DEFAULT_DISPATCH_WINDOW_HOURS,
}: StoreOverviewOptions = {}) {
	const now = new Date();
	const dispatchDeadline = new Date(
		now.getTime() - dispatchWindowHours * 60 * 60 * 1000,
	);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const windowStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	const [
		metrics,
		analytics,
		previous,
		orders,
		lowStock,
		awaitingDispatch,
		pastDispatchWindow,
		failedPayments,
		draftProducts,
		newCustomers,
	] = await Promise.all([
		getStoreAdminMetrics(),
		getStoreSalesAnalytics(days),
		getStoreSalesAnalytics(days, 1),
		getAdminStoreOrders({ take: recentOrders }),
		db.product.findMany({
			where: {
				status: "ACTIVE",
				stockQuantity: { lte: db.product.fields.lowStockThreshold },
			},
			select: {
				id: true,
				name: true,
				slug: true,
				stockQuantity: true,
				lowStockThreshold: true,
				images: {
					orderBy: { sortOrder: "asc" },
					take: 1,
					select: { url: true, alt: true },
				},
			},
			orderBy: { stockQuantity: "asc" },
			take: 6,
		}),
		db.order.count({ where: AWAITING_DISPATCH_WHERE }),
		db.order.count({
			where: {
				AND: [
					AWAITING_DISPATCH_WHERE,
					{ placedAt: { lt: dispatchDeadline } },
				],
			},
		}),
		db.order.count({
			where: { paymentStatus: "FAILED", placedAt: { gte: sevenDaysAgo } },
		}),
		db.product.count({ where: { status: "DRAFT" } }),
		db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
	]);

	const productIds = [
		...new Set([
			...lowStock.map((product) => product.id),
			...analytics.topProducts.map((product) => product.productId),
		]),
	];

	const [velocity, productDetails] = await Promise.all([
		productIds.length
			? db.orderItem.groupBy({
					by: ["productId"],
					where: {
						productId: { in: productIds },
						order: {
							placedAt: { gte: windowStart },
							...REALISED_REVENUE_WHERE,
						},
					},
					_sum: { quantity: true },
				})
			: [],
		productIds.length
			? db.product.findMany({
					where: { id: { in: productIds } },
					select: {
						id: true,
						slug: true,
						category: { select: { name: true } },
						images: {
							orderBy: { sortOrder: "asc" },
							take: 1,
							select: { url: true, alt: true },
						},
					},
				})
			: [],
	]);

	const unitsSoldByProduct = new Map(
		velocity.map((row) => [row.productId, row._sum.quantity ?? 0]),
	);
	const detailsByProduct = new Map(
		productDetails.map((product) => [product.id, product]),
	);

	return {
		days,
		generatedAt: now,
		metrics,
		analytics,
		previous,
		queues: {
			awaitingDispatch,
			pastDispatchWindow,
			failedPayments,
			draftProducts,
			newCustomers,
		},
		recentOrders: orders,
		lowStock: lowStock.map((product) => ({
			id: product.id,
			name: product.name,
			slug: product.slug,
			stockQuantity: product.stockQuantity,
			lowStockThreshold: product.lowStockThreshold,
			imageUrl: product.images[0]?.url ?? null,
			imageAlt: product.images[0]?.alt ?? product.name,
			unitsPerDay: (unitsSoldByProduct.get(product.id) ?? 0) / days,
		})),
		topProducts: analytics.topProducts.map((product) => {
			const details = detailsByProduct.get(product.productId);
			return {
				...product,
				slug: details?.slug ?? null,
				categoryName: details?.category?.name ?? null,
				imageUrl: details?.images[0]?.url ?? null,
				imageAlt: details?.images[0]?.alt ?? product.name,
			};
		}),
	};
}

export type StoreOverview = Awaited<ReturnType<typeof getStoreOverview>>;
