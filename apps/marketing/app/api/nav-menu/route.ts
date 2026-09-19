import {
	getLiveCategories,
	getLiveCollections,
	getLiveProducts,
} from "@commerce/lib/live-catalog";
import { NextResponse } from "next/server";

/** Brand pills per department, before the menu starts to sprawl. */
const BRAND_LIMIT = 8;

/**
 * Catalogue shape for the shop mega menu.
 *
 * This is an endpoint rather than a prop on the nav because the nav lives in
 * the root layout: querying there would make every page in the app dynamic,
 * including the blog and the legal pages. The menu fetches once, the first
 * time someone opens it.
 */
export const revalidate = 300;

export async function GET() {
	const [categories, collections, products] = await Promise.all([
		getLiveCategories({ stockedOnly: true }),
		getLiveCollections({ includeSmart: true }),
		getLiveProducts(),
	]);

	const departments = categories.map((category) => {
		const inDepartment = products.filter(
			(product) => product.categorySlug === category.slug,
		);

		// The most-sold item in the department, which is a better shop window
		// than whichever product happens to be first.
		const featured = [...inDepartment].sort(
			(left, right) => right.unitsSold - left.unitsSold,
		)[0];

		return {
			slug: category.slug,
			name: category.name,
			blurb: category.description,
			productCount: inDepartment.length,
			brands: [...new Set(inDepartment.map((product) => product.brand))]
				.sort((left, right) => left.localeCompare(right))
				.slice(0, BRAND_LIMIT),
			featured: featured
				? {
						slug: featured.slug,
						name: featured.name,
						brand: featured.brand,
						imageUrl: featured.imageUrl,
						priceInPesewas: featured.priceInPesewas,
					}
				: null,
		};
	});

	return NextResponse.json({
		departments,
		collections: collections.map((collection) => ({
			slug: collection.slug,
			name: collection.name,
			kind: collection.kind,
		})),
		reducedCount: products.filter(
			(product) =>
				product.compareAtInPesewas !== undefined &&
				product.compareAtInPesewas > product.priceInPesewas,
		).length,
	});
}
