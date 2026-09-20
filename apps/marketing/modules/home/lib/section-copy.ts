/** A product a band points at, resolved from the catalogue at render time. */
export interface ReferencedProduct {
	id: string;
	name: string;
	slug: string;
	brand: string;
	imageUrl: string | null;
}

/** Copy overrides an editor saved for this band, empty when untouched. */
export interface SectionCopyProps {
	copy?: Record<string, string>;
	/** Resolved products, keyed by the field that references them. */
	products?: Record<string, ReferencedProduct>;
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
