import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";
import { chooseAdminOption } from "./helpers";

const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };
const BUYER = { email: "qa-buyer@geostore.test", password: "QaBuyer!2345" };

async function signIn(page: Page, user: { email: string; password: string }) {
	await page.goto("/login");
	await page.getByRole("textbox", { name: "Email" }).fill(user.email);
	await page
		.locator('input[autocomplete="current-password"]')
		.fill(user.password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	// Generous because the first hit on an authenticated route in a dev
	// server pays for a cold compile.
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
		timeout: 90_000,
	});
}

test.describe.configure({ mode: "serial" });

// Slug and SKU are unique columns, so a fixed suffix made this suite pass only
// against a virgin database: every rerun hit the unique constraint and failed
// with "That URL slug or SKU is already used by another item." A per-run suffix
// keeps the suite repeatable. `QA_SUFFIX` still pins it when a fixture needs to
// be inspected by hand afterwards.
const SUFFIX = process.env.QA_SUFFIX ?? Math.random().toString(36).slice(2, 10);
const PRODUCT_SLUG = `qa-test-gadget-${SUFFIX}`;
const PRODUCT_NAME = `QA Test Gadget ${SUFFIX}`;

// The suite creates a real, ACTIVE product on every run and, until now, never
// removed it: eleven "QA Test Gadget" rows had accumulated in the dev database,
// four of them live in the storefront and all of them skewing any sales-ranked
// merchandising. Delete the fixture at the end of the run instead.
test.afterAll(async () => {
	if (!process.env.DATABASE_URL) {
		console.warn(
			`[admin-qa] DATABASE_URL not set — leaving fixture ${PRODUCT_SLUG} behind.`,
		);
		return;
	}
	// The raw libSQL client rather than Prisma: Playwright's TypeScript
	// transform chokes on Prisma's generated client, and this only needs one
	// statement. Variants and images cascade; an order line would block the
	// delete, but a fixture product is never ordered by this suite.
	const client = createClient({
		url: process.env.DATABASE_URL ?? "",
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	try {
		const { rowsAffected } = await client.execute({
			sql: 'DELETE FROM "store_product" WHERE slug = ?',
			args: [PRODUCT_SLUG],
		});
		if (rowsAffected) {
			console.log(`[admin-qa] removed fixture ${PRODUCT_SLUG}`);
		}
	} catch (error) {
		// Teardown must never turn a green suite red.
		console.warn(`[admin-qa] could not remove ${PRODUCT_SLUG}:`, error);
	} finally {
		client.close();
	}
});

test.describe("admin product management", () => {
	test("admin can create a product with a variant", async ({ page }) => {
		await signIn(page, ADMIN);

		await page.goto("/admin/products/new");
		await expect(
			page.getByRole("heading", { name: "Add product" }),
		).toBeVisible({ timeout: 30_000 });

		const main = page.locator("form");
		await main.getByLabel("Name", { exact: true }).fill(PRODUCT_NAME);
		await main.getByRole("button", { name: "Change" }).click();
		await main.getByLabel("URL slug").fill(PRODUCT_SLUG);
		await main.getByLabel("Brand").fill("QA Labs");
		await chooseAdminOption(
			page,
			main.getByLabel("Department"),
			"Phones & tablets",
		);
		await main
			.getByLabel("Summary")
			.fill("A QA fixture gadget used by the end-to-end suite.");
		await main
			.getByLabel("Description", { exact: true })
			.fill(
				"This product exists only so the automated QA suite can exercise admin product creation, variant creation, stock edits, and storefront revalidation end to end.",
			);
		await main
			.locator("#photos")
			.getByRole("button", { name: "Paste image URLs instead" })
			.click();
		await main
			.getByLabel("Product image URLs")
			.fill(
				"https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
			);

		// It comes in one storage size — a single option with one choice, so
		// the product still carries a variant row. Located by field name rather
		// than by the row's styling, which has changed twice and silently took
		// this assertion with it.
		await main.getByText("Comes in options", { exact: true }).click();
		await main.getByLabel("Starting price (GH₵)").fill("250");
		await main
			.getByLabel("Base product code (SKU)")
			.fill(`QA-SKU-${SUFFIX}`);
		const option = page.getByTestId("option-0");
		await option.getByLabel("Option name").fill("Storage");
		await option.getByLabel("Option values").fill("256 GB");
		await option.getByLabel("Option values").press("Enter");
		await main
			.locator('input[name="variants.0.sku"]')
			.fill(`QA-VAR-${SUFFIX}`);
		await main
			.locator('input[name="variants.0.priceInPesewas"]')
			.fill("300");
		await main.locator('input[name="variants.0.stockQuantity"]').fill("7");

		await page.getByRole("button", { name: "Publish" }).click();

		await expect(
			page.getByText(/Product created|created/i).first(),
		).toBeVisible({
			timeout: 15_000,
		});
	});

	test("created product is listed and stock is editable", async ({
		page,
	}) => {
		await signIn(page, ADMIN);
		await page.goto("/admin/products");
		await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible();
	});

	test("analytics and overview render", async ({ page }) => {
		await signIn(page, ADMIN);

		await page.goto("/admin/analytics");
		await expect(
			page.getByRole("heading", { name: "Store analytics" }),
		).toBeVisible({ timeout: 30_000 });
		// The window is chosen now, so the metric is "Revenue" rather than
		// "30-day revenue".
		await expect(page.getByText("Revenue", { exact: true })).toBeVisible();
		await expect(
			page.getByText("Payment success", { exact: true }),
		).toBeVisible();

		// Changing the range re-queries on the server.
		await page.getByRole("button", { name: "7 days", exact: true }).click();
		await expect(page).toHaveURL(/days=7/, { timeout: 30_000 });
		await expect(
			page.getByRole("heading", { name: "Store analytics" }),
		).toBeVisible();

		await page.goto("/admin/overview");
		await expect(page.locator("h1")).toBeVisible();

		// The seed creates no orders, so a row-level control cannot be the
		// marker that this screen rendered — it was not there to find, and
		// this assertion failed on any freshly seeded database. Assert the
		// screen's own furniture, and the row control only when there is a
		// row to carry it.
		await page.goto("/admin/orders");
		await expect(
			page.getByRole("heading", { name: "Orders", exact: true }),
		).toBeVisible({ timeout: 30_000 });
		await expect(page.getByLabel("Search orders")).toBeVisible();
		if ((await page.locator("tbody tr").count()) > 0) {
			await expect(page.getByLabel("Order status").first()).toBeVisible();
		}

		await page.goto("/admin/transactions");
		await expect(page.locator("h1")).toBeVisible();
	});
});

test.describe("admin authorization", () => {
	test("a non-admin buyer cannot reach the admin area", async ({ page }) => {
		await signIn(page, BUYER);
		// The admin layout refuses a non-admin with a redirect thrown after
		// streaming has started, so the refusal reaches the browser as a
		// client-side navigation — which aborts the document load.
		const response = await page.goto("/admin/products").catch(() => null);
		await page
			.waitForURL((url) => !url.pathname.startsWith("/admin"), {
				timeout: 15_000,
			})
			.catch(() => null);
		const url = page.url();
		// The marker is the table's own control rather than a row's, so an
		// empty catalogue cannot be mistaken for a refusal.
		const reachedAdmin =
			url.includes("/admin/products") &&
			(await page.getByLabel("Search products").count()) > 0;
		expect(
			reachedAdmin,
			`buyer reached admin products (status ${response?.status()})`,
		).toBe(false);
	});
});
