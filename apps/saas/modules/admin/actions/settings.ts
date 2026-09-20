"use server";

import type { AdminActionResult } from "@admin/actions/commerce";
import { getSession } from "@auth/lib/server";
import { getStoreSettings, setStoreSettings } from "@repo/database";
import { logger } from "@repo/logs";
import {
	STORE_SETTING_FIELDS,
	type StoreSettingIssue,
	type StoreSettings,
	sanitiseStoreSettings,
} from "@repo/utils";
import { revalidatePath } from "next/cache";

export interface StoreSettingsActionResult extends AdminActionResult {
	/** Per-field problems, so the form can point at the one that is wrong. */
	issues?: StoreSettingIssue[];
	/** What is stored now, so the form can re-baseline against the server. */
	settings?: StoreSettings;
}

/**
 * Saves the store-wide numbers.
 *
 * The submitted strings are parsed and range-checked here rather than in the
 * browser: the delivery fee decides what a customer is charged, so the only
 * arithmetic that counts is the server's. A field that fails is reported and
 * left alone — the rest still save, because a typo in the dispatch window is
 * no reason to reject a corrected delivery fee.
 *
 * Nothing is revalidated on the storefront: the root layout reads the rule on
 * every render and is already dynamic, so the next page load has the new
 * numbers.
 */
export async function saveStoreSettingsAction(
	raw: Record<string, string>,
): Promise<StoreSettingsActionResult> {
	const session = await getSession();

	if (!session || session.user.role !== "admin") {
		return {
			success: false,
			message: "You do not have permission to change these settings.",
		};
	}

	const { values, issues } = sanitiseStoreSettings(raw);

	if (issues.length > 0) {
		const field = STORE_SETTING_FIELDS.find(
			(candidate) => candidate.key === issues[0].key,
		);

		return {
			success: false,
			message: field
				? `${field.label}: ${issues[0].message}`
				: issues[0].message,
			issues,
		};
	}

	if (Object.keys(values).length === 0) {
		return { success: true, message: "Nothing to change." };
	}

	let settings: StoreSettings;
	try {
		await setStoreSettings(values, session.user.name);
		// Read back rather than echo the input: what the form shows next
		// should be what the shop will actually charge.
		settings = await getStoreSettings();
	} catch (error) {
		logger.error(error);
		return {
			success: false,
			message: "Those settings could not be saved. Try again.",
		};
	}

	// The back office reads them too — the overview's late count and the
	// order book's dispatch flag both come from the window.
	revalidatePath("/admin", "layout");

	return { success: true, message: "Settings saved", settings };
}
