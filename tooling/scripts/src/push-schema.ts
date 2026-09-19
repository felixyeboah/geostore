import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

/**
 * Applies the Prisma schema to a libSQL database.
 *
 * `prisma db push` speaks Postgres, MySQL and a local SQLite file; it cannot
 * talk to a libSQL server over HTTP. So the DDL is generated with
 * `migrate diff` and executed through the libSQL client instead.
 *
 * Used by CI against a throwaway libsql-server, and by hand when standing up
 * a new Turso database.
 */
async function main() {
	const url = process.env.DATABASE_URL;

	if (!url) {
		throw new Error("DATABASE_URL is not set");
	}

	// Run from the database package: that is where prisma is a dependency,
	// and `npx prisma` cannot resolve it from this one.
	const databaseDir = fileURLToPath(
		new URL("../../../packages/database", import.meta.url),
	);

	const sql = execSync(
		"npx prisma migrate diff --from-empty --to-schema ./prisma/schema.prisma --script",
		{
			cwd: databaseDir,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "inherit"],
			// The diff opens no connection, but the Prisma config reads this.
			env: { ...process.env, DATABASE_URL: "file:./.diff.db" },
		},
	);

	// Every statement Prisma emits is preceded by a `-- CreateTable` comment,
	// so the comments must come out before splitting. Filtering chunks that
	// start with `--` afterwards discards the entire file.
	const statements = sql
		.split("\n")
		.filter((line) => !line.trim().startsWith("--"))
		.join("\n")
		.split(";")
		.map((statement) => statement.trim())
		.filter((statement) => statement.length > 0);

	const client = createClient({
		url,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});

	for (const statement of statements) {
		await client.execute(statement);
	}

	console.info(`Applied ${statements.length} statements to the database.`);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
