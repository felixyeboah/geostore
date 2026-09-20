import { db } from "../client";
import { Prisma } from "../generated/client";

/**
 * Landing page section rows.
 *
 * A row records an editor's decisions about one band of the page: whether it
 * shows, where it sits and any copy overriding the shipped default. The
 * catalogue of section types lives in code, so a row without a matching
 * definition is simply ignored by the renderer rather than breaking the page.
 *
 * Edits land in the `draft*` columns first — the published columns are what
 * the storefront reads, so nothing reaches the shop window until Publish.
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

/**
 * Stages a visibility change. Staging the published value leaves no draft —
 * a section that ends up where it started has nothing to publish.
 */
export async function setLandingSectionDraftVisibility(
	key: string,
	isVisible: boolean,
) {
	const row = await db.landingSection.findUnique({
		where: { key },
		select: { isVisible: true },
	});

	return db.landingSection.update({
		where: { key },
		data: {
			draftIsVisible: isVisible === row?.isVisible ? null : isVisible,
		},
	});
}

/**
 * Stages a running order. When the keys already match the published order the
 * staged positions are cleared instead — there is nothing to publish.
 */
export async function setLandingSectionDraftOrder(keys: string[]) {
	const rows = await db.landingSection.findMany({
		orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
		select: { key: true },
	});
	const matchesLive =
		rows.length === keys.length &&
		rows.every((row, index) => row.key === keys[index]);

	if (matchesLive) {
		return db.landingSection.updateMany({
			data: { draftSortOrder: null },
		});
	}

	return db.$transaction(
		keys.map((key, draftSortOrder) =>
			db.landingSection.update({
				where: { key },
				data: { draftSortOrder },
			}),
		),
	);
}

/**
 * Stages a section's copy. `{}` stages a revert to the shipped text. Staging
 * the same overrides that are already published clears the draft instead.
 */
export async function setLandingSectionDraftSettings(
	key: string,
	settings: Record<string, string>,
) {
	const row = await db.landingSection.findUnique({
		where: { key },
		select: { settings: true },
	});

	return db.landingSection.update({
		where: { key },
		data: {
			draftSettings: sameSettings(settings, row?.settings)
				? Prisma.DbNull
				: settings,
		},
	});
}

/** Throws away every staged landing change, published columns untouched. */
export async function discardLandingDraft() {
	const [sections] = await db.$transaction([
		db.landingSection.updateMany({
			data: {
				draftIsVisible: null,
				draftSortOrder: null,
				draftSettings: Prisma.DbNull,
			},
		}),
		db.storefrontSetting.updateMany({ data: { draftValue: null } }),
	]);

	return { cleared: sections.count };
}

/** Settings objects compare by content, not by the order keys happen to sit in. */
function sameSettings(left: unknown, right: unknown): boolean {
	const normalise = (value: unknown) =>
		!value || typeof value !== "object" || Array.isArray(value)
			? {}
			: Object.fromEntries(
					Object.entries(value).sort(([a], [b]) =>
						a.localeCompare(b),
					),
				);

	return JSON.stringify(normalise(left)) === JSON.stringify(normalise(right));
}

export interface PublishResult {
	/** Sections whose published state actually changed. */
	sections: number;
	/** Storefront settings whose published value actually changed. */
	settings: number;
}

/**
 * Copies every staged value over its published column, in one transaction so
 * the page never shows a half-published draft.
 *
 * Each changed section also writes a revision row — stamped with the one
 * `publishedAt` for the whole batch, so a publish reads back as a single
 * event — and chrome drafts apply in the same transaction.
 */
export async function publishLandingDraft(user: {
	id: string;
	name: string;
}): Promise<PublishResult> {
	const [sectionRows, settingRows] = await Promise.all([
		db.landingSection.findMany(),
		db.storefrontSetting.findMany({
			where: { draftValue: { not: null } },
		}),
	]);

	const publishedAt = new Date();
	const operations: Prisma.PrismaPromise<unknown>[] = [];
	let sections = 0;
	let settings = 0;

	for (const row of sectionRows) {
		const staged =
			row.draftIsVisible !== null ||
			row.draftSortOrder !== null ||
			row.draftSettings !== null;
		if (!staged) {
			continue;
		}

		const next = {
			isVisible: row.draftIsVisible ?? row.isVisible,
			sortOrder: row.draftSortOrder ?? row.sortOrder,
			settings:
				row.draftSettings === null ? row.settings : row.draftSettings,
		};
		const changed =
			next.isVisible !== row.isVisible ||
			next.sortOrder !== row.sortOrder ||
			!sameSettings(next.settings, row.settings);

		operations.push(
			db.landingSection.update({
				where: { key: row.key },
				data: {
					isVisible: next.isVisible,
					sortOrder: next.sortOrder,
					settings:
						next.settings === null
							? Prisma.DbNull
							: (next.settings as Prisma.InputJsonValue),
					draftIsVisible: null,
					draftSortOrder: null,
					draftSettings: Prisma.DbNull,
					updatedBy: user.name,
				},
			}),
		);

		if (changed) {
			sections += 1;
			operations.push(
				db.landingSectionRevision.create({
					data: {
						sectionKey: row.key,
						isVisible: next.isVisible,
						sortOrder: next.sortOrder,
						settings:
							next.settings === null
								? Prisma.DbNull
								: (next.settings as Prisma.InputJsonValue),
						userId: user.id,
						userName: user.name,
						createdAt: publishedAt,
					},
				}),
			);
		}
	}

	for (const row of settingRows) {
		const draft = row.draftValue;
		if (draft === null || draft === row.value) {
			// Staged back to the live value: nothing to publish, just unstage.
			operations.push(
				db.storefrontSetting.update({
					where: { key: row.key },
					data: { draftValue: null },
				}),
			);
			continue;
		}

		settings += 1;
		operations.push(
			draft === ""
				? // A staged blank is a revert to the shipped default, so
					// the row itself goes.
					db.storefrontSetting.delete({ where: { key: row.key } })
				: db.storefrontSetting.update({
						where: { key: row.key },
						data: {
							value: draft,
							draftValue: null,
							updatedBy: user.name,
						},
					}),
		);
	}

	if (operations.length > 0) {
		await db.$transaction(operations);
	}

	return { sections, settings };
}

export interface LandingPublishInfo {
	userName: string | null;
	publishedAt: Date;
	/** Sections changed by that publish — they share one timestamp. */
	sections: number;
}

/**
 * The most recent publish, read back from the revision table. Revisions carry
 * their batch's timestamp, so the rows sharing the newest one are the last
 * publish.
 */
export async function getLatestLandingPublish(): Promise<LandingPublishInfo | null> {
	const latest = await db.landingSectionRevision.findFirst({
		orderBy: { createdAt: "desc" },
	});

	if (!latest) {
		return null;
	}

	const batch = await db.landingSectionRevision.count({
		where: { createdAt: latest.createdAt },
	});

	return {
		userName: latest.userName,
		publishedAt: latest.createdAt,
		sections: batch,
	};
}
