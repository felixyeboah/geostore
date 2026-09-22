import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect as baseExpect, test } from "@playwright/test";
import { chooseAdminOption } from "./helpers";

const expect = baseExpect.configure({ timeout: 30_000 });
// Full Chromium avoids headless-shell crashes during repeated RSC navigation.
test.use({ channel: "chromium" });

const prefix = `qa-lists-${randomUUID()}`;
const names = Array.from(
	{ length: 27 },
	(_, index) => `${prefix}-${String(index).padStart(2, "0")}`,
);
function client() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is required for list fixtures");
	}
	return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}
test.beforeAll(async () => {
	const db = client();
	try {
		await db.batch(
			[
				{
					sql: "INSERT INTO store_category (id, name, slug, updatedAt) VALUES (?, ?, ?, ?)",
					args: [prefix, prefix, prefix, Date.now()],
				},
				...names.flatMap((name, index) => [
					{
						sql: "INSERT INTO store_product (id, name, slug, description, brand, sku, categoryId, priceInPesewas, status, stockQuantity, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
						args: [
							name,
							name,
							name,
							prefix,
							prefix,
							name,
							prefix,
							100 + index,
							index % 2 ? "DRAFT" : "ARCHIVED",
							index,
							Date.now(),
						],
					},
					{
						sql: "INSERT INTO store_order (id, orderNumber, paymentMethod, subtotalInPesewas, deliveryInPesewas, totalInPesewas, customerEmail, customerPhone, shippingAddress, status, updatedAt) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)",
						args: [
							name,
							name,
							"MOCK",
							100 + index,
							100 + index,
							`${name}@example.test`,
							"0000000000",
							"{}",
							index % 2 ? "PENDING" : "CONFIRMED",
							Date.now(),
						],
					},
					{
						sql: "INSERT INTO store_transaction (id, orderId, reference, provider, paymentMethod, amountInPesewas, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
						args: [
							name,
							name,
							name,
							"mock",
							"MOCK",
							100 + index,
							index % 2 ? "PENDING" : "FAILED",
							Date.now(),
						],
					},
				]),
			],
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
			[
				...["store_transaction", "store_order", "store_product"].map(
					(table) => ({
						sql: `DELETE FROM ${table} WHERE id IN (${names.map(() => "?").join(",")})`,
						args: names,
					}),
				),
				{
					sql: "DELETE FROM store_category WHERE id = ?",
					args: [prefix],
				},
			],
			"write",
		);
	} finally {
		db.close();
	}
});

for (const surface of [
	{
		route: "products",
		sort: "price",
		label: "Price",
		facet: "Status",
		option: "Draft",
		filter: "DRAFT",
	},
	{
		route: "orders",
		sort: "total",
		label: "Total",
		facet: "Fulfilment",
		option: "Pending",
		filter: "PENDING",
	},
	{
		route: "transactions",
		sort: "amount",
		label: "Amount",
		facet: "Status",
		option: "Pending",
		filter: "PENDING",
	},
]) {
	test(`${surface.route} server pagination, sorting, facets and empty recovery`, async ({
		page,
	}, testInfo) => {
		const response = await page.request.post("/api/auth/sign-in/email", {
			data: { email: "qa-admin@geostore.test", password: "QaAdmin!2345" },
		});
		expect(response.ok()).toBeTruthy();
		await page.goto(
			`/admin/${surface.route}?q=${prefix}&sort=${surface.sort}&dir=asc`,
		);
		await expect(
			page.getByText("Page 1 of 2", { exact: true }),
		).toBeVisible({ timeout: 30_000 });
		const rows = page.locator("tbody tr");
		await expect(rows).toHaveCount(25);
		await expect(rows.first()).toContainText(names[0]);
		await page.getByRole("button", { name: "Next", exact: true }).click();
		await expect(
			page.getByText("Page 2 of 2", { exact: true }),
		).toBeVisible();
		await expect(rows).toHaveCount(2);
		await expect(rows.first()).toContainText(names[25]);
		await page.reload();
		await expect(rows.first()).toContainText(names[25]);
		await page.goto(
			`/admin/${surface.route}?q=${prefix}&sort=${surface.sort}&dir=asc&page=999999`,
		);
		await expect(
			page.getByText("Page 2 of 2", { exact: true }),
		).toBeVisible();
		await page
			.getByRole("button", { name: surface.label, exact: true })
			.click();
		await expect(
			page.getByText("Page 1 of 2", { exact: true }),
		).toBeVisible();
		await expect(rows.first()).toContainText(names[26]);
		await chooseAdminOption(
			page,
			page.getByRole("combobox", { name: surface.facet, exact: true }),
			new RegExp(`^${surface.option} \\(13\\)$`),
		);
		await expect(page).toHaveURL(new RegExp(`status=${surface.filter}`));
		await expect(rows).toHaveCount(13);
		await expect(rows.first()).toContainText(names[25]);
		await page.getByRole("searchbox").fill(`${prefix}-absent`);
		await expect(
			page.getByText("Page 1 of 1", { exact: true }),
		).toBeVisible();
		await expect(rows.filter({ hasText: names[25] })).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: "Clear", exact: true }),
		).toBeVisible();
		await page.screenshot({
			path: testInfo.outputPath(`${surface.route}-empty.png`),
			fullPage: true,
		});
		await page.getByRole("button", { name: "Clear", exact: true }).click();
		await page.getByRole("searchbox").fill(prefix);
		await expect(
			page.getByText("Page 1 of 2", { exact: true }),
		).toBeVisible();
	});
}

test("admin picker body endpoints reject anonymous and non-admin callers", async ({
	playwright,
	baseURL,
}) => {
	for (const buyer of [false, true]) {
		const request = await playwright.request.newContext({ baseURL });
		try {
			if (buyer) {
				const login = await request.post("/api/auth/sign-in/email", {
					data: {
						email: "qa-buyer@geostore.test",
						password: "QaBuyer!2345",
					},
				});
				expect(login.ok()).toBeTruthy();
			}
			for (const endpoint of [
				"products/search",
				"collections/products",
			]) {
				const result = await request.post(
					`/api/rpc/admin/${endpoint}`,
					{ data: { json: { collectionId: prefix } } },
				);
				expect(result.status()).toBe(buyer ? 403 : 401);
			}
		} finally {
			await request.dispose();
		}
	}
});

test("product picker accepts more than 200 exclusion IDs and validates selected-summary bounds", async ({
	request,
}) => {
	const login = await request.post("/api/auth/sign-in/email", {
		data: { email: "qa-admin@geostore.test", password: "QaAdmin!2345" },
	});
	expect(login.ok()).toBeTruthy();
	const excludeIds = [
		...names,
		...Array.from(
			{ length: 174 },
			(_, index) => `${prefix}-excluded-${index}`,
		),
	];
	const result = await request.post("/api/rpc/admin/products/search", {
		data: { json: { query: prefix, excludeIds } },
	});
	expect(result.status()).toBe(200);
	const body = await result.json();
	expect(body.json.total).toBe(0);
	expect(body.json.products).toEqual([]);
	const invalid = await request.post("/api/rpc/admin/products/search", {
		data: { json: { ids: excludeIds } },
	});
	expect(invalid.status()).toBe(400);
});
