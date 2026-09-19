export const SUPPORT_EMAIL = "support@geostoresgh.com";
export const PHONE_NUMBER = "+233 20 913 3372";

/**
 * Every customer-facing route now lives in this app, so these are all local
 * paths. The account area and admin stay in the SaaS app, which is the only
 * place `NEXT_PUBLIC_SAAS_URL` is still needed.
 */
const accountUrl = process.env.NEXT_PUBLIC_SAAS_URL
	? String(process.env.NEXT_PUBLIC_SAAS_URL).replace(/\/$/, "")
	: "";

export const links = {
	home: "/",
	shop: "/shop",
	cart: "/cart",
	checkout: "/checkout",
	contact: "/contact",
	about: "/#about",
	category: (slug: string) => `/categories/${slug}`,
	collection: (slug: string) => `/shop?collection=${slug}`,
	product: (slug: string) => `/products/${slug}`,
	searchFor: (query: string) => `/shop?q=${encodeURIComponent(query)}`,
	account: accountUrl ? `${accountUrl}/dashboard` : "/contact",
	orders: accountUrl ? `${accountUrl}/orders` : "/contact",
	addresses: accountUrl ? `${accountUrl}/settings/addresses` : "/contact",
} as const;

/** Kept as a named export so storefront code reads the same as before. */
export const storeLinks = links;

export const PAYMENT_METHODS = [
	"MTN MoMo",
	"Telecel Cash",
	"Visa",
	"Mastercard",
	"Cash on delivery",
] as const;
