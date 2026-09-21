import { createClient } from "@libsql/client";
import { expect as baseExpect, type Page, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });
const SETTING_KEYS = [
	"store.deliveryFeeInPesewas",
	"store.freeDeliveryOverInPesewas",
	"store.dispatchWindowHours",
	"store.onlinePaymentsEnabled",
	"store.checkoutWhatsappNumber",
];

async function signIn(page: Page) {
	const response = await page.request.post("/api/auth/sign-in/email", {
		data: { email: "qa-admin@geostore.test", password: "QaAdmin!2345" },
	});
	expect(response.ok()).toBeTruthy();
}

function database() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL required for settings snapshot");
	}
	return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}

test("operating settings save, reload and restore their exact database snapshot", async ({
	page,
}, testInfo) => {
	const db = database();
	const placeholders = SETTING_KEYS.map(() => "?").join(",");
	const snapshot = await db.execute({
		sql: `SELECT * FROM storefront_setting WHERE key IN (${placeholders})`,
		args: SETTING_KEYS,
	});
	try {
		await signIn(page);
		await page.goto("/admin/settings");
		const dispatch = page.locator("#setting-dispatchWindowHours");
		const original = await dispatch.inputValue();
		const replacement = original === "47" ? "46" : "47";
		await dispatch.fill("-1");
		await expect(dispatch).toHaveAttribute("aria-invalid", "true");
		await expect(
			page.getByRole("button", { name: "Save changes", exact: true }),
		).toBeDisabled();
		await dispatch.fill(replacement);
		await page
			.getByRole("button", { name: "Save changes", exact: true })
			.click();
		await expect(
			page.getByText("Settings saved", { exact: true }),
		).toBeVisible();
		await page.reload();
		await expect(dispatch).toHaveValue(replacement);
		const persisted = await db.execute({
			sql: "SELECT value FROM storefront_setting WHERE key = ?",
			args: ["store.dispatchWindowHours"],
		});
		expect(persisted.rows[0]?.value).toBe(replacement);
		await page.screenshot({
			path: testInfo.outputPath("settings-saved.png"),
			fullPage: true,
		});
	} finally {
		// Restore both values and metadata, including absent default rows. No checkout occurs.
		await db.batch(
			[
				{
					sql: `DELETE FROM storefront_setting WHERE key IN (${placeholders})`,
					args: SETTING_KEYS,
				},
				...snapshot.rows.map((row) => ({
					sql: `INSERT INTO storefront_setting (${snapshot.columns.map((column) => `"${column}"`).join(",")}) VALUES (${snapshot.columns.map(() => "?").join(",")})`,
					args: snapshot.columns.map((column) => row[column] ?? null),
				})),
			],
			"write",
		);
		const restored = await db.execute({
			sql: `SELECT * FROM storefront_setting WHERE key IN (${placeholders}) ORDER BY key`,
			args: SETTING_KEYS,
		});
		expect(restored.rows).toEqual(
			[...snapshot.rows].sort((left, right) =>
				String(left.key).localeCompare(String(right.key)),
			),
		);
		db.close();
	}
});

test("overview and analytics ranges round-trip through server URLs", async ({
	page,
}, testInfo) => {
	test.setTimeout(180_000);
	await signIn(page);
	await page.goto("/admin/overview?range=invalid");
	await expect(
		page
			.getByRole("navigation", { name: "Reporting range" })
			.getByRole("link", { name: "30 days" }),
	).toHaveAttribute("aria-current", "page");
	for (const days of [7, 90, 30]) {
		await page
			.getByRole("navigation", { name: "Reporting range" })
			.getByRole("link", { name: `${days} days` })
			.click();
		await expect(
			page.getByText(`Paid revenue · last ${days} days`, { exact: true }),
		).toBeVisible();
		await page.reload();
		await expect(
			page
				.getByRole("navigation", { name: "Reporting range" })
				.getByRole("link", { name: `${days} days` }),
		).toHaveAttribute("aria-current", "page");
	}
	await page.screenshot({
		path: testInfo.outputPath("overview-range.png"),
		fullPage: true,
	});
	await page.goto("/admin/analytics?days=invalid");
	await expect(
		page.getByRole("button", { name: "30 days", exact: true }),
	).toHaveAttribute("aria-pressed", "true");
	for (const days of [7, 90, 30]) {
		await page
			.getByRole("button", { name: `${days} days`, exact: true })
			.click();
		await expect(
			page.getByRole("button", { name: `${days} days`, exact: true }),
		).toHaveAttribute("aria-pressed", "true");
		await expect(
			page.getByRole("button", { name: `${days} days`, exact: true }),
		).toBeEnabled();
		// nuqs exposes optimistic selection before its throttled URL write.
		// Reload the committed destination, not the previous document URL.
		await expect
			.poll(() => new URL(page.url()).searchParams.get("days"))
			.toBe(days === 30 ? null : String(days));
		await page.reload();
		await expect(
			page.getByRole("button", { name: `${days} days`, exact: true }),
		).toHaveAttribute("aria-pressed", "true");
	}
	await page.screenshot({
		path: testInfo.outputPath("analytics-range.png"),
		fullPage: true,
	});
});

for (const route of [
	"overview",
	"products",
	"products/new",
	"categories",
	"collections",
	"orders",
	"transactions",
	"users",
	"organizations",
	"landing",
	"analytics",
	"settings",
]) {
	test(`admin route /${route} loads without runtime errors`, async ({
		page,
	}, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		await signIn(page);
		const response = await page.goto(`/admin/${route}`);
		expect(response?.ok()).toBeTruthy();
		await expect(
			route === "organizations"
				? page.getByRole("heading", {
						name: "Manage organizations",
						exact: true,
					})
				: page.locator("h1").first(),
		).toBeVisible();
		await expect(
			page.getByText(
				"Application error: a server-side exception has occurred",
				{ exact: false },
			),
		).toHaveCount(0);
		await page.screenshot({
			path: testInfo.outputPath(
				`admin-${route.replaceAll("/", "-")}.png`,
			),
			fullPage: true,
		});
		expect(errors).toEqual([]);
	});
}
