import { DEFAULT_DELIVERY_RULE, type DeliveryRule } from "./delivery";

/**
 * The store-wide numbers an admin can change without a developer.
 *
 * These were constants in source, which meant the delivery fee — real money,
 * charged to real customers — could only move by editing a file and shipping a
 * build. They live here as a contract rather than in the database layer so the
 * browser, the server and the query layer all read the same definition.
 *
 * Only genuinely store-wide operating numbers belong here. Words on the
 * storefront are landing copy and chrome; who can sign in is the user list.
 */

export interface StoreSettings {
	/** Flat delivery charge applied below the free-delivery threshold. */
	deliveryFeeInPesewas: number;
	/** Subtotal at or above which delivery costs nothing. */
	freeDeliveryOverInPesewas: number;
	/** How long a paid order may sit unshipped before the back office flags it. */
	dispatchWindowHours: number;
	/**
	 * Whether checkout offers online payment. Off means the shop is taking
	 * orders over WhatsApp and collecting payment on delivery instead.
	 */
	onlinePaymentsEnabled: boolean;
	/**
	 * The WhatsApp line checkout orders point at. Blank falls back to the
	 * storefront's WhatsApp chrome value, so the shop only keeps two numbers
	 * when the checkout line genuinely differs from the public one.
	 */
	checkoutWhatsappNumber: string;
}

export type StoreSettingKey = keyof StoreSettings;

export const DEFAULT_DISPATCH_WINDOW_HOURS = 48;

export const STORE_SETTINGS_DEFAULTS: StoreSettings = {
	deliveryFeeInPesewas: DEFAULT_DELIVERY_RULE.feeInPesewas,
	freeDeliveryOverInPesewas: DEFAULT_DELIVERY_RULE.freeOverInPesewas,
	dispatchWindowHours: DEFAULT_DISPATCH_WINDOW_HOURS,
	onlinePaymentsEnabled: true,
	checkoutWhatsappNumber: "",
};

/**
 * Storage keys. They are namespaced because these rows share a table with the
 * storefront chrome overrides, which is keyed by bare names.
 */
export const STORE_SETTING_KEYS: Record<StoreSettingKey, string> = {
	deliveryFeeInPesewas: "store.deliveryFeeInPesewas",
	freeDeliveryOverInPesewas: "store.freeDeliveryOverInPesewas",
	dispatchWindowHours: "store.dispatchWindowHours",
	onlinePaymentsEnabled: "store.onlinePaymentsEnabled",
	checkoutWhatsappNumber: "store.checkoutWhatsappNumber",
};

export const STORE_SETTING_STORAGE_KEYS: string[] =
	Object.values(STORE_SETTING_KEYS);

/** The settings that are numbers — the ones STORE_SETTING_FIELDS can hold. */
export type NumericStoreSettingKey = {
	[K in StoreSettingKey]: StoreSettings[K] extends number ? K : never;
}[StoreSettingKey];

export interface StoreSettingField {
	key: NumericStoreSettingKey;
	label: string;
	help: string;
	/**
	 * How the number is typed. Money is entered in cedis and stored in
	 * pesewas — the conversion happens on the server, so a browser that gets
	 * it wrong cannot change what is charged.
	 */
	unit: "cedis" | "hours";
	/** Bounds in the stored unit. */
	min: number;
	max: number;
}

export const STORE_SETTING_FIELDS: StoreSettingField[] = [
	{
		key: "deliveryFeeInPesewas",
		label: "Delivery fee",
		help: "Charged on every order below the free-delivery threshold.",
		unit: "cedis",
		min: 0,
		// GH₵1,000. High enough never to be reached in practice, low enough
		// that a slipped decimal point is caught rather than charged.
		max: 100_000,
	},
	{
		key: "freeDeliveryOverInPesewas",
		label: "Free delivery over",
		help: "Orders at or above this subtotal ship free. Set it to 0 to make delivery free on everything.",
		unit: "cedis",
		min: 0,
		max: 10_000_000,
	},
	{
		key: "dispatchWindowHours",
		label: "Dispatch window",
		help: "A paid order still unshipped after this long is flagged on the overview and in the order book.",
		unit: "hours",
		min: 1,
		// Two weeks. Past this the flag has stopped meaning anything.
		max: 336,
	},
];

/**
 * Settings as they stand: a stored override where one exists, the shipped
 * default everywhere else. A row that cannot be read as a whole number in
 * range is ignored rather than trusted, so bad data degrades to the default
 * instead of charging someone a nonsense amount.
 */
