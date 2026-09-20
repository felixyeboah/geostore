import type { StorefrontChrome } from "@repo/commerce";

/** A product a band points at, resolved from the catalogue at render time. */
export interface ReferencedProduct {
	id: string;
	name: string;
	slug: string;
	brand: string;
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	imageUrl: string | null;
	rating: number | null;
	reviewCount: number;
}

/** A department, as the landing page needs it. */
export interface CatalogueDepartment {
	name: string;
	slug: string;
	description: string;
	imageUrl: string;
	href: string;
}

/** A collection an editor put on the landing page. */
export interface CatalogueCollection {
	name: string;
	slug: string;
	description: string;
	imageUrl?: string;
	href: string;
}

/**
 * The shop's own taxonomy, read once per request.
 *
 * Bands that are lists of departments or collections render from this rather
 * than from a hardcoded set, so adding a department in the back office adds it
 * to the front page. Empty means the database had nothing to offer, and the
 * band falls back to what it ships with.
 */
export interface SectionCatalogue {
	departments: CatalogueDepartment[];
	collections: CatalogueCollection[];
}

/** Copy overrides an editor saved for this band, empty when untouched. */
export interface SectionCopyProps {
	copy?: Record<string, string>;
	/** Resolved products, keyed by the field that references them. */
	products?: Record<string, ReferencedProduct>;
	/** Resolved product lists, keyed by the field that references them. */
	productLists?: Record<string, ReferencedProduct[]>;
	/** The shop's departments and landing collections. */
	catalogue?: SectionCatalogue;
	/** Editable chrome — the phone and WhatsApp numbers a band links to. */
	chrome?: StorefrontChrome;
}

type Translator = (path: string) => string;

/**
 * Resolves one field of a landing section: the editor's override when they set
 * one, otherwise the copy shipped in the translation file.
 *
 * Whitespace counts as unset, so clearing a field in the admin restores the
 * built-in text rather than leaving a gap on the page. This is what makes the
 * editor safe: no combination of saved values can blank out a band.
 */
export function sectionCopy(
	copy: Record<string, string> | undefined,
	t: Translator,
	prefix: string,
) {
	return (field: string): string => {
		const override = copy?.[field];
		return override && override.trim().length > 0
			? override
			: t(`${prefix}.${field}`);
	};
}
