import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";

const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };

const SUFFIX = process.env.QA_SUFFIX ?? Math.random().toString(36).slice(2, 8);
const NAME = `QA Collection ${SUFFIX}`;
const SLUG = `qa-collection-${SUFFIX}`;

async function signIn(page: Page) {
	await page.goto("/login");
	await page.getByRole("textbox", { name: "Email" }).fill(ADMIN.email);
	await page
		.locator('input[autocomplete="current-password"]')
		.fill(ADMIN.password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	// Generous because the first hit on an authenticated route in a dev
	// server pays for a cold compile.
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
		timeout: 90_000,
	});
}

// The suite deletes its own collection at the end, but a failure part-way
// would otherwise leave one behind and skew the next run's counts.
test.afterAll(async () => {
	if (!process.env.DATABASE_URL) {
		return;
	}

	const client = createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	try {
		await client.execute({
			sql: 'DELETE FROM "store_collection" WHERE slug = ?',
			args: [SLUG],
		});
	} catch (error) {
		// Teardown must never turn a green suite red.
		console.warn(`[admin-collections] could not remove ${SLUG}:`, error);
	} finally {
		client.close();
	}
});

test.describe.configure({ mode: "serial" });

test.describe("admin collections", () => {
	test("lists stored collections and the automatic ones", async ({
		page,
	}) => {
		await signIn(page);
		await page.goto("/admin/collections");

		await expect(
			page.getByRole("heading", { name: "Collections", exact: true }),
		).toBeVisible({ timeout: 30_000 });

		// Smart collections are rules in code, so they are listed as
		// read-only. Without them the screen would imply the shop menu holds
		// only the editable ones.
		await expect(page.getByText("Automatic collections")).toBeVisible();
		await expect(page.getByText("Best sellers")).toBeVisible();
	});

	test("creates one, derives its slug, and picks its products", async ({
		page,
	}) => {
		await signIn(page);
		await page.goto("/admin/collections");
		await page
			.getByRole("button", { name: "Add collection" })
			.first()
			.click();

		const sheet = page.locator('[role="dialog"]');
		await expect(sheet).toBeVisible({ timeout: 30_000 });

		await sheet.getByLabel("Name", { exact: true }).fill(NAME);
		// The slug follows the name until someone edits it by hand.
		await expect(sheet.getByLabel("URL slug")).toHaveValue(SLUG);

		await sheet.getByRole("button", { name: "Add collection" }).click();
		await expect(sheet).toBeHidden({ timeout: 30_000 });

		const row = page.locator("ul > li").filter({ hasText: NAME }).first();
		await expect(row).toBeVisible({ timeout: 30_000 });

		// Membership, through a search that runs in the database.
		await row.getByRole("button", { name: /product/ }).click();
		const picker = page.locator('[role="dialog"]');
		await expect(picker).toBeVisible({ timeout: 30_000 });

		await picker
			.getByPlaceholder("Search by name, brand, SKU or department")
			.fill("MacBook Air");
		const add = picker.getByRole("button", {
			name: /^Add MacBook Air.*M5/,
		});
		await expect(add).toBeVisible({ timeout: 30_000 });
		await add.click();

		await picker.getByRole("button", { name: "Save products" }).click();
		await expect(picker).toBeHidden({ timeout: 30_000 });
		await expect(
			row.getByRole("button", { name: "1 product" }),
		).toBeVisible({ timeout: 30_000 });
	});

	test("hides, shows and deletes it", async ({ page }) => {
		await signIn(page);
		await page.goto("/admin/collections");

		const row = page.locator("ul > li").filter({ hasText: NAME }).first();
		await expect(row).toBeVisible({ timeout: 30_000 });

		await row.getByRole("button", { name: "Visible" }).click();
		await expect(row.getByRole("button", { name: "Hidden" })).toBeVisible({
			timeout: 30_000,
		});
		await row.getByRole("button", { name: "Hidden" }).click();
		await expect(row.getByRole("button", { name: "Visible" })).toBeVisible({
			timeout: 30_000,
		});

		await page.getByLabel(`Actions for ${NAME}`).click();
		await page.getByRole("menuitem", { name: "Delete collection" }).click();
		await expect(page.locator('[role="alertdialog"]')).toBeVisible({
			timeout: 15_000,
		});
		await page.getByRole("button", { name: "Delete collection" }).click();

		await expect(
			page.locator("ul > li").filter({ hasText: NAME }),
		).toHaveCount(0, { timeout: 30_000 });
	});
});
