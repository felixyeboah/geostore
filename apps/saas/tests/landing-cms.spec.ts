import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";
import { LANDING_SECTIONS } from "@repo/commerce";

test.describe.configure({ mode: "serial" });

const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };
const STOREFRONT =
	process.env.PLAYWRIGHT_STOREFRONT_URL ?? "http://localhost:3001";
const STAMP = Date.now();
const HERO_MARKER = `Hero marker ${STAMP}`;
const BRAND_MARKER = `Brand marker ${STAMP}`;

async function signIn(page: Page) {
	await page.goto("/login");
	await page.getByRole("textbox", { name: "Email" }).fill(ADMIN.email);
	await page
		.locator('input[autocomplete="current-password"]')
		.fill(ADMIN.password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
		timeout: 90_000,
	});
}

async function storefront(request: {
	get: (url: string) => Promise<{ text: () => Promise<string> }>;
}) {
	return (await request.get(`${STOREFRONT}/?t=${Date.now()}`)).text();
}

/**
 * Poll the storefront rather than asserting on it once.
 *
 * A toast is not a reliable signal that a publish has landed: this suite runs
 * in seconds, so a toast from an earlier step can still be on screen and
 * satisfy a visibility check before the later publish has finished. The
 * rendered page is the only thing worth asserting on, so wait for it to
 * agree.
 */
function expectStorefront(
	request: Parameters<typeof storefront>[0],
	message: string,
) {
	return expect.poll(async () => await storefront(request), {
		timeout: 20_000,
		message,
	});
}

