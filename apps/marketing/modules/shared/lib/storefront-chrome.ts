import { resolveStorefrontChrome, type StorefrontChrome } from "@repo/commerce";
import {
	getStorefrontDraftSettings,
	getStorefrontSettings,
} from "@repo/database";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * Whether this render is the back office's draft preview — the admin iframe
 * loads `/?preview=draft`, which the proxy turns into a request header after
 * checking its key.
 */
export const isDraftPreview = cache(async (): Promise<boolean> => {
	const headerList = await headers();
	return headerList.get("x-storefront-preview") === "draft";
});

/**
 * The chrome strings for this render: staged values under the draft preview,
 * published ones otherwise, shipped defaults wherever neither exists.
 *
 * Cached per request — the layout and a page can both ask without paying a
 * second query. A database failure returns the defaults: chrome is decoration
 * around the shop window, never a reason to take it down.
 */
export const getStorefrontChrome = cache(
	async (): Promise<StorefrontChrome> => {
		try {
			const overrides = (await isDraftPreview())
				? await getStorefrontDraftSettings()
				: await getStorefrontSettings();

			return resolveStorefrontChrome(overrides);
		} catch (error) {
			console.error(
				"[storefront-chrome] falling back to shipped copy",
				error,
			);
			return resolveStorefrontChrome({});
		}
	},
);
