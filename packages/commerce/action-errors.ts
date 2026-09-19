import "server-only";
import { isStoreOperationError } from "@repo/database";
import { logger } from "@repo/logs";
import { ZodError } from "zod";

/**
 * Turns a thrown value into something safe to render in the storefront.
 *
 * The rule is deliberately narrow: only messages we wrote for a customer —
 * `StoreOperationError` and Zod validation issues — reach the screen. Anything
 * else is a bug or an infrastructure failure, and its message tends to carry
 * table names, column names, or connection strings, so it is logged server-side
 * and replaced with the caller's fallback.
 */
export function toStoreErrorMessage(error: unknown, fallback: string): string {
	if (isStoreOperationError(error)) {
		return error.message;
	}

	if (error instanceof ZodError) {
		return error.issues[0]?.message ?? fallback;
	}

	logger.error("Unexpected storefront action failure", { error });

	return fallback;
}
