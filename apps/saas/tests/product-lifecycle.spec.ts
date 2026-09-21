import { createClient } from "@libsql/client";
import { expect, test } from "@playwright/test";
import { chooseAdminOption } from "./helpers";

const db = createClient({
	url: process.env.DATABASE_URL ?? "",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});
const slug = `qa-product-lifecycle-${Date.now().toString(36)}`;
const name = `QA Product Lifecycle ${slug}`;
const storefront =
	process.env.PLAYWRIGHT_STOREFRONT_URL ?? "http://localhost:3001";

async function readProduct() {
	const { rows } = await db.execute({
		sql: 'SELECT id, status, "publishedAt", "compareAtInPesewas", "stockQuantity" FROM store_product WHERE slug = ?',
		args: [slug],
	});
	return rows[0];
}

// Only this run's fixture is removed, including after an interrupted journey.
test.afterAll(async () => {
	const product = await readProduct();
	if (product) {
		await db.batch(
			[
				{
					sql: 'DELETE FROM store_product_image WHERE "productId" = ?',
					args: [product.id],
				},
				{
					sql: 'DELETE FROM store_product_variant WHERE "productId" = ?',
					args: [product.id],
				},
				{
					sql: "DELETE FROM store_product WHERE id = ?",
					args: [product.id],
				},
			],
			"write",
		);
	}
	db.close();
});

test("admin creates, publishes, updates variants, pauses and deletes a product", async ({
	page,
	request,
}) => {
	test.setTimeout(180_000);
	await page.goto("/login");
	await page
		.getByRole("textbox", { name: "Email" })
		.fill("qa-admin@geostore.test");
	await page
		.locator('input[autocomplete="current-password"]')
		.fill("QaAdmin!2345");
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await page.waitForURL((url) => !url.pathname.startsWith("/login"));
	await page.goto("/admin/products/new");
	const form = page.locator("form");
	await form.getByLabel("Name", { exact: true }).fill(name);
	await form.getByRole("button", { name: "Change", exact: true }).click();
	await form.getByLabel("URL slug").fill(slug);
	await form.getByLabel("Brand").fill("QA Labs");
	await chooseAdminOption(
		page,
		form.getByLabel("Department"),
		"Phones & tablets",
	);
	await form
		.getByLabel("Summary")
		.fill("A product created for lifecycle verification.");
	await form
		.getByLabel("Description", { exact: true })
		.fill(
			"A disposable product used to verify the complete admin product lifecycle.",
		);
	await form
		.locator("#photos")
		.getByRole("button", { name: "Paste image URLs instead" })
		.click();
	await form
		.locator("#photos")
		.getByLabel("Product image URLs")
		.fill("https://images.unsplash.com/photo-1505740420928-5e560c06d30e");
	await form.getByLabel("Price (GH₵)", { exact: true }).fill("125.50");
	await form.getByLabel("Was price (GH₵)").fill("150");
	await form.getByLabel("Product code (SKU)", { exact: true }).fill(slug);
	await form.getByLabel("In stock", { exact: true }).fill("0");
	await page.getByRole("button", { name: "Save draft", exact: true }).click();
	await page.waitForURL("**/admin/products");
	const product = await readProduct();
	expect(product).toBeDefined();
	expect(product.status).toBe("DRAFT");
	expect(product.publishedAt).toBeNull();
	expect((await request.get(`${storefront}/products/${slug}`)).status()).toBe(
		404,
	);

	await page.goto(`/admin/products/${product.id}`);
	await form.getByLabel("Was price (GH₵)").fill("");
	await chooseAdminOption(
		page,
		form.getByLabel("Status", { exact: true }),
		"Active — on the shop",
	);
	await expect(
		page.getByRole("button", { name: "Save changes" }),
	).toBeEnabled();
	await page.getByRole("button", { name: "Save changes" }).click();
	await page.waitForURL("**/admin/products");
	expect((await readProduct()).status).toBe("ACTIVE");
	expect((await readProduct()).compareAtInPesewas).toBeNull();
	expect((await request.get(`${storefront}/products/${slug}`)).status()).toBe(
		200,
	);

	await page.goto(`/admin/products/${product.id}`);
	await form.getByText("Comes in options", { exact: true }).click();
	const option = form.getByTestId("option-0");
	await option.getByLabel("Option name").fill("Storage");
	for (const value of ["128 GB", "256 GB"]) {
		await option.getByLabel("Option values").fill(value);
		await option.getByLabel("Option values").press("Enter");
	}
	for (let index = 0; index < 2; index++) {
		await form
			.locator(`input[name="variants.${index}.stockQuantity"]`)
			.fill(String(index + 2));
	}
	await page.getByRole("button", { name: "Save changes" }).click();
	await page.waitForURL("**/admin/products");
	const before = await db.execute({
		sql: 'SELECT id, sku FROM store_product_variant WHERE "productId" = ? ORDER BY sku',
		args: [product.id],
	});
	expect(before.rows).toHaveLength(2);
	expect((await readProduct()).stockQuantity).toBe(5);

	await page.goto(`/admin/products/${product.id}`);
	await form
		.locator('input[name="variants.0.priceInPesewas"]')
		.fill("140.25");
	await form.locator('input[name="variants.0.stockQuantity"]').fill("7");
	await form
		.getByTestId("option-0")
		.getByLabel("Option values")
		.fill("512 GB");
	await form
		.getByTestId("option-0")
		.getByLabel("Option values")
		.press("Enter");
	await form.getByTestId("variant-2").getByRole("switch").click();
	await page.getByRole("button", { name: "Save changes" }).click();
	await page.waitForURL("**/admin/products");
	const after = await db.execute({
		sql: 'SELECT id, sku, "priceInPesewas", "stockQuantity", "isActive" FROM store_product_variant WHERE "productId" = ? ORDER BY sku',
		args: [product.id],
	});
	expect(after.rows).toHaveLength(3);
	expect(after.rows.slice(0, 2).map((row) => row.id)).toEqual(
		before.rows.map((row) => row.id),
	);
	expect(after.rows[0].priceInPesewas).toBe(14025);
	expect(after.rows[0].stockQuantity).toBe(7);
	expect(after.rows[2].isActive).toBe(0);
	expect((await readProduct()).stockQuantity).toBe(10);

	// The edit form must honor Draft instead of silently publishing again.
	await page.goto(`/admin/products/${product.id}`);
	await chooseAdminOption(
		page,
		form.getByLabel("Status", { exact: true }),
		"Draft — hidden from shop",
	);
	await page.getByRole("button", { name: "Save changes" }).click();
	await page.waitForURL("**/admin/products");
	expect((await readProduct()).status).toBe("DRAFT");
	expect((await readProduct()).publishedAt).toBeNull();
	expect((await request.get(`${storefront}/products/${slug}`)).status()).toBe(
		404,
	);

	await page.goto(`/admin/products?q=${encodeURIComponent(slug)}`);
	await page
		.getByRole("button", { name: `Actions for ${name}`, exact: true })
		.click();
	await page
		.getByRole("menuitem", { name: "Delete product", exact: true })
		.click();
	await page
		.getByRole("alertdialog")
		.getByRole("button", { name: "Delete product", exact: true })
		.click();
	await expect.poll(readProduct).toBeUndefined();
	for (const table of ["store_product_image", "store_product_variant"]) {
		const result = await db.execute({
			sql: `SELECT COUNT(*) AS count FROM ${table} WHERE "productId" = ?`,
			args: [product.id],
		});
		expect(result.rows[0].count).toBe(0);
	}
});
