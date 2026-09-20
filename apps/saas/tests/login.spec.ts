import { expect, test } from "@playwright/test";

/*
 * This app is staff-only. Customers never get an account: there is no signup,
 * no magic link, no social login and no passkey, and the storefront in
 * apps/marketing has no sign-in at all.
 *
 * These tests assert the absence of those as firmly as the presence of the
 * password form, because an accidental re-enable is exactly the kind of
 * regression nobody notices until a customer creates an account.
 */
test.describe("login page", () => {
	test("offers a password sign-in and nothing else", async ({ page }) => {
		await page.goto("/login");

		await expect(
			page.getByRole("heading", { name: "Welcome back" }),
		).toBeVisible();
		await expect(page.getByText("Staff access")).toBeVisible();
		await expect(
			page.getByText("Sign in to manage orders, products and stock."),
		).toBeVisible();

		await expect(
			page.getByRole("textbox", { name: /email/i }),
		).toBeVisible();
		await expect(
			page.locator('input[autocomplete="current-password"]'),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Forgot password?" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Sign in", exact: true }),
		).toBeVisible();

		// A way back to the shop, since this is the only page a customer
		// could land on by mistake.
		await expect(
			page.getByRole("link", { name: /Back to the shop/i }),
		).toBeVisible();
	});

	test("offers no way to create an account or sign in another way", async ({
		page,
	}) => {
		await page.goto("/login");

		await expect(page.getByRole("tab", { name: "Magic link" })).toHaveCount(
			0,
		);
		await expect(
			page.getByRole("button", { name: /passkey/i }),
		).toHaveCount(0);
		await expect(page.getByText("Or continue with")).toHaveCount(0);
		await expect(
			page.getByRole("link", { name: /Create an account/i }),
		).toHaveCount(0);
	});

	test("signup redirects to login", async ({ page }) => {
		await page.goto("/signup");
		await expect(page).toHaveURL(/\/login$/);
	});
});
