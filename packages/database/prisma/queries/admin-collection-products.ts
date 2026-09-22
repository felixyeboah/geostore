import { db } from "../client";

/** Bounded membership reads, fetched only when the collection editor opens. */
export async function getAdminCollectionProductPage(
	collectionId: string,
	page = 1,
) {
	const perPage = 100;
	const collection = await db.collection.findUnique({
		where: { id: collectionId },
		select: { id: true },
	});
	if (!collection) {
		return null;
	}
	const total = await db.productCollection.count({ where: { collectionId } });
	const products = await db.productCollection.findMany({
		where: { collectionId },
		orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
		skip: (page - 1) * perPage,
		take: perPage,
		select: {
			product: {
				select: {
					id: true,
					name: true,
					brand: true,
					sku: true,
					status: true,
					priceInPesewas: true,
					images: {
						orderBy: { sortOrder: "asc" },
						take: 1,
						select: { url: true },
					},
				},
			},
		},
	});
	return {
		products: products.map(({ product }) => ({
			id: product.id,
			name: product.name,
			brand: product.brand,
			sku: product.sku,
			status: product.status,
			priceInPesewas: product.priceInPesewas,
			imageUrl: product.images[0]?.url ?? null,
		})),
		total,
		page,
		pageCount: Math.max(1, Math.ceil(total / perPage)),
	};
}
