import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";
import { LANDING_SECTIONS } from "@repo/commerce";

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

	// Put every section back to its shipped state first — published columns
	// AND the draft columns the editor stages into, so a run that stopped
	// mid-way does not leave a staged change the editor would open on.
	const reset = createClient({
		url: process.env.DATABASE_URL ?? "",
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	await reset.execute(
		'UPDATE landing_section SET "isVisible" = 1, settings = NULL, "draftIsVisible" = NULL, "draftSortOrder" = NULL, "draftSettings" = NULL',
	);
	for (const section of LANDING_SECTIONS) {
		await reset.execute({
			sql: 'UPDATE landing_section SET "sortOrder" = ? WHERE key = ?',
			args: [section.defaultSortOrder, section.key],
		});
	}
	reset.close();

	await signIn(page);
	await page.goto("/admin/landing", { waitUntil: "networkidle" });

	// Every control stages a draft — nothing reaches shoppers until the
	// banner's Publish button commits it.
	async function publish() {
		await page.getByRole("button", { name: "Publish changes" }).click();
		await expect(page.getByText(/Published \d+ changes?\./)).toBeVisible({
			timeout: 20_000,
		});
	}

	// 1. Copy override reaches the page. The editor is a sheet over the
	// preview, so the band has to be opened before its fields exist.
	await page.getByRole("button", { name: /^Hero/ }).click();
	await page.getByLabel("Headline, first line").fill(HERO_MARKER);
	await page.getByRole("button", { name: "Save band" }).click();
	await expect(
		page.getByText("Hero staged. Publish to make it live."),
	).toBeVisible({ timeout: 20_000 });
	await publish();
	await expectStorefront(request, "hero override reaches the page").toContain(
		HERO_MARKER,
	);

	// 2. A second section, so the hide check has something unique to look for.
	await page.getByRole("button", { name: /^Brand line/ }).click();
	await page.getByLabel("First line").fill(BRAND_MARKER);
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
		page.getByText("Brand line will be hidden. Publish to make it live."),
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
		page.getByText("Brand line will show. Publish to make it live."),
	).toBeVisible({ timeout: 20_000 });
	await publish();
	await expectStorefront(request, "showing brings the band back").toContain(
		BRAND_MARKER,
	);

	// 5. Reordering is persisted. A staged order shows no toast — the
	// banner's Publish button is the signal the draft took it.
	await page.getByRole("button", { name: "Move Brand line up" }).click();
	await expect(
		page.getByRole("button", { name: "Publish changes" }),
	).toBeVisible({ timeout: 20_000 });
	await publish();

	const db = createClient({
		url: process.env.DATABASE_URL ?? "",
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	const { rows } = await db.execute(
		'SELECT key, "sortOrder" FROM landing_section ORDER BY "sortOrder" ASC',
	);
	db.close();
	const order = rows.map((row) => String(row.key));
	expect(
		order.indexOf("brands"),
		"Brand line should now sit above the delivery strip",
	).toBeLessThan(order.indexOf("trust"));

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
		await expect(page.getByText(toast)).toBeVisible({ timeout: 20_000 });
		await publish();
	}

	await expectStorefront(request, "hero override cleared").not.toContain(
		HERO_MARKER,
	);
	await expectStorefront(request, "brand override cleared").not.toContain(
		BRAND_MARKER,
	);
	await expectStorefront(request, "the shipped copy is back").toContain(
		"we stock.",
	);
});
