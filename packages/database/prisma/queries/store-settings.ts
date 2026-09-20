import {
	type DeliveryRule,
	deliveryRuleFromSettings,
	resolveStoreSettings,
	STORE_SETTING_KEYS,
	STORE_SETTING_STORAGE_KEYS,
	STORE_SETTINGS_DEFAULTS,
	type StoreSettings,
} from "@repo/utils";
import { db } from "../client";

/**
 * The store-wide operating numbers: delivery pricing and the dispatch window.
 *
 * These share the `storefront_setting` table with the chrome overrides, under
 * a `store.` key prefix, because both are the same shape — a key, a string and
 * a shipped default behind it. They deliberately do *not* use that table's
 * draft column: chrome is copy and rides the storefront's publish flow, but
 * the delivery fee is what a customer is charged at checkout, and it takes
 * effect the moment it is saved rather than waiting on someone to publish a
 * batch of unrelated wording. Leaving `draftValue` null also keeps these rows
 * out of the landing publish and discard passes, which only touch staged ones.
 *
 * Read the settings; never read the raw rows. A value that has gone bad falls
 * back to the shipped default in `resolveStoreSettings` rather than reaching
 * an order total.
 */

export async function getStoreSettings(): Promise<StoreSettings> {
	const rows = await db.storefrontSetting.findMany({
		where: { key: { in: STORE_SETTING_STORAGE_KEYS }, value: { not: "" } },
	});

	return resolveStoreSettings(
		Object.fromEntries(rows.map((row) => [row.key, row.value])),
	);
}

/**
 * The delivery rule for pricing an order. A database failure falls back to the
 * shipped rule: a shop that cannot read its settings should still be able to
 * take an order at the price it was built with, rather than 500 at checkout.
 */
export async function getDeliveryRule(): Promise<DeliveryRule> {
	try {
		return deliveryRuleFromSettings(await getStoreSettings());
	} catch (error) {
		console.error(
			"[store-settings] falling back to the shipped rule",
			error,
		);
		return deliveryRuleFromSettings(STORE_SETTINGS_DEFAULTS);
	}
}

/**
 * Saves settings, immediately. A value equal to the shipped default drops its
 * row, so "back to how it came" leaves nothing behind to go stale if the
 * default ever moves.
 */
export async function setStoreSettings(
	values: Partial<StoreSettings>,
	updatedBy: string,
) {
	const entries = Object.entries(values) as [keyof StoreSettings, number][];
	if (entries.length === 0) {
		return;
	}

	await db.$transaction(
		entries.map(([key, value]) => {
			const storageKey = STORE_SETTING_KEYS[key];

			if (value === STORE_SETTINGS_DEFAULTS[key]) {
				return db.storefrontSetting.deleteMany({
					where: { key: storageKey },
				});
			}

			const stored = String(value);
			return db.storefrontSetting.upsert({
				where: { key: storageKey },
				create: { key: storageKey, value: stored, updatedBy },
				update: { value: stored, updatedBy },
			});
		}),
	);
}

/** Who last changed each setting, for the "last edited" line on the screen. */
export async function getStoreSettingsAuthors(): Promise<
	{ key: string; updatedBy: string | null; updatedAt: Date }[]
> {
	return db.storefrontSetting.findMany({
		where: { key: { in: STORE_SETTING_STORAGE_KEYS }, value: { not: "" } },
		select: { key: true, updatedBy: true, updatedAt: true },
	});
}
