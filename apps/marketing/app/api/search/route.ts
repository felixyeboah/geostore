import { getLiveProducts } from "@commerce/lib/live-catalog";
import { NextResponse } from "next/server";

/** How many matches the dialog shows before deferring to the shop page. */
const PREVIEW_LIMIT = 6;

export async function GET(request: Request) {
	const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

	// One or two characters match almost everything, which makes the dialog
	// flicker through the whole catalogue while someone is still typing.
	if (query.length < 2) {
		return NextResponse.json({ total: 0, products: [] });
	}

	const products = await getLiveProducts({ query });

	return NextResponse.json({
		total: products.length,
		products: products.slice(0, PREVIEW_LIMIT).map((product) => ({
			slug: product.slug,
			name: product.name,
			brand: product.brand,
			categorySlug: product.categorySlug,
			imageUrl: product.imageUrl,
			priceInPesewas: product.priceInPesewas,
		})),
	});
}
