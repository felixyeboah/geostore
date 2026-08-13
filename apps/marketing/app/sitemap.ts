import { getBaseUrl } from "@shared/lib/base-url";
import { getUniqueBasePaths } from "@shared/lib/content";
import { allLegalPages, allPosts } from "content-collections";
import type { MetadataRoute } from "next";

const baseUrl = getBaseUrl();

const staticMarketingPages = ["", "/blog", "/changelog"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const postPaths = getUniqueBasePaths(allPosts);
	const legalPaths = getUniqueBasePaths(allLegalPages);

	return [
		...staticMarketingPages.map((page) => ({
			url: new URL(page, baseUrl).href,
			lastModified: new Date(),
		})),
		...postPaths.map((path) => ({
			url: new URL(`/blog/${path}`, baseUrl).href,
			lastModified: new Date(),
		})),
		...legalPaths.map((path) => ({
			url: new URL(`/legal/${path}`, baseUrl).href,
			lastModified: new Date(),
		})),
	];
}