test("the landing editor controls the storefront", async ({
	page,
	request,
}) => {
	test.setTimeout(300_000);

	const db = createClient({
		url: process.env.DATABASE_URL ?? "",
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	try {
		// Preserve the live configuration and unpublished work exactly. Defaults
		// below belong only to this test; cleanup also runs after failed assertions.
		const snapshot = await db.execute("SELECT * FROM landing_section");
		const actor = await db.execute({
			sql: 'SELECT id FROM "user" WHERE email = ?',
			args: [ADMIN.email],
		});
		const actorId = actor.rows[0]?.id;
		if (!actorId) {
			throw new Error("Landing test administrator is missing");
		}
		const readTestActorRevisions = () =>
			db.execute({
				sql: 'SELECT id FROM landing_section_revision WHERE "userId" = ? AND "sectionKey" IN (?, ?, ?)',
				args: [actorId, "hero", "brands", "trust"],
			});
		const priorRevisionIds = new Set(
			(await readTestActorRevisions()).rows.map((row) => String(row.id)),
		);
		const mutableColumns = [
			"isVisible",
			"sortOrder",
			"settings",
			"draftIsVisible",
			"draftSortOrder",
			"draftSettings",
			"updatedBy",
			"updatedAt",
		];
		const originalKeys = new Set(
			snapshot.rows.map((row) => String(row.key)),
		);
		const addedKeys = LANDING_SECTIONS.map((section) => section.key).filter(
			(key) => !originalKeys.has(key),
		);
		try {
			await db.batch(
				[
					'UPDATE landing_section SET "isVisible" = 1, settings = NULL, "draftIsVisible" = NULL, "draftSortOrder" = NULL, "draftSettings" = NULL',
					...LANDING_SECTIONS.map((section) => ({
						sql: 'UPDATE landing_section SET "sortOrder" = ? WHERE key = ?',
						args: [section.defaultSortOrder, section.key],
					})),
				],
				"write",
			);

			await signIn(page);
			await page.goto("/admin/landing", { waitUntil: "networkidle" });

			// Every control stages a draft — nothing reaches shoppers until the
			// banner's Publish button commits it.
			async function publish() {
				await page
					.getByRole("button", { name: "Publish changes" })
					.click();
				// A lingering toast from the previous publish can satisfy a text
				// check before this one resolves — the banner only unmounts once the
				// action has committed the draft, so it is the reliable signal.
				await expect(
					page.getByRole("button", { name: "Publish changes" }),
				).toHaveCount(0, { timeout: 20_000 });
			}

			// 1. Copy override reaches the page. The editor is a sheet over the
			// preview, so the band has to be opened before its fields exist.
			await page.getByRole("button", { name: /^Hero/ }).click();
			const sheet = page.getByRole("dialog");
			await sheet.getByLabel("Headline, first line").fill(HERO_MARKER);
			await page.getByRole("button", { name: "Save band" }).click();
			await expect(
				page.getByText("Hero staged. Publish to make it live."),
			).toBeVisible({ timeout: 20_000 });
			await publish();
			await expectStorefront(
				request,
				"hero override reaches the page",
			).toContain(HERO_MARKER);

			// 2. A second section, so the hide check has something unique to look for.
			await page.getByRole("button", { name: /^Brand line/ }).click();
			await sheet.getByLabel("First line").fill(BRAND_MARKER);
			await page.getByRole("button", { name: "Save band" }).click();
			await expect(
				page.getByText("Brand line staged. Publish to make it live."),
			).toBeVisible({ timeout: 20_000 });
			await publish();
			await expectStorefront(
				request,
				"brand override reaches the page",
			).toContain(BRAND_MARKER);

			// 3. Hiding removes it from the page entirely.
			await page.getByRole("button", { name: "Hide Brand line" }).click();
			await expect(
				page.getByText(
					"Brand line will be hidden. Publish to make it live.",
				),
			).toBeVisible({ timeout: 20_000 });
			await publish();
			await expectStorefront(
				request,
				"hidden band leaves the page",
			).not.toContain(BRAND_MARKER);
			await expectStorefront(
				request,
				"hiding one band must not affect another",
			).toContain(HERO_MARKER);

			// 4. Showing brings it back.
			await page.getByRole("button", { name: "Show Brand line" }).click();
			await expect(
				page.getByText(
					"Brand line will show. Publish to make it live.",
				),
			).toBeVisible({ timeout: 20_000 });
			await publish();
			await expectStorefront(
				request,
				"showing brings the band back",
			).toContain(BRAND_MARKER);

			// 5. Reordering is persisted. A staged order shows no toast — the
			// banner's Publish button is the signal the draft took it.
			await page
				.getByRole("button", { name: "Move Brand line up" })
				.click();
			await expect(
				page.getByRole("button", { name: "Publish changes" }),
			).toBeVisible({ timeout: 20_000 });
			await publish();

			await expect
				.poll(
					async () => {
						const { rows } = await db.execute(
							'SELECT key FROM landing_section ORDER BY "sortOrder" ASC',
						);
						const order = rows.map((row) => String(row.key));
						return order.indexOf("brands") - order.indexOf("trust");
					},
					{
						timeout: 20_000,
						message:
							"Brand line should now sit above the delivery strip",
					},
				)
				.toBeLessThan(0);

			// 6. Clearing the overrides restores the shipped copy.
			for (const [section, toast] of [
				["Brand line", "Brand line staged. Publish to make it live."],
				["Hero", "Hero staged. Publish to make it live."],
			] as const) {
				await page
					.getByRole("button", { name: new RegExp(`^${section}`) })
					.click();
				await page
					.getByRole("button", { name: "Reset to built-in text" })
					.click();
				await page.getByRole("button", { name: "Save band" }).click();
				await expect(page.getByText(toast)).toBeVisible({
					timeout: 20_000,
				});
				await publish();
			}

			await expectStorefront(
				request,
				"hero override cleared",
			).not.toContain(HERO_MARKER);
			await expectStorefront(
				request,
				"brand override cleared",
			).not.toContain(BRAND_MARKER);
			await expectStorefront(
				request,
				"the shipped copy is back",
			).toContain("we stock.");
		} finally {
			// Restrict audit cleanup to this QA actor, affected sections, and new IDs.
			const testRevisions = (await readTestActorRevisions()).rows.filter(
				(row) => !priorRevisionIds.has(String(row.id)),
			);
			await db.batch(
				[
					// Loading the editor can initialize missing shipped sections. Remove
					// only those registry keys that were absent from the original snapshot.
					...(addedKeys.length
						? [
								{
									sql: `DELETE FROM landing_section WHERE key IN (${addedKeys.map(() => "?").join(",")})`,
									args: addedKeys,
								},
							]
						: []),
					...testRevisions.map((row) => ({
						sql: 'DELETE FROM landing_section_revision WHERE id = ? AND "userId" = ?',
						args: [row.id, actorId],
					})),
					...snapshot.rows.map((row) => ({
						sql: `UPDATE landing_section SET ${mutableColumns.map((column) => `"${column}" = ?`).join(",")} WHERE id = ?`,
						args: [
							...mutableColumns.map((column) => row[column]),
							row.id,
						],
					})),
				],
				"write",
			);
		}
	} finally {
		db.close();
	}
});

test("default landing products reflect live prices and remove archived rows", async ({
	request,
}) => {
	const db = createClient({
		url: process.env.DATABASE_URL ?? "",
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	const id = "prod_iphone_18_pro";
	const marker = `Landing live product ${Date.now()}`;
	try {
		const original = (
			await db.execute({
				sql: 'SELECT name, status, "priceInPesewas", "updatedAt" FROM store_product WHERE id = ?',
				args: [id],
			})
		).rows[0];
		const section = (
			await db.execute(
				"SELECT * FROM landing_section WHERE key = 'products'",
			)
		).rows[0];
		try {
			if (!original) {
				const category = (
					await db.execute(
						'SELECT id FROM store_category WHERE "isActive" = 1 LIMIT 1',
					)
				).rows[0];
				if (!category) {
					throw new Error(
						"An active category is required for the landing fixture",
					);
				}
				await db.execute({
					sql: 'INSERT INTO store_product (id,name,slug,sku,brand,"shortDescription",description,status,"priceInPesewas","stockQuantity","categoryId","updatedAt") VALUES (?,?,?,?,?,?,?, ?,?,?,?,?)',
					args: [
						id,
						marker,
						`qa-landing-live-${Date.now()}`,
						`QA-LANDING-${Date.now()}`,
						"QA",
						"QA fixture",
						"QA fixture",
						"ACTIVE",
						123400,
						1,
						category.id,
						Date.now(),
					],
				});
			} else {
				await db.execute({
					sql: 'UPDATE store_product SET name = ?, status = ?, "priceInPesewas" = ? WHERE id = ?',
					args: [marker, "ACTIVE", 123400, id],
				});
			}
			await db.execute(
				"UPDATE landing_section SET settings = '{}', \"isVisible\" = 1 WHERE key = 'products'",
			);
			await expectStorefront(
				request,
				"default product name is read from the database",
			).toContain(marker);
			await expectStorefront(
				request,
				"default product price is read from the database",
			).toContain("1,234");
			await db.execute({
				sql: "UPDATE store_product SET status = ? WHERE id = ?",
				args: ["ARCHIVED", id],
			});
			await expectStorefront(
				request,
				"archived default does not reappear as a seed card",
			).not.toContain(marker);
			await expectStorefront(
				request,
				"archived model never falls back to its seed card",
			).not.toContain('href="/products/iphone-18-pro"');
		} finally {
			if (original) {
				await db.execute({
					sql: 'UPDATE store_product SET name = ?, status = ?, "priceInPesewas" = ?, "updatedAt" = ? WHERE id = ?',
					args: [
						original.name,
						original.status,
						original.priceInPesewas,
						original.updatedAt,
						id,
					],
				});
			} else {
				await db.execute({
					sql: "DELETE FROM store_product WHERE id = ?",
					args: [id],
				});
			}
			if (section) {
				await db.execute({
					sql: 'UPDATE landing_section SET settings = ?, "isVisible" = ? WHERE id = ?',
					args: [section.settings, section.isVisible, section.id],
				});
			}
		}
	} finally {
		db.close();
	}
});
