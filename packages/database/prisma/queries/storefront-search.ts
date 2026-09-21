import { db } from "../client";
import type { Prisma } from "../generated/client";

/** Every word must match, including when words span brand and model fields. */
export function storefrontSearchWhere(
	query?: string,
): Prisma.ProductWhereInput {
	const terms = query?.trim().split(/\s+/).filter(Boolean) ?? [];
	return terms.length
		? {
				AND: terms.map((term) => ({
					OR: [
						{ name: { contains: term } },
						{ brand: { contains: term } },
						{ sku: { contains: term } },
						{ shortDescription: { contains: term } },
						{ category: { name: { contains: term } } },
						{
							variants: {
								some: {
									isActive: true,
									OR: [
										{ name: { contains: term } },
										{ sku: { contains: term } },
									],
								},
							},
						},
					],
				})),
			}
		: {};
}

export async function searchPublishedStoreProducts(query: string) {
	const where: Prisma.ProductWhereInput = {
		status: "ACTIVE",
		category: { isActive: true },
		...storefrontSearchWhere(query),
	};
	const [total, products] = await Promise.all([
		db.product.count({ where }),
		db.product.findMany({
			where,
			take: 6,
			orderBy: [
				{ isFeatured: "desc" },
				{ createdAt: "desc" },
				{ id: "asc" },
			],
			select: {
				slug: true,
				name: true,
				brand: true,
				priceInPesewas: true,
				category: { select: { slug: true } },
				images: {
					where: { optionAxis: null },
					orderBy: { sortOrder: "asc" },
					take: 1,
					select: { url: true },
				},
			},
		}),
	]);
	return {
		total,
		products: products.map(({ category, images, ...product }) => ({
			...product,
			categorySlug: category.slug,
			imageUrl: images[0]?.url ?? "/images/product-placeholder.svg",
		})),
	};
}
