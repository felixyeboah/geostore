import "server-only";

import { createOrderAccessToken, verifyOrderAccessToken } from "./order-token";

/**
 * Guest checkout has no session, so order confirmation pages cannot rely on
 * ownership alone. Instead of treating the order number as a bearer token (it is
 * emailed, quoted in support threads, and sits in browser history), we issue a
 * short HMAC bound to the order id and require it on every unauthenticated read.
 *
 * The signing itself lives in `./order-token`, which has no `server-only`
 * guard and is unit tested.
 */
export { createOrderAccessToken, verifyOrderAccessToken };

interface OrderAccessInput {
	orderId: string;
	orderUserId: string | null;
	sessionUserId?: string;
	sessionUserRole?: string | null;
	token?: string;
}

export function canReadStoreOrder({
	orderId,
	orderUserId,
	sessionUserId,
	sessionUserRole,
	token,
}: OrderAccessInput): boolean {
	if (sessionUserRole === "admin") {
		return true;
	}

	if (orderUserId && sessionUserId && orderUserId === sessionUserId) {
		return true;
	}

	return verifyOrderAccessToken(orderId, token);
}
