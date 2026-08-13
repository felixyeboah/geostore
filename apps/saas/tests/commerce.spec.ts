import { expect, test } from "@playwright/test";

test.describe("storefront purchase journey", () => {
	test("discovers a product, checks out, and shows a confirmation", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(
			page.getByRole("heading", {
				name: "Find the right gadget without the guesswork.",
			}),
		).toBeVisible();

		const search = page.getByRole("searchbox", { name: "Search products" });
		await search.first().fill("JBL Charge 5");
		await search.first().press("Enter");
		await expect(
			page.getByRole("heading", { name: /Results for/ }),
		).toBeVisible();
		await page
			.getByRole("link", { name: "JBL Charge 5", exact: true })
			.click();

		await expect(
			page.getByRole("heading", { name: "JBL Charge 5" }),
		).toBeVisible();
		await page
			.getByRole("button", { name: "Add to bag", exact: true })
			.first()
			.click();
		await page.goto("/cart");
		await expect(
			page.getByRole("heading", { name: "Your shopping bag" }),
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
		await page.getByRole("button", { name: /Place mock order/ }).click();

		await expect(
			page.getByRole("heading", { name: "Thanks, E2E." }),
		).toBeVisible();
		await expect(page.getByText(/Order GST-/)).toBeVisible();
		await expect(
			page.getByText("No card, mobile money", { exact: false }),
		).toHaveCount(0);
	});

	test("keeps search and category navigation available on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");
		await expect(page.getByPlaceholder("Search products...")).toBeVisible();
		await expect(
			page.getByRole("navigation", { name: "Shop categories" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Shopping bag with 0 items" }),
		).toBeVisible();
	});
});
