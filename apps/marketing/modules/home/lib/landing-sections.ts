import {
	getLiveCategories,
	getLiveCollections,
} from "@commerce/lib/live-catalog";
import { links } from "@home/data/landing";
import type { SectionCatalogue } from "@home/lib/section-copy";
import {
	LANDING_SECTIONS,
	parseIdList,
	parseLandingSettings,
} from "@repo/commerce";
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
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	imageUrl: string | null;
	/** Null when nobody has reviewed it; the band then shows no stars. */
	rating: number | null;
	reviewCount: number;
}

export interface RenderableSection {
	key: string;
	/** Copy overrides an editor saved. Empty when they changed nothing. */
	copy: Record<string, string>;
	/** Products the band references, by the field key that points at them. */
	products?: Record<string, ReferencedProduct>;
	/** Product lists the band references, in the order an editor arranged them. */
	productLists?: Record<string, ReferencedProduct[]>;
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
export async function getRenderableSections(options?: {
	/** Read the staged draft columns instead of the published ones — the back
	 * office's preview renders exactly what Publish would produce. */
	draft?: boolean;
}): Promise<RenderableSection[]> {
	const draft = options?.draft === true;
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

	// In draft mode the staged columns win wherever they are set; a null draft
	// column means "same as published".
	const visible = LANDING_SECTIONS.map((section) => ({
		section,
		row: byKey.get(section.key),
	}))
		.filter(
			({ row }) =>
				(draft
					? (row?.draftIsVisible ?? row?.isVisible)
					: row?.isVisible) ?? true,
		)
		.sort(
			(left, right) =>
				((draft
					? (left.row?.draftSortOrder ?? left.row?.sortOrder)
					: left.row?.sortOrder) ?? left.section.defaultSortOrder) -
				((draft
					? (right.row?.draftSortOrder ?? right.row?.sortOrder)
					: right.row?.sortOrder) ?? right.section.defaultSortOrder),
		)
		.map(({ section, row }) => ({
			section,
			copy: parseLandingSettings(
				draft && row?.draftSettings !== null
					? row?.draftSettings
					: row?.settings,
			),
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

	const listReferences = visible.flatMap(({ section, copy }) =>
		section.fields
			.filter((field) => field.type === "products")
			.flatMap((field) => {
				const ids = parseIdList(copy[field.key]);
				return ids.length
					? [{ sectionKey: section.key, fieldKey: field.key, ids }]
					: [];
			}),
	);

	const resolved = await resolveProducts([
		...references.map((entry) => entry.id),
		...listReferences.flatMap((entry) => entry.ids),
	]);

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

		const productLists: Record<string, ReferencedProduct[]> = {};

		for (const reference of listReferences) {
			if (reference.sectionKey !== section.key) {
				continue;
			}
			// Ids that no longer resolve drop out; the rest keep their order.
			const list = reference.ids.flatMap((id) => {
				const product = resolved.get(id);
				return product ? [product] : [];
			});
			if (list.length > 0) {
				productLists[reference.fieldKey] = list;
			}
		}

		return {
			key: section.key,
			copy,
			products: Object.keys(products).length > 0 ? products : undefined,
			productLists:
				Object.keys(productLists).length > 0 ? productLists : undefined,
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
					priceInPesewas: product.priceInPesewas,
					compareAtInPesewas: product.compareAtInPesewas,
					imageUrl: product.images[0]?.url ?? null,
					rating:
						product.reviews.length > 0
							? Math.round(
									(product.reviews.reduce(
										(total, review) =>
											total + review.rating,
										0,
									) /
										product.reviews.length) *
										10,
								) / 10
							: null,
					reviewCount: product.reviews.length,
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

/**
 * The shop's own taxonomy, for the bands that are lists of it.
 *
 * Departments are the ones carrying stock, and collections the ones an editor
 * put on the landing page — the same two sets the back office manages. A
 * failure here is not fatal: the bands fall back to the set they ship with,
 * so the shop window still opens.
 */
export async function getSectionCatalogue(): Promise<SectionCatalogue> {
	try {
		const [departments, collections] = await Promise.all([
			getLiveCategories({ stockedOnly: true }),
			getLiveCollections({ onLandingOnly: true }),
		]);

		return {
			departments: departments.map((department) => ({
				name: department.name,
				slug: department.slug,
				description: department.description,
				imageUrl: department.imageUrl,
				href: links.department(department.slug),
			})),
			collections: collections.map((collection) => ({
				name: collection.name,
				slug: collection.slug,
				description: collection.description,
				imageUrl: collection.imageUrl,
				href: links.collection(collection.slug),
			})),
		};
	} catch (error) {
		console.error("[landing-sections] could not read the catalogue", error);
		return { departments: [], collections: [] };
	}
}
