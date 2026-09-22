import assert from "node:assert/strict";
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { type Client, createClient } from "@libsql/client";
import { STORE_PRODUCTS } from "@repo/commerce/seed-catalog";

// Opt-in integration fixture: never accepts DATABASE_URL or a remote target.
// A private SQL dump is restored into a temporary local file and served locally.
const dump = process.env.CATALOG_RESET_TEST_SQL_DUMP;
const root = fileURLToPath(new URL("../../../", import.meta.url));
const historyTables = [
	"store_webhook_event",
	"store_inventory_event",
	"store_review",
	"store_order_item",
	"store_transaction",
	"store_order_status_event",
	"store_order",
];
const catalogTables = [
	"store_product_collection",
	"store_product_image",
	"store_product_variant",
	"store_product",
	"store_collection",
	"store_category",
];

function runReset(backupDir: string, extra: string[] = []) {
	return spawnSync(
		"pnpm",
		[
			"exec",
			"tsx",
			"src/reset-store-catalog.ts",
			"--apply",
			"--clear-commerce-history",
			"--require-empty-commerce-history",
			"--database-host=127.0.0.1",
			...extra,
		],
		{
			cwd: path.join(root, "tooling/scripts"),
			encoding: "utf8",
			timeout: 120_000,
			env: {
				...process.env,
				DATABASE_URL: "http://127.0.0.1:43219",
				DATABASE_AUTH_TOKEN: "",
				CATALOG_BACKUP_DIR: backupDir,
			},
		},
	);
}

async function fingerprints(db: Client) {
	const tables = await db.execute(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
	);
	const result: Record<string, string> = {};
	for (const row of tables.rows) {
		const name = String(row.name);
		const rows = await db.execute(
			`SELECT * FROM "${name.replace(/"/g, '""')}"`,
		);
		// Hash rows rather than exposing any backed-up personal data on assertion failures.
		const serialized = rows.rows
			.map((record) => JSON.stringify(record))
			.sort()
			.join("\n");
		result[name] = createHash("sha256").update(serialized).digest("hex");
	}
	return result;
}

async function waitForServer(server: ChildProcess, db: Client) {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (server.exitCode !== null) {
			throw new Error(
				"Private local Turso server exited before readiness",
			);
		}
		try {
			await db.execute("SELECT 1");
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}
	throw new Error("Private local Turso server did not become ready");
}

test("actual catalog reset refuses history and preserves unrelated tables on success", {
	skip: !dump,
	timeout: 180_000,
}, async () => {
	const directory = await mkdtemp(
		path.join(os.tmpdir(), "geostore-reset-integration-"),
	);
	const databaseFile = path.join(directory, "private.db");
	const backupDir = path.join(directory, "backups");
	let server: ChildProcess | undefined;
	let db: Client | undefined;
	try {
		const restore = spawnSync(
			"python3",
			[
				"-c",
				"import sqlite3,sys; db=sqlite3.connect(sys.argv[2]); db.executescript(open(sys.argv[1]).read()); db.close()",
				path.resolve(dump ?? ""),
				databaseFile,
			],
			{ encoding: "utf8" },
		);
		assert.equal(
			restore.status,
			0,
			"Private fixture dump must restore successfully",
		);
		// Reject an occupied port before starting: do not accidentally connect to another database.
		const portCheck = spawnSync(
			"python3",
			[
				"-c",
				"import socket; s=socket.socket(); s.bind(('127.0.0.1',43219)); s.close()",
			],
			{ encoding: "utf8" },
		);
		assert.equal(
			portCheck.status,
			0,
			"Port43219 must be free for the private fixture",
		);
		server = spawn(
			"turso",
			["dev", "--db-file", databaseFile, "--port", "43219"],
			{ stdio: "ignore" },
		);
		db = createClient({ url: "http://127.0.0.1:43219" });
		await waitForServer(server, db);
		// A standalone webhook marker is history even if there are no orders.
		await db.batch(
			historyTables.map((table) => `DELETE FROM "${table}"`),
			"write",
		);
		await db.execute({
			sql: 'INSERT INTO store_webhook_event (id, type, "processedAt") VALUES (?, ?, ?)',
			args: ["reset-guard-fixture", "PAYSTACK", new Date().toISOString()],
		});
		const beforeBlocked = await fingerprints(db);
		const blocked = runReset(backupDir);
		assert.notEqual(blocked.status, 0);
		assert.match(
			blocked.stderr,
			/Commerce history exists; refusing catalog replacement/,
		);
		assert.deepEqual(
			await fingerprints(db),
			beforeBlocked,
			"A refused reset must leave every table unchanged",
		);
		assert.deepEqual(
			await readdir(backupDir),
			[],
			"A refused reset must not create a misleading replacement backup",
		);

		await db.execute(
			"DELETE FROM store_webhook_event WHERE id = 'reset-guard-fixture'",
		);
		const beforeApply = await fingerprints(db);
		const applied = runReset(backupDir);
		assert.equal(
			applied.status,
			0,
			`Local script should apply successfully: ${applied.stderr}`,
		);
		assert.match(applied.stdout, /Catalog reset committed/);
		const afterApply = await fingerprints(db);
		for (const [table, digest] of Object.entries(beforeApply)) {
			if (!catalogTables.includes(table)) {
				assert.equal(
					afterApply[table],
					digest,
					`Preserve noncatalog table ${table}`,
				);
			}
		}
		const ids = (
			await db.execute("SELECT id FROM store_product ORDER BY id")
		).rows.map((row) => row.id);
		assert.deepEqual(
			ids,
			STORE_PRODUCTS.map((product) => product.id).sort(),
		);
		assert.equal(
			(await db.execute("PRAGMA foreign_key_check")).rows.length,
			0,
		);
		const files = await readdir(backupDir);
		assert.equal(files.length, 1);
		const backupPath = path.join(backupDir, files[0]);
		assert.equal((await stat(backupPath)).mode & 0o777, 0o600);
		const backup = JSON.parse(await readFile(backupPath, "utf8"));
		assert.equal(backup.host, "127.0.0.1");
		for (const table of [...historyTables, ...catalogTables]) {
			const serialized = backup.tables[table]
				.map((row: unknown) => JSON.stringify(row))
				.sort()
				.join("\n");
			assert.equal(
				createHash("sha256").update(serialized).digest("hex"),
				beforeApply[table],
				`Backup captures original ${table}`,
			);
		}
	} finally {
		db?.close();
		if (server && server.exitCode === null) {
			server.kill("SIGTERM");
			await new Promise<void>((resolve) =>
				server?.once("exit", () => resolve()),
			);
		}
		await rm(directory, { recursive: true, force: true });
	}
});
