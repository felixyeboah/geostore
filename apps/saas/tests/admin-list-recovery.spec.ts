import { expect as baseExpect, type Page, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });
// Full Chromium avoids headless-shell crashes during repeated RSC navigation.
test.use({ channel: "chromium" });

async function signIn(page: Page) {
	const response = await page.request.post("/api/auth/sign-in/email", {
		data: { email: "qa-admin@geostore.test", password: "QaAdmin!2345" },
	});
	expect(response.ok()).toBeTruthy();
}

test("users recover from invalid page numbers and retain server search", async ({
	page,
}, testInfo) => {
	await signIn(page);
	await page.goto("/admin/users?page=-1");
	await expect(
		page.getByText("qa-admin@geostore.test", { exact: true }),
	).toBeVisible();
	await expect(page).not.toHaveURL(/page=-1/);
	await page.screenshot({
		path: testInfo.outputPath("users-page.png"),
		fullPage: true,
	});
	await page.getByRole("searchbox").fill("no-such-staff-account-qa");
	await expect(page).toHaveURL(/q=no-such-staff-account-qa/);
	await expect(
		page.getByText("qa-admin@geostore.test", { exact: true }),
	).toHaveCount(0);
	await page.getByRole("button", { name: "Clear", exact: true }).click();
	await expect(
		page.getByText("qa-admin@geostore.test", { exact: true }),
	).toBeVisible();
});

for (const entry of [
	{
		path: "users",
		rpc: "users/adminList",
		error: "Could not load users. Please try again.",
	},
	{
		path: "organizations",
		rpc: "organizations/list",
		error: "Organizations could not be loaded.",
	},
]) {
	test(`${entry.path} exposes failed requests and retries`, async ({
		page,
	}) => {
		await signIn(page);
		const pattern = `**/api/rpc/admin/${entry.rpc}**`;
		await page.route(pattern, (route) =>
			route.fulfill({
				status: 503,
				contentType: "application/json",
				body: "{}",
			}),
		);
		await page.goto(`/admin/${entry.path}`);
		await expect(
			page.getByRole("alert").filter({ hasText: entry.error }),
		).toBeVisible({ timeout: 30_000 });
		await page.unroute(pattern);
		await page
			.getByRole("button", { name: "Try again", exact: true })
			.click();
		await expect(
			page.getByRole("alert").filter({ hasText: entry.error }),
		).toHaveCount(0);
	});
}

test("organizations normalize invalid pages", async ({ page }) => {
	await signIn(page);
	await page.goto("/admin/organizations?currentPage=-4");
	await expect(
		page.getByRole("heading", {
			name: "Manage organizations",
			exact: true,
		}),
	).toBeVisible();
	await expect(page).not.toHaveURL(/currentPage=-4/);
	await page.goto("/admin/organizations?currentPage=999999999999999999");
	await expect(page).not.toHaveURL(/currentPage=999999999999999999/);
	await expect(
		page
			.getByRole("alert")
			.filter({ hasText: "Organizations could not be loaded." }),
	).toHaveCount(0);
});
