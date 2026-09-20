import { createClient } from "@libsql/client";
import { expect, test } from "@playwright/test";

const PURCHASED_SLUG = "jbl-charge-5";

/**
 * This suite buys a real seeded product, so every run permanently decrements
 * its stock. Left alone that is a slow-acting time bomb: after enough runs the
 * product hits zero, "Add to bag" is correctly disabled, and the purchase test
 * starts failing for a reason that has nothing to do with the code under test.
 * (That is exactly how it failed — the seed had been ground down to 0.)
 *
 * Restoring the one unit the test consumes keeps the suite repeatable. The
 * store runs on Turso (libSQL over HTTP) and shares the app's DATABASE_URL, so
 * a missing or unreachable database downgrades to a warning rather than
 * failing an otherwise good run.
 */
async function restorePurchasedStock() {
	try {
		const db = createClient({
			url: process.env.DATABASE_URL ?? "",
			authToken: process.env.DATABASE_AUTH_TOKEN,
		});
		await db.execute(
			`UPDATE store_product SET "stockQuantity" = "stockQuantity" + 1 WHERE slug = '${PURCHASED_SLUG}'`,
		);
		db.close();
	} catch (error) {
		console.warn(
			`Could not restore ${PURCHASED_SLUG} stock; reruns may exhaust it.`,
			error,
		);
	}
}

test.describe("storefront purchase journey", () => {
	test("discovers a product, checks out, and shows a confirmation", async ({
		page,
	}) => {
		await page.goto("/shop");
		await expect(
			page.getByRole("heading", { name: "Everything we stock" }),
		).toBeVisible();

		// The editorial catalogue has no inline search box — search lives in
		// the nav dialog, and arrives here as a ?q= that shows as a chip.
		await page.goto("/shop?q=JBL+Charge+5");
		await expect(
			page.getByRole("heading", { name: /Results for/ }),
		).toBeVisible();
		await page
			.getByRole("link", { name: "JBL Charge 5", exact: true })
			.first()
			.click();

		// Wait for the navigation before asserting: on the results page the
		// h1 ("Results for “JBL Charge 5”") also contains the product name, so
		// an un-levelled heading match there is a strict-mode violation.
		await page.waitForURL("**/products/jbl-charge-5");
		await expect(
			page.getByRole("heading", { name: "JBL Charge 5", level: 1 }),
		).toBeVisible();
		await page
			.getByRole("button", { name: "Add to bag", exact: true })
			.first()
			.click();
		await page.goto("/cart");
		await expect(
			page.getByRole("heading", { name: "Your bag" }),
		).toBeVisible();
		await expect(page.getByText("GH₵ 1,450").first()).toBeVisible();

		await page.getByRole("link", { name: "Continue to checkout" }).click();
		await page
			.getByRole("textbox", { name: "Full name" })
			.fill("E2E Customer");
		await page
			.getByRole("textbox", { name: "Email address" })
			.fill("e2e@example.com");
		await page
			.getByRole("textbox", { name: "Phone number" })
			.fill("0240000001");
		await page
			.getByRole("textbox", { name: "Street address or landmark" })
			.fill("25 Test Avenue");
		await page.getByRole("textbox", { name: "Town or city" }).fill("Accra");
		await page
			.getByRole("textbox", { name: "Region" })
			.fill("Greater Accra");
		await page.getByRole("button", { name: /Place order/ }).click();

		await expect(
			page.getByRole("heading", { name: "Thanks, E2E." }),
		).toBeVisible();
		await expect(page.getByText(/Order GST-/)).toBeVisible();
		await expect(
			page.getByText("No card, mobile money", { exact: false }),
		).toHaveCount(0);

		await restorePurchasedStock();
	});

	test("keeps search and category navigation available on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/shop");
		await expect(
			page.getByRole("navigation", { name: "Departments" }),
		).toBeVisible();
		// The bag opens the drawer rather than linking to /cart.
		await expect(
			page.getByRole("button", { name: "Shopping bag with 0 items" }),
		).toBeVisible();
	});
});
