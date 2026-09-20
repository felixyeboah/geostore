import "server-only";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * The storefront reads the session so checkout can prefill a signed-in
 * shopper's details and so order pages can authorise access. Guests are
 * supported everywhere, so callers must treat `null` as normal.
 */
export const getSession = cache(async () => {
	return await auth.api.getSession({
		headers: await headers(),
		query: {
			disableCookieCache: true,
		},
	});
});
