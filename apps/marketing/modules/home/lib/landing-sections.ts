import { LANDING_SECTIONS, parseLandingSettings } from "@repo/commerce";
import { getLandingSections } from "@repo/database";

export interface RenderableSection {
	key: string;
	/** Copy overrides an editor saved. Empty when they changed nothing. */
	copy: Record<string, string>;
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

	return LANDING_SECTIONS.map((section) => ({
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
			key: section.key,
			copy: parseLandingSettings(row?.settings),
		}));
}
