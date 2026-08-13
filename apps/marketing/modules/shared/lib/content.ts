import slugify from "slugify";

export type ContentStructureItem = {
	label: string;
	path: string;
	children: ContentStructureItem[];
	isPage: boolean;
};

export function getActivePathFromUrlParam(path: string | string[]) {
	return Array.isArray(path) ? path.join("/") : path || "";
}

/**
 * Returns unique base paths from documents. Each path represents one content item;
 */
export function getUniqueBasePaths<T extends { path: string }>(
	documents: T[],
): string[] {
	return [...new Set(documents.map((doc) => doc.path))];
}

export function slugifyHeadline(headline: string) {
	return slugify(headline, {
		lower: true,
		replacement: "-",
		trim: true,
		strict: true,
		remove: /[*+~.()'"!:@]/g,
	});
}
