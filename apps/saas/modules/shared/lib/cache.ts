"use server";

import { getSession } from "@auth/lib/server";
import { logger } from "@repo/logs";
import { revalidatePath } from "next/cache";

/**
 * Refreshes the rendered layout after a change to the caller's own session,
 * such as switching organisation or finishing onboarding.
 *
 * Two things were wrong with the previous version. A `"use server"` export is a
 * public HTTP endpoint, and this one had no session check at all — anyone could
 * call it. It also accepted an arbitrary `path`, which no caller ever passed;
 * every call site is a no-argument purge after an authenticated action. The
 * parameter is gone rather than validated, because an unused capability is not
 * worth an allowlist.
 *
 * This is still a site-wide revalidation, so it is deliberately expensive.
 * Rate limiting in front of server actions is what bounds abuse by a
 * signed-in user; this only stops anonymous callers.
 */
export const clearCache = async (): Promise<void> => {
	const session = await getSession();

	if (!session) {
		logger.warn("Rejected unauthenticated clearCache call");
		return;
	}

	try {
		revalidatePath("/", "layout");
	} catch (error) {
		logger.error("Could not revalidate layout", { error });
	}
};
