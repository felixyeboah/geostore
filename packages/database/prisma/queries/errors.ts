import { Prisma } from "../generated/client";

/**
 * A failure whose message is written for the person on the other end of the
 * screen — "That option is sold out", "Order not found" — as opposed to a
 * Prisma or connection error, whose message leaks schema internals. Server
 * actions pass this class's message straight through and swallow everything
 * else behind a generic string.
 */
export class StoreOperationError extends Error {
	readonly isStoreOperationError = true;

	constructor(message: string) {
		super(message);
		this.name = "StoreOperationError";
	}
}

export function isStoreOperationError(
	error: unknown,
): error is StoreOperationError {
	return (
		error instanceof StoreOperationError ||
		(typeof error === "object" &&
			error !== null &&
			"isStoreOperationError" in error &&
			(error as { isStoreOperationError: unknown })
				.isStoreOperationError === true)
	);
}

/** The Prisma error code (P2002, P2025, …) for a known request error. */
export function getPrismaErrorCode(error: unknown): string | null {
	return error instanceof Prisma.PrismaClientKnownRequestError
		? error.code
		: null;
}
