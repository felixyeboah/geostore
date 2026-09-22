import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });

const prefix = `qa-taxonomy-${randomUUID()}`;
const names = Array.from(
	{ length: 27 },
	(_, index) => `${prefix}-${String(index).padStart(2, "0")}`,
);
function client() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is required for taxonomy fixtures");
	}
	return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}

test.afterEach(async ({ page }, testInfo) => {
	if (testInfo.status !== testInfo.expectedStatus) {
		await page.screenshot({
			path: testInfo.outputPath("failure.png"),
			fullPage: true,
		});
	}
});

test.beforeAll(async () => {
	const db = client();
	try {
		await db.batch(
			["store_category", "store_collection"].flatMap((table) =>
				names.map((name, index) => ({
					sql: `INSERT INTO "${table}" (id, name, slug, isActive, sortOrder, updatedAt) VALUES (?, ?, ?, ?, 0, ?)`,
					args: [name, name, name, index % 2, Date.now()],
				})),
			),
			"write",
		);
	} finally {
		db.close();
	}
});
test.afterAll(async () => {
	const db = client();
	try {
		await db.batch(
			["store_category", "store_collection"].map((table) => ({
				sql: `DELETE FROM "${table}" WHERE id IN (${names.map(() => "?").join(",")})`,
				args: names,
			})),
			"write",
		);
	} finally {
		db.close();
	}
});

for (const [route, noun] of [
	["categories", "departments"],
	["collections", "collections"],
] as const) {
	test(`${noun} search, paging, visibility and empty recovery reach the server`, async ({
		page,
	}, testInfo) => {
		await page.goto("/login");
		await page
			.getByRole("textbox", { name: "Email" })
			.fill("qa-admin@geostore.test");
		await page
			.locator('input[autocomplete="current-password"]')
			.fill("QaAdmin!2345");
		await page
			.getByRole("button", { name: "Sign in", exact: true })
			.click();
		await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
			timeout: 90_000,
		});
		await page.goto(`/admin/${route}?q=${prefix}`);
		await expect(
			page.getByText("Page 1 of 2", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: names[0], exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", {
				name: `Move ${names[0]} down`,
				exact: true,
			}),
		).toBeDisabled();
		await page.getByRole("button", { name: "Next", exact: true }).click();
		await expect(
			page.getByText("Page 2 of 2", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: names[26], exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: names[0], exact: true }),
		).toHaveCount(0);
		await page.screenshot({
			path: testInfo.outputPath("taxonomy-page.png"),
			fullPage: true,
		});
		await page.reload();
		await expect(
			page.getByText("Page 2 of 2", { exact: true }),
		).toBeVisible();
		await page.getByRole("combobox", { name: "Visibility" }).click();
		await page.getByRole("option", { name: "Hidden", exact: true }).click();
		await expect(
			page.getByText(`14 ${noun}`, { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Page 1 of 1", { exact: true }),
		).toBeVisible();
		await page
			.getByRole("searchbox", { name: `Search ${noun}` })
			.fill(`${prefix}-missing`);
		await expect(
			page.getByText(`0 ${noun}`, { exact: true }),
		).toBeVisible();
		await page
			.getByRole("searchbox", { name: `Search ${noun}` })
			.fill(prefix);
		await expect(
			page.getByText(`14 ${noun}`, { exact: true }),
		).toBeVisible();
	});
}

for (const [route, table] of [
	["categories", "store_category"],
	["collections", "store_collection"],
] as const) {
	test(`${route} reorder crosses a server page boundary`, async ({
		page,
	}, testInfo) => {
		const db = client();
		const snapshot = await db.execute(
			`SELECT id,name,sortOrder,updatedAt FROM "${table}" ORDER BY sortOrder,name,id`,
		);
		try {
			expect(
				(
					await page.request.post("/api/auth/sign-in/email", {
						data: {
							email: "qa-admin@geostore.test",
							password: "QaAdmin!2345",
						},
					})
				).ok(),
			).toBeTruthy();
			// A page-boundary fixture is guaranteed by the 27 fixture records.
			const index = snapshot.rows.findIndex(
				(row, position) =>
					names.includes(String(row.id)) &&
					position > 0 &&
					position % 25 === 0,
			);
			expect(index).toBeGreaterThan(0);
			const moving = snapshot.rows[index];
			const pageNumber = index / 25 + 1;
			await page.goto(`/admin/${route}?page=${pageNumber}`);
			const arrow = page.getByRole("button", {
				name: `Move ${moving.name} up`,
				exact: true,
			});
			await expect(arrow).toBeEnabled();
			await arrow.click();
			await expect(
				page.getByRole("button", {
					name: String(moving.name),
					exact: true,
				}),
			).toHaveCount(0);
			await page
				.getByRole("button", { name: "Previous", exact: true })
				.click();
			await expect(
				page.getByRole("button", {
					name: String(moving.name),
					exact: true,
				}),
			).toBeVisible();
			const reordered = await db.execute(
				`SELECT id FROM "${table}" ORDER BY sortOrder,name,id`,
			);
			const expected = snapshot.rows.map((row) => row.id);
			[expected[index - 1], expected[index]] = [
				expected[index],
				expected[index - 1],
			];
			expect(reordered.rows.map((row) => row.id)).toEqual(expected);
			await page.screenshot({
				path: testInfo.outputPath(`${route}-cross-page-move.png`),
				fullPage: true,
			});
		} finally {
			await db.batch(
				snapshot.rows.map((row) => ({
					sql: `UPDATE "${table}" SET sortOrder=?,updatedAt=? WHERE id=?`,
					args: [row.sortOrder, row.updatedAt, row.id],
				})),
				"write",
			);
			db.close();
		}
	});
}
