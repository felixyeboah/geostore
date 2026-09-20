import { PrismaLibSql } from "@prisma/adapter-libsql/web";
import { PrismaClient as NodePrismaClient } from "./generated/client";
import { PrismaClient as WorkerdPrismaClient } from "./generated-workerd/client";

/**
 * Turso (libSQL) over HTTP.
 *
 * Cloudflare Workers cannot open a raw TCP socket, which rules out the
 * Postgres driver at the edge. libSQL talks HTTP, so the same connection works
 * in a Worker, in `next dev` and in the seed scripts.
 *
 * The `/web` adapter build is deliberate: the default export pulls
 * `@libsql/client`'s Node entry, whose native bindings a Worker cannot load.
 */

/**
 * Two generated clients, chosen at runtime.
 *
 * Prisma's default client decodes its WASM query compiler from base64 and
 * calls `new WebAssembly.Module(bytes)`. Workerd forbids that outright, so
 * every query throws "Wasm code generation disallowed by embedder". The
 * workerd build imports the wasm as a module, which the platform compiles
 * ahead of time — but that import does not resolve under plain Node.
 *
 * Both are bundled; only one is ever constructed. Bundling the unused one is
 * harmless, because the failure is in executing the compile, not in loading
 * the module.
 */
function isWorkerd(): boolean {
	return (
		typeof navigator !== "undefined" &&
		navigator.userAgent === "Cloudflare-Workers"
	);
}

const prismaClientSingleton = (): NodePrismaClient => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const adapter = new PrismaLibSql({
		url: process.env.DATABASE_URL,
		// Absent for a local file, required for a hosted Turso database.
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});

	// The two generated clients are structurally identical — same schema, same
	// engine type — so the rest of the codebase is typed against one of them.
	// A union of the two makes TypeScript give up with "excessive stack depth".
	return isWorkerd()
		? (new WorkerdPrismaClient({ adapter }) as unknown as NodePrismaClient)
		: new NodePrismaClient({ adapter });
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// biome-ignore lint/suspicious/noRedeclare: This is a singleton
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
	globalThis.prisma = prisma;
}

export { prisma as db };
