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
	/** False when NEXT_PUBLIC_MARKETING_URL is unset, so callers can hide links that would go nowhere. */
	isConfigured: Boolean(storefrontUrl),
	home: storefrontUrl || "/",
	shop: storefrontUrl ? `${storefrontUrl}/shop` : "/",
	cart: storefrontUrl ? `${storefrontUrl}/cart` : "/",
	product: (slug: string) =>
		storefrontUrl
			? `${storefrontUrl}/products/${encodeURIComponent(slug)}`
			: "/",
	search: (query: string) =>
		storefrontUrl
			? `${storefrontUrl}/shop?q=${encodeURIComponent(query)}`
			: "/",
} as const;
