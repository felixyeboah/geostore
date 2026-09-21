import {
	getAdminProductList,
	getAdminStoreProductsByIds,
} from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

/**
 * Catalogue search for the admin's product pickers.
 *
 * The search runs in the database, like every other admin filter, so a picker
 * never needs the whole catalogue in the browser to find one product. `ids`
 * fetches an explicit set alongside the search, which is how a picker shows
 * what is already chosen even when the current query does not match it.
 */
export const searchProducts = adminProcedure
	.route({
		method: "GET",
		path: "/admin/products/search",
		tags: ["Administration", "Products"],
		summary: "Search products for a picker",
	})
	.input(
		z.object({
			query: z.string().trim().optional(),
			ids: z.array(z.string().min(1)).max(200).optional(),
			limit: z.number().int().min(1).max(100).default(20),
			page: z.number().int().min(1).default(1),
		}),
	)
	.handler(async ({ input: { query, ids, limit, page } }) => {
		const [matches, chosen] = await Promise.all([
			getAdminProductList({
				q: query,
				sort: "name",
				dir: "asc",
				// Chosen products arrive through `chosen`; leaving them in the
				// search would burn page slots and skew the page count.
				excludeIds: ids,
				perPage: limit,
				page,
			}),
			ids?.length ? getAdminStoreProductsByIds(ids) : Promise.resolve([]),
		]);

		const toSummary = (product: {
			id: string;
			name: string;
			brand: string;
			sku: string;
			status: string;
			priceInPesewas: number;
			images: Array<{ url: string }>;
		}) => ({
			id: product.id,
			name: product.name,
			brand: product.brand,
			sku: product.sku,
			status: product.status,
			priceInPesewas: product.priceInPesewas,
			imageUrl: product.images[0]?.url ?? null,
		});

		return {
			products: matches.products.map(toSummary),
			chosen: chosen.map(toSummary),
			total: matches.total,
			page: matches.page,
			pageCount: matches.pageCount,
		};
	});
