import { getStoreSettings } from "@repo/database";
import {
	type DeliveryRule,
	deliveryRuleFromSettings,
	STORE_SETTINGS_DEFAULTS,
} from "@repo/utils";
import { cache } from "react";

/**
 * The delivery rule this render should quote.
 *
 * Cached per request, like the chrome, so the layout and a page can both ask
 * without a second query. A failure falls back to the shipped rule: the bag
 * then quotes what the shop was built to charge, which the server will also
 * charge if it recovers by checkout — and a database wobble should not be
 * able to take the storefront down.
 *
 * This is only ever a quote. Order creation re-reads the rule server-side, so
 * nothing here decides what a customer actually pays.
 */
export const getStorefrontDeliveryRule = cache(
	async (): Promise<DeliveryRule> => {
		try {
			return deliveryRuleFromSettings(await getStoreSettings());
		} catch (error) {
			console.error(
				"[store-settings] falling back to the shipped delivery rule",
				error,
			);
			return deliveryRuleFromSettings(STORE_SETTINGS_DEFAULTS);
		}
	},
);
