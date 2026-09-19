import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minting and checking of guest order-access tokens.
 *
 * Deliberately separate from `order-access.ts`, which carries the `server-only`
 * guard. Nothing here touches a request, a session or the database — it is pure
 * HMAC over a string — and keeping it free of that import is what lets the
 * rollover behaviour below be covered by a plain unit test.
 *
 * Tokens are signed with `ORDER_TOKEN_SECRET`, not the session secret. Reusing
 * `BETTER_AUTH_SECRET` meant one key with two unrelated jobs: rotating it to
 * invalidate sessions would also break every order link already sitting in a
 * customer's inbox, so in practice it never got rotated. Separate keys let
 * either one turn over on its own schedule.
 *
 * Rotation is why verification accepts a set of secrets while signing only ever
 * uses the first. Order links are long-lived and cannot be recalled, so a new
 * key has to coexist with the old one:
 *
 *   1. `ORDER_TOKEN_SECRET_PREVIOUS` = the current `ORDER_TOKEN_SECRET`
 *   2. `ORDER_TOKEN_SECRET` = the new value; deploy
 *   3. once the old links have aged out, drop `ORDER_TOKEN_SECRET_PREVIOUS`
 *
 * `BETTER_AUTH_SECRET` stays in the accepted set so that tokens minted before
 * this split keep resolving. Set `ORDER_TOKEN_ACCEPT_LEGACY="false"` to close
 * that door once those links no longer matter.
 */
export function getOrderTokenSecrets(): {
	signing: string;
	accepted: string[];
} {
	const primary =
		process.env.ORDER_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET;

	if (!primary) {
		throw new Error(
			"ORDER_TOKEN_SECRET is required to sign order access tokens.",
		);
	}

	const accepted = [primary];

	const previous = process.env.ORDER_TOKEN_SECRET_PREVIOUS;
	if (previous) {
		accepted.push(previous);
	}

	const legacy = process.env.BETTER_AUTH_SECRET;
	if (legacy && process.env.ORDER_TOKEN_ACCEPT_LEGACY !== "false") {
		accepted.push(legacy);
	}

	return { signing: primary, accepted: [...new Set(accepted)] };
}

function sign(secret: string, orderId: string): string {
	return createHmac("sha256", secret)
		.update(`store-order:${orderId}`)
		.digest("base64url");
}

export function createOrderAccessToken(orderId: string): string {
	return sign(getOrderTokenSecrets().signing, orderId);
}

export function verifyOrderAccessToken(
	orderId: string,
	token: string | undefined,
): boolean {
	if (!token) {
		return false;
	}

	const provided = Buffer.from(token);

	// Compares against every accepted secret without an early exit, so the
	// response time does not reveal which key in the rollover set matched.
	let valid = false;

	for (const secret of getOrderTokenSecrets().accepted) {
		const expected = Buffer.from(sign(secret, orderId));

		if (expected.length !== provided.length) {
			continue;
		}

		if (timingSafeEqual(expected, provided)) {
			valid = true;
		}
	}

	return valid;
}
