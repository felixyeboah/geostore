import "server-only";

import { logger } from "@repo/logs";
import { cache } from "react";

/**
 * Flushes a cached storefront path from the back office.
 *
 * The storefront is a separate Next application, so `revalidatePath` here
 * cannot touch its caches. This posts to its own revalidate endpoint instead.
 *
 * Wrapped in React `cache` so it is deduplicated per request: a bulk status
 * change loops over twenty-five products and would otherwise send the same
 * flush twenty-five times.
 */
const notify = cache(async (path: string): Promise<void> => {
	const storefrontUrl = process.env.NEXT_PUBLIC_MARKETING_URL?.replace(
		/\/$/,
		"",
	);
	const secret = process.env.STOREFRONT_REVALIDATE_SECRET;

	// Not configured is not an error: the storefront's own revalidate window
	// still expires on its own, this only makes it immediate.
	if (!storefrontUrl || !secret) {
		return;
	}

	try {
		const response = await fetch(`${storefrontUrl}/api/revalidate`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${secret}`,
			},
			body: JSON.stringify({ paths: [path] }),
			cache: "no-store",
			// The admin is waiting on this. A storefront that is slow or down
			// must not hold up a save that has already succeeded.
			signal: AbortSignal.timeout(3000),
		});

		if (!response.ok) {
			logger.warn(
				`Storefront revalidation of ${path} returned ${response.status}.`,
			);
		}
	} catch (error) {
		// Never fail a completed write because a cache could not be flushed.
		logger.warn(`Storefront revalidation of ${path} failed:`, error);
	}
});

/**
 * The shop mega menu's data.
 *
 * It is the one storefront route with a cache long enough to be noticed: it
 * reads the whole catalogue, so it is cached rather than queried per visitor.
 * Everything else on the storefront is dynamic and needs no flushing.
 */
export async function revalidateStorefrontMenu(): Promise<void> {
	await notify("/api/nav-menu");
}
