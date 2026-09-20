import { verifyWebhookSignature } from "@reevit/node";

export type StorePaymentMethod =
	| "MOCK"
	| "ONLINE"
	| "CARD"
	| "MOBILE_MONEY"
	| "CASH_ON_DELIVERY"
	| "WHATSAPP";

export type StorePaymentProvider = "reevit" | "mock";

/**
 * Deliberately refuses to guess.
 *
 * The mock provider marks an order PAID and emails a confirmation without
 * taking any money (see `createMockStoreOrder`). The previous implementation
 * fell back to it whenever `REEVIT_API_KEY` was empty, which meant one
 * mistyped secret name on a deploy silently turned the storefront into a
 * giveaway. A payment provider is not something to infer.
 *
 * `ALLOW_MOCK_PAYMENTS` exists because the Playwright suite builds and runs the
 * app with `NODE_ENV=production`; it is the only way to reach the mock branch
 * in a production build, and it is named so that nobody sets it by accident.
 */
export function getStorePaymentProvider(): StorePaymentProvider {
	const configured = process.env.STORE_PAYMENT_PROVIDER;

	if (configured === "reevit") {
		return "reevit";
	}

	if (
		process.env.NODE_ENV === "production" &&
		process.env.ALLOW_MOCK_PAYMENTS !== "true"
	) {
		throw new Error(
			configured === "mock"
				? 'STORE_PAYMENT_PROVIDER="mock" marks orders paid without charging and is refused in production. Set it to "reevit", or set ALLOW_MOCK_PAYMENTS=true if this really is a test build.'
				: `STORE_PAYMENT_PROVIDER must be "reevit" in production (received ${
						configured === undefined
							? "no value"
							: `"${configured}"`
					}). Refusing to infer a payment provider.`,
		);
	}

	return "mock";
}

/** True when the mock provider would hand out stock without taking money. */
export function isMockPaymentProvider(): boolean {
	return getStorePaymentProvider() === "mock";
}

/**
 * The channel to pin on the payment intent, or `null` to let the provider
 * offer all of them. "ONLINE" is the normal path now: the shopper picks mobile
 * money or card on Reevit's own page. CARD and MOBILE_MONEY remain for orders
 * placed before that choice moved, and for anywhere a channel is forced.
 */
export function mapStorePaymentMethod(
	method: StorePaymentMethod,
): "mobile_money" | "card" | null {
	if (method === "MOBILE_MONEY") {
		return "mobile_money";
	}
	if (method === "CARD") {
		return "card";
	}
	return null;
}

/** True when the order is settled online rather than in cash on the doorstep. */
export function isOnlinePaymentMethod(method: StorePaymentMethod): boolean {
	return method !== "CASH_ON_DELIVERY" && method !== "WHATSAPP";
}

export function verifyReevitSignature(
	rawBody: string,
	signatureHeader: string,
	secret: string,
): boolean {
	return verifyWebhookSignature(rawBody, signatureHeader, secret);
}
