import { getUniqueBasePaths } from "@shared/lib/content";
import type { LegalPage } from "content-collections";
import { allLegalPages } from "content-collections";

/**
 * Returns paths of all legal pages for use in generateStaticParams.
 */
export function getAllLegalPagePaths(): string[] {
	return getUniqueBasePaths(allLegalPages);
}

/**
 * Returns all legal pages.
 */
export async function getAllLegalPages(): Promise<Array<Omit<LegalPage, "_meta">>> {
	const paths = getUniqueBasePaths(allLegalPages);

	const pages = paths
		.map((path) => allLegalPages.find((page) => page.path === path))
		.filter((page): page is NonNullable<typeof page> => page != null);

	return Promise.resolve(pages);
}

/**
 * Returns a legal page by path.
 */
export async function getLegalPageByPath(
	path: string,
): Promise<Omit<LegalPage, "_meta"> | null> {
	const page = allLegalPages.find((item) => item.path === path);

	return Promise.resolve(page ?? null);
}
