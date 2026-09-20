import {
	getLiveCategories,
	getLiveCollections,
	getLiveProducts,
} from "@commerce/lib/live-catalog";
import { getUniqueBasePaths } from "@shared/lib/content";
import { siteUrl } from "@shared/lib/seo";
import { allLegalPages, allPosts } from "content-collections";
import type { MetadataRoute } from "next";

/**
 * The sitemap is generated per request rather than at build time, because the
 * catalogue it lists is edited from the admin and would otherwise freeze at
 * whatever was in stock when the Worker was last deployed.
 */
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/** Written pages: stable, and the shop's front door. */
const STATIC_PAGES: Array<{
	path: string;
	priority: number;
	changeFrequency: Entry["changeFrequency"];
}> = [
	{ path: "", priority: 1, changeFrequency: "daily" },
	{ path: "/shop", priority: 0.9, changeFrequency: "daily" },
	{ path: "/contact", priority: 0.5, changeFrequency: "yearly" },
	{ path: "/blog", priority: 0.5, changeFrequency: "weekly" },
	{ path: "/changelog", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();

	const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
		url: siteUrl(page.path || "/"),
		lastModified: now,
		changeFrequency: page.changeFrequency,
		priority: page.priority,
	}));

	// The written pages come from content collections and are always present.
	for (const path of getUniqueBasePaths(allPosts)) {
		entries.push({
			url: siteUrl(`/blog/${path}`),
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.4,
		});
	}

	for (const path of getUniqueBasePaths(allLegalPages)) {
		entries.push({
			url: siteUrl(`/legal/${path}`),
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.2,
		});
	}

	/*
	 * The catalogue is the entire SEO surface of a shop, and it was missing:
	 * no departments, no collections and not one product URL. It is also the
	 * only part that can fail, so a database that is briefly unreachable
	 * returns the written pages rather than no sitemap at all.
	 */
	try {
		const [categories, collections, products] = await Promise.all([
			getLiveCategories({ stockedOnly: true }),
			getLiveCollections({ includeSmart: true }),
			getLiveProducts(),
		]);

		for (const category of categories) {
			entries.push({
				url: siteUrl(`/categories/${category.slug}`),
				lastModified: now,
				changeFrequency: "daily",
				priority: 0.8,
			});
		}

		for (const collection of collections) {
			entries.push({
				url: siteUrl(`/shop?collection=${collection.slug}`),
				lastModified: now,
				changeFrequency: "weekly",
				priority: 0.6,
			});
		}

		for (const product of products) {
			entries.push({
				url: siteUrl(`/products/${product.slug}`),
				lastModified: new Date(product.addedAt),
				changeFrequency: "weekly",
				// Something in stock is worth more to a shopper arriving from
				// search than something they cannot buy today.
				priority: product.stockQuantity > 0 ? 0.7 : 0.4,
			});
		}
	} catch {
		// Fall through with the written pages.
	}

	return entries;
}
