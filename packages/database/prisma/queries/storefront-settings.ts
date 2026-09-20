import { db } from "../client";

/**
 * Editable storefront chrome, as a key/value map.
 *
 * `value` is the published override — a row only exists where an editor set
 * one, and an absent key falls back to the copy the storefront ships with.
 * `draftValue` is the staged edit: `null` means nothing staged, `""` stages a
 * revert to the shipped default. A row whose only job is to carry a draft —
 * no published override yet — keeps `value` at `""`.
 */
export async function getStorefrontSettings(): Promise<Record<string, string>> {
	const rows = await db.storefrontSetting.findMany({
		where: { value: { not: "" } },
	});

	return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

/**
 * Chrome as it will look once the current draft publishes: staged value where
 * one is staged, published where not.
 */
export async function getStorefrontDraftSettings(): Promise<
	Record<string, string>
> {
	const rows = await db.storefrontSetting.findMany();

	return Object.fromEntries(
		rows.flatMap((row) => {
			const resolved = row.draftValue ?? row.value;
			return resolved === "" ? [] : [[row.key, resolved]];
		}),
	);
}

/**
 * Stages chrome values. `""` stages a revert to the shipped default, `null`
 * unstages the key entirely. Staging the value that is already published is a
 * no-op, so a field typed back to its current text leaves no draft behind.
 */
export async function stageStorefrontSettings(
	values: Record<string, string | null>,
) {
	const keys = Object.keys(values);
	if (keys.length === 0) {
		return;
	}

	const existing = await db.storefrontSetting.findMany({
		where: { key: { in: keys } },
	});
	const byKey = new Map(existing.map((row) => [row.key, row]));

	for (const [key, staged] of Object.entries(values)) {
		const row = byKey.get(key);
		// Staging the published value is the same as unstaging.
		const draftValue =
			staged !== null && staged !== (row?.value ?? "") ? staged : null;

		if (row) {
			await db.storefrontSetting.update({
				where: { key },
				data: { draftValue },
			});
		} else if (draftValue !== null) {
			await db.storefrontSetting.create({
				// `""` marks a row that exists only to carry the draft.
				data: { key, value: "", draftValue },
			});
		}
	}
}