export function resolveStoreSettings(
	overrides: Record<string, string>,
): StoreSettings {
	const resolved = { ...STORE_SETTINGS_DEFAULTS };

	for (const field of STORE_SETTING_FIELDS) {
		const raw = overrides[STORE_SETTING_KEYS[field.key]];
		if (raw === undefined) {
			continue;
		}

		const value = Number(raw);
		if (
			Number.isInteger(value) &&
			value >= field.min &&
			value <= field.max
		) {
			resolved[field.key] = value;
		}
	}

	// The toggle is stored as the string "false"; anything else — including a
	// missing row — is the shipped behaviour, which is payments on.
	if (overrides[STORE_SETTING_KEYS.onlinePaymentsEnabled] === "false") {
		resolved.onlinePaymentsEnabled = false;
	}

	const whatsapp =
		overrides[STORE_SETTING_KEYS.checkoutWhatsappNumber]?.trim();
	if (whatsapp) {
		resolved.checkoutWhatsappNumber = whatsapp;
	}

	return resolved;
}

export function deliveryRuleFromSettings(
	settings: StoreSettings,
): DeliveryRule {
	return {
		feeInPesewas: settings.deliveryFeeInPesewas,
		freeOverInPesewas: settings.freeDeliveryOverInPesewas,
	};
}

export interface StoreSettingIssue {
	key: StoreSettingKey;
	message: string;
}

/** Cedis as typed — "35", "35.5", "1,200.00" — to whole pesewas. */
export function parseCedis(input: string): number | null {
	const cleaned = input.replace(/[\s,₵]/g, "").replace(/^GH/i, "");
	if (cleaned === "" || !/^\d+(\.\d{1,2})?$/.test(cleaned)) {
		return null;
	}

	// Via a string rather than `* 100`, because 35.35 * 100 is 3534.9999…
	const [cedis, pesewas = ""] = cleaned.split(".");
	return Number(cedis) * 100 + Number(pesewas.padEnd(2, "0"));
}

export function formatCedisInput(pesewas: number): string {
	return (pesewas / 100).toFixed(2);
}

/**
 * Turns a submitted form into settings, in the stored unit.
 *
 * Every field is validated here rather than in the browser: these numbers
 * decide what a customer is charged, so the only arithmetic that counts is
 * the server's. Anything unparseable or out of range is reported and left
 * unchanged.
 */
export function sanitiseStoreSettings(raw: Record<string, string>): {
	values: Partial<StoreSettings>;
	issues: StoreSettingIssue[];
} {
	const values: Partial<StoreSettings> = {};
	const issues: StoreSettingIssue[] = [];

	for (const field of STORE_SETTING_FIELDS) {
		const input = raw[field.key];
		if (input === undefined) {
			continue;
		}

		const trimmed = input.trim();
		if (trimmed === "") {
			issues.push({ key: field.key, message: "This cannot be blank." });
			continue;
		}

		const value =
			field.unit === "cedis"
				? parseCedis(trimmed)
				: /^\d+$/.test(trimmed)
					? Number(trimmed)
					: null;

		if (value === null) {
			issues.push({
				key: field.key,
				message:
					field.unit === "cedis"
						? "Enter an amount, like 35 or 35.50."
						: "Enter a whole number of hours.",
			});
			continue;
		}

		if (value < field.min || value > field.max) {
			issues.push({
				key: field.key,
				message:
					field.unit === "cedis"
						? `Keep it between GH₵${formatCedisInput(field.min)} and GH₵${formatCedisInput(field.max)}.`
						: `Keep it between ${field.min} and ${field.max} hours.`,
			});
			continue;
		}

		values[field.key] = value;
	}

	// The checkout toggle is not a number, so it does not ride the field loop
	// above. Anything that is not plainly "true" or "false" is reported rather
	// than guessed at — this switch decides whether money can be taken online.
	const paymentsInput = raw.onlinePaymentsEnabled;
	if (paymentsInput !== undefined) {
		if (paymentsInput === "true" || paymentsInput === "false") {
			values.onlinePaymentsEnabled = paymentsInput === "true";
		} else {
			issues.push({
				key: "onlinePaymentsEnabled",
				message: "Choose whether online payment is on or off.",
			});
		}
	}

	const whatsappInput = raw.checkoutWhatsappNumber;
	if (whatsappInput !== undefined) {
		const number = whatsappInput.trim();
		// Blank is meaningful: it clears the override and the storefront's own
		// WhatsApp number takes over at checkout.
		if (number === "") {
			values.checkoutWhatsappNumber = "";
		} else if (number.length > 32) {
			issues.push({
				key: "checkoutWhatsappNumber",
				message: "Keep it under 32 characters.",
			});
		} else if (!/^[+0-9][0-9 ()-]{4,}$/.test(number)) {
			issues.push({
				key: "checkoutWhatsappNumber",
				message:
					"That does not look like a phone number. Include the country code.",
			});
		} else {
			values.checkoutWhatsappNumber = number;
		}
	}

	return { values, issues };
}
