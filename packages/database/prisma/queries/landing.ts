import { db } from "../client";
import type { Prisma } from "../generated/client";

/**
 * Landing page section rows.
 *
 * A row records an editor's decisions about one band of the page: whether it
 * shows, where it sits and any copy overriding the shipped default. The
 * catalogue of section types lives in code, so a row without a matching
 * definition is simply ignored by the renderer rather than breaking the page.
 */
export async function getLandingSections() {
	return db.landingSection.findMany({
		orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
	});
}

export async function getVisibleLandingSections() {
	return db.landingSection.findMany({
		where: { isVisible: true },
		orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
	});
}

export async function setLandingSectionVisibility(
	key: string,
	isVisible: boolean,
) {
	return db.landingSection.update({
		where: { key },
		data: { isVisible },
	});
}

export async function saveLandingSectionSettings(
	key: string,
	settings: Prisma.InputJsonValue,
) {
	return db.landingSection.update({
		where: { key },
		data: { settings },
	});
}

/**
 * Rewrites the running order from a list of keys.
 *
 * Reordering is one transaction because a half-applied order would show the
 * shopper a page with two sections claiming the same slot.
 */
export async function setLandingSectionOrder(keys: string[]) {
	return db.$transaction(
		keys.map((key, sortOrder) =>
			db.landingSection.update({
				where: { key },
				data: { sortOrder },
			}),
		),
	);
}

/**
 * Makes sure every section in the code catalogue has a row, without disturbing
 * rows an editor has already touched. Called before the admin lists them, so a
 * newly shipped section appears on its own.
 */
export async function ensureLandingSections(
	definitions: Array<{ key: string; defaultSortOrder: number }>,
) {
	const existing = await db.landingSection.findMany({
		select: { key: true },
	});
	const known = new Set(existing.map((row) => row.key));
	const missing = definitions.filter(
		(definition) => !known.has(definition.key),
	);

	if (missing.length > 0) {
		await db.landingSection.createMany({
			data: missing.map((definition) => ({
				key: definition.key,
				sortOrder: definition.defaultSortOrder,
				isVisible: true,
			})),
		});
	}

	return getLandingSections();
}
