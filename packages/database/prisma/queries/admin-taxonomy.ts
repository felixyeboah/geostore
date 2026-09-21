import { db } from "../client";
import { Prisma } from "../generated/client";
import { StoreOperationError } from "./errors";

export interface AdminTaxonomyFilters {
	q?: string;
	status?: "visible" | "hidden" | null;
	page?: number;
	perPage?: number;
}

function pagination(total: number, filters: AdminTaxonomyFilters) {
	const perPage = Number.isFinite(filters.perPage)
		? Math.min(100, Math.max(1, Math.trunc(filters.perPage ?? 25)))
		: 25;
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	const page = Number.isFinite(filters.page)
		? Math.min(pageCount, Math.max(1, Math.trunc(filters.page ?? 1)))
		: 1;
	return { total, page, pageCount, perPage };
}

export async function getAdminCategoryList(filters: AdminTaxonomyFilters = {}) {
	const q = filters.q?.trim();
	const where: Prisma.CategoryWhereInput = {
		...(filters.status ? { isActive: filters.status === "visible" } : {}),
		...(q
			? {
					OR: [
						{ name: { contains: q } },
						{ slug: { contains: q } },
						{ description: { contains: q } },
					],
				}
			: {}),
	};
	return db.$transaction(
		async (tx) => {
			const total = await tx.category.count({ where });
			const order = await tx.category.aggregate({
				_max: { sortOrder: true },
			});
			const paging = pagination(total, filters);
			const rows = await tx.category.findMany({
				where,
				orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
				skip: (paging.page - 1) * paging.perPage,
				take: paging.perPage,
				include: { _count: { select: { products: true } } },
			});
			return {
				...paging,
				nextSortOrder: (order._max.sortOrder ?? -1) + 1,
				rows,
				canReorder: !q && !filters.status,
			};
		},
		{ isolationLevel: "Serializable" },
	);
}

export async function getAdminCollectionList(
	filters: AdminTaxonomyFilters = {},
) {
	const q = filters.q?.trim();
	const where: Prisma.CollectionWhereInput = {
		...(filters.status ? { isActive: filters.status === "visible" } : {}),
		...(q
			? {
					OR: [
						{ name: { contains: q } },
						{ slug: { contains: q } },
						{ description: { contains: q } },
					],
				}
			: {}),
	};
	return db.$transaction(
		async (tx) => {
			const total = await tx.collection.count({ where });
			const order = await tx.collection.aggregate({
				_max: { sortOrder: true },
			});
			const paging = pagination(total, filters);
			const rows = await tx.collection.findMany({
				where,
				orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
				skip: (paging.page - 1) * paging.perPage,
				take: paging.perPage,
				include: { _count: { select: { products: true } } },
			});
			return {
				...paging,
				nextSortOrder: (order._max.sortOrder ?? -1) + 1,
				rows,
				canReorder: !q && !filters.status,
			};
		},
		{ isolationLevel: "Serializable" },
	);
}

/** Move against the current global order, never a stale client page. */
export async function moveAdminTaxonomy({
	kind,
	id,
	direction,
}: {
	kind: "category" | "collection";
	id: string;
	direction: -1 | 1;
}) {
	if (
		(kind !== "category" && kind !== "collection") ||
		(direction !== -1 && direction !== 1)
	) {
		throw new StoreOperationError("Invalid catalogue move.");
	}
	return db.$transaction(
		async (tx) => {
			const options = {
				orderBy: [
					{ sortOrder: "asc" as const },
					{ name: "asc" as const },
					{ id: "asc" as const },
				],
				select: { id: true },
			};
			const rows =
				kind === "category"
					? await tx.category.findMany(options)
					: await tx.collection.findMany(options);
			const index = rows.findIndex((row) => row.id === id);
			if (index < 0) {
				throw new StoreOperationError(
					"This catalogue item no longer exists.",
				);
			}
			const target = index + direction;
			if (target < 0 || target >= rows.length) {
				return;
			}
			[rows[index], rows[target]] = [rows[target], rows[index]];
			// A single parameterized update normalizes ties and swaps across page edges.
			const table =
				kind === "category"
					? Prisma.sql`"store_category"`
					: Prisma.sql`"store_collection"`;
			await tx.$executeRaw(
				Prisma.sql`UPDATE ${table} SET "sortOrder" = CASE "id" ${Prisma.join(
					rows.map(
						(row, position) =>
							Prisma.sql`WHEN ${row.id} THEN ${position}`,
					),
					" ",
				)} END, "updatedAt" = ${new Date()} WHERE "id" IN (${Prisma.join(rows.map((row) => row.id))})`,
			);
		},
		{ isolationLevel: "Serializable" },
	);
}
