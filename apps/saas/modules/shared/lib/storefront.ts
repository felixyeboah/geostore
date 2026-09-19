import { config } from "@config";

/**
 * The customer-facing storefront lives in the marketing app now, so anything
 * in the account or admin area that sends a shopper "back to the store" has to
 * cross apps. Falls back to this app's root when the URL is not configured.
 */
const storefrontUrl = config.marketingUrl
	? String(config.marketingUrl).replace(/\/$/, "")
	: "";

export const storefront = {
	home: storefrontUrl || "/",
	shop: storefrontUrl ? `${storefrontUrl}/shop` : "/",
	cart: storefrontUrl ? `${storefrontUrl}/cart` : "/",
	search: (query: string) =>
		storefrontUrl
			? `${storefrontUrl}/shop?q=${encodeURIComponent(query)}`
			: "/",
} as const;
