import { getStoreSettings } from "@repo/database";
import {
	type DeliveryRule,
	deliveryRuleFromSettings,
	STORE_SETTINGS_DEFAULTS,
} from "@repo/utils";
import { cache } from "react";
import { getStorefrontChrome } from "./storefront-chrome";

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

export interface StorefrontCheckout {
	/** Whether the checkout offers pay-online. Off means WhatsApp ordering. */
	onlinePaymentsEnabled: boolean;
	/**
	 * The WhatsApp line checkout points at: the checkout override where one is
	 * set, the storefront's public WhatsApp number otherwise. Never blank in
	 * practice — chrome resolves to a shipped default — but a number that
	 * cannot be dialled is handled by `whatsAppLink`, not here.
	 */
	whatsappNumber: string;
}

/**
 * How checkout behaves for this render: online payment on or off, and which
 * WhatsApp line orders route to when it is off.
 *
 * Same fallback contract as the delivery rule — a database wobble leaves the
 * shop on its shipped behaviour (payments on, public WhatsApp number) rather
 * than breaking checkout.
 */
export const getStorefrontCheckout = cache(
	async (): Promise<StorefrontCheckout> => {
		try {
			const settings = await getStoreSettings();
			const chrome = await getStorefrontChrome();
			return {
				onlinePaymentsEnabled: settings.onlinePaymentsEnabled,
				whatsappNumber:
					settings.checkoutWhatsappNumber || chrome.whatsapp,
			};
		} catch (error) {
			console.error(
				"[store-settings] falling back to shipped checkout behaviour",
				error,
			);
			const chrome = await getStorefrontChrome();
			return {
				onlinePaymentsEnabled:
					STORE_SETTINGS_DEFAULTS.onlinePaymentsEnabled,
				whatsappNumber: chrome.whatsapp,
			};
		}
	},
);
