import { LANDING_SECTIONS, parseLandingSettings } from "@repo/commerce";
import {
	getLandingSections,
	getPublishedStoreProductsByIds,
} from "@repo/database";

/** A product a band points at, read fresh rather than copied into the band. */
export interface ReferencedProduct {
	id: string;
	name: string;
	slug: string;
	brand: string;
	imageUrl: string | null;
}

export interface RenderableSection {
	key: string;
	/** Copy overrides an editor saved. Empty when they changed nothing. */
	copy: Record<string, string>;
	/** Products the band references, by the field key that points at them. */
	products?: Record<string, ReferencedProduct>;
}

/**
 * What the landing page should render, in order.
 *
 * The code catalogue decides which sections exist; the database only records
 * what an editor decided about them. A section with no row shows in its
 * shipped position, and a row whose key no longer matches a component is
 * ignored. Neither case can take the page down.
 *
 * All rows are read rather than only the visible ones, because "hidden" and
 * "never configured" have to be told apart: the first must not render, the
 * second must.
 */
export async function getRenderableSections(): Promise<RenderableSection[]> {
	let rows: Awaited<ReturnType<typeof getLandingSections>> = [];

	try {
		rows = await getLandingSections();
	} catch (error) {
		// The landing page is the shop window. It renders with its shipped
		// copy even when the database is unreachable.
		console.error("[landing-sections] falling back to shipped copy", error);
		return LANDING_SECTIONS.map((section) => ({
			key: section.key,
			copy: {},
		}));
	}

	const byKey = new Map(rows.map((row) => [row.key, row]));

	const visible = LANDING_SECTIONS.map((section) => ({
		section,
		row: byKey.get(section.key),
	}))
		.filter(({ row }) => row?.isVisible ?? true)
		.sort(
			(left, right) =>
				(left.row?.sortOrder ?? left.section.defaultSortOrder) -
				(right.row?.sortOrder ?? right.section.defaultSortOrder),
		)
		.map(({ section, row }) => ({
			section,
			copy: parseLandingSettings(row?.settings),
		}));

	// Every product referenced anywhere on the page, fetched once. An id that
	// no longer resolves — withdrawn, archived, deleted — simply drops out,
	// and the band falls back to its shipped content.
	const references = visible.flatMap(({ section, copy }) =>
		section.fields
			.filter((field) => field.type === "product")
			.flatMap((field) => {
				const id = copy[field.key]?.trim();
				return id
					? [{ sectionKey: section.key, fieldKey: field.key, id }]
					: [];
			}),
	);

	const resolved = await resolveProducts(references.map((entry) => entry.id));

	return visible.map(({ section, copy }) => {
		const products: Record<string, ReferencedProduct> = {};

		for (const reference of references) {
			if (reference.sectionKey !== section.key) {
				continue;
			}
			const product = resolved.get(reference.id);
			if (product) {
				products[reference.fieldKey] = product;
			}
		}

		return {
			key: section.key,
			copy,
			products: Object.keys(products).length > 0 ? products : undefined,
		};
	});
}

async function resolveProducts(
	ids: string[],
): Promise<Map<string, ReferencedProduct>> {
	const unique = [...new Set(ids)];

	if (unique.length === 0) {
		return new Map();
	}

	try {
		const products = await getPublishedStoreProductsByIds(unique);
		return new Map(
			products.map((product) => [
				product.id,
				{
					id: product.id,
					name: product.name,
					slug: product.slug,
					brand: product.brand,
					imageUrl: product.images[0]?.url ?? null,
				},
			]),
		);
	} catch (error) {
		// Same contract as the sections themselves: the shop window renders
		// with its shipped content even when the database is unreachable.
		console.error("[landing-sections] could not resolve products", error);
		return new Map();
	}
}
