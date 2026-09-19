import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should load", async ({ page }) => {
		await page.goto("/");

		// The hero heading, from `home.hero.title*`. It is split across
		// line breaks and an accent span, so this matches on the text.
		await expect(
			page.getByRole("heading", {
				name: /Tech for every part of your life/i,
				level: 1,
			}),
		).toBeVisible();
	});
});
