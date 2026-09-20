/**
 * Editable storefront chrome: the strip above the menu, the shop's phone
 * number and the footer's sign-off lines.
 *
 * Same contract as the landing sections — the shipped strings are the
 * defaults, and a saved row is only ever an override. Clearing a field puts
 * the shipped words back, so the storefront can never end up with an empty
 * strip or a footer that stops mid-sentence.
 */

export type StorefrontChromeKey =
	| "utilityStrip"
	| "phone"
	| "whatsapp"
	| "footerTagline1"
	| "footerTagline2"
	| "footerMeta"
	| "footerTagline"
	| "footerPayments";

export interface StorefrontChromeField {
	key: StorefrontChromeKey;
	label: string;
	help?: string;
	maxLength: number;
}

/** What the storefront ships with — also the fallback for every key. */
export const STOREFRONT_CHROME_DEFAULTS: Record<StorefrontChromeKey, string> = {
	utilityStrip:
		"Delivery across Ghana · Mobile money, card or cash on delivery",
	phone: "+233 20 913 3372",
	whatsapp: "+233 20 913 3372",
	footerTagline1: "Phones, computers, gaming,",
	footerTagline2: "appliances and accessories.",
	footerMeta: "Electronics & more · Ghana",
	footerTagline: "Ask us for a price on anything in the store.",
	footerPayments: "Pay with mobile money, card or cash on delivery.",
};

export const STOREFRONT_CHROME_FIELDS: StorefrontChromeField[] = [
	{
		key: "utilityStrip",
		label: "Announcement strip",
		help: "The thin bar above the menu, only on wide screens.",
		maxLength: 140,
	},
	{
		key: "phone",
		label: "Phone number",
		help: "Shown in the strip and used for its call link.",
		maxLength: 32,
	},
	{
		key: "whatsapp",
		label: "WhatsApp number",
		help: "Where “Tell us what you need” and every “Contact for price” opens a chat. Include the country code.",
		maxLength: 32,
	},
	{
		key: "footerTagline1",
		label: "Footer tagline, first line",
		maxLength: 80,
	},
	{
		key: "footerTagline2",
		label: "Footer tagline, second line",
		maxLength: 80,
	},
	{
		key: "footerMeta",
		label: "Footer meta line",
		help: "The small print under the tagline.",
		maxLength: 80,
	},
	{
		key: "footerTagline",
		label: "Footer sign-off",
		help: "The italic line at the foot of the page.",
		maxLength: 120,
	},
	{
		key: "footerPayments",
		label: "Payments line",
		help: "Named beside the payment marks at the very bottom.",
		maxLength: 120,
	},
];

export const STOREFRONT_CHROME_KEYS: ReadonlySet<string> = new Set(
	STOREFRONT_CHROME_FIELDS.map((field) => field.key),
);

export type StorefrontChrome = Record<StorefrontChromeKey, string>;

/**
 * Overrides over the shipped strings. A key with no row — or an empty one —
 * resolves to its default, which is what keeps a cleared field safe.
 */
export function resolveStorefrontChrome(
	overrides: Record<string, string>,
): StorefrontChrome {
	return Object.fromEntries(
		Object.entries(STOREFRONT_CHROME_DEFAULTS).map(([key, fallback]) => [
			key,
			overrides[key]?.trim() ? overrides[key].trim() : fallback,
		]),
	) as StorefrontChrome;
}

export interface StorefrontChromeIssue {
	key: StorefrontChromeKey;
	message: string;
}

/**
 * Cleans and validates a chrome form submission. Unknown keys are dropped,
 * blanks stay out of the map, and anything over its field's limit is reported
 * rather than stored.
 */
export function sanitizeStorefrontChrome(values: Record<string, string>): {
	overrides: Record<string, string>;
	issues: StorefrontChromeIssue[];
} {
	const fields = new Map(
		STOREFRONT_CHROME_FIELDS.map((field) => [field.key, field]),
	);
	const overrides: Record<string, string> = {};
	const issues: StorefrontChromeIssue[] = [];

	for (const [key, raw] of Object.entries(values)) {
		const field = fields.get(key as StorefrontChromeKey);
		if (!field) {
			continue;
		}

		const value = raw.trim();
		if (value.length === 0) {
			continue;
		}

		if (value.length > field.maxLength) {
			issues.push({
				key: field.key,
				message: `Keep it under ${field.maxLength} characters.`,
			});
			continue;
		}

		if (
			(field.key === "phone" || field.key === "whatsapp") &&
			!/^[+0-9][0-9 ()-]{4,}$/.test(value)
		) {
			issues.push({
				key: field.key,
				message: "That does not look like a phone number.",
			});
			continue;
		}

		overrides[field.key] = value;
	}

	return { overrides, issues };
}

/**
 * A wa.me link for the shop's WhatsApp number.
 *
 * wa.me wants digits only — no `+`, spaces or brackets — and silently fails on
 * anything else, so the number is stripped here rather than trusted as typed.
 * A number with no digits left returns null, and callers fall back to the
 * contact page instead of rendering a link that goes nowhere.
 */
export function whatsAppLink(number: string, message?: string): string | null {
	const digits = number.replace(/\D/g, "");
	if (digits.length < 8) {
		return null;
	}

	const query = message ? `?text=${encodeURIComponent(message)}` : "";
	return `https://wa.me/${digits}${query}`;
}
