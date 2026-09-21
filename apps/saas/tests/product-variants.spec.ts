import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";
import { chooseAdminOption } from "./helpers";

/**
 * End-to-end coverage for structured variant options: an admin builds a
 * phone with Colour × Storage combinations, a shopper picks one on the
 * storefront, and the order records exactly that combination — its derived
 * name, its price, and its own stock count.
 */
const STOREFRONT =
	process.env.PLAYWRIGHT_STOREFRONT_URL ?? "http://localhost:3001";

const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };

const RUN_ID = (process.env.QA_VARIANTS_RUN_ID ?? Date.now().toString(36))
	.toLowerCase()
	.replace(/[^a-z0-9]/g, "");

const PRODUCT_NAME = `QA Variant Phone ${RUN_ID}`;
const PRODUCT_SLUG = `qa-variant-phone-${RUN_ID}`;
const SKU_PREFIX = `QA-VP-${RUN_ID}`.toUpperCase();

// Black 128 GB (GH₵ 900, in stock), Black 256 GB (GH₵ 1,100, low stock),
// White 128 GB (out of stock). White × 256 GB deliberately does not exist —
// it is the unavailable combination the picker must disable.
const VARIANTS = [
	{
		sku: `${SKU_PREFIX}-B128`,
		price: "900",
		stock: "5",
		colour: "Black",
		storage: "128 GB",
	},
	{
		sku: `${SKU_PREFIX}-B256`,
		price: "1100",
		stock: "3",
		colour: "Black",
		storage: "256 GB",
	},
	{
		sku: `${SKU_PREFIX}-W128`,
		price: "900",
		stock: "0",
		colour: "White",
		storage: "128 GB",
	},
];

const db = createClient({
	url: process.env.DATABASE_URL ?? "",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function sql(query: string): Promise<string> {
	const { rows } = await db.execute(query);
	return rows.map((row) => Object.values(row).join("|")).join("\n");
}

async function signIn(page: Page, user: { email: string; password: string }) {
	await page.goto("/login");
	await page.getByRole("textbox", { name: "Email" }).fill(user.email);
	await page
		.locator('input[autocomplete="current-password"]')
		.fill(user.password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
		timeout: 90_000,
	});
}

/** Fills one option pair (e.g. Colour → Black) on a variant row. */
async function fillOption(
	row: ReturnType<Page["getByTestId"]>,
	name: string,
	value: string,
) {
	await row.getByRole("button", { name: "+ Add option" }).click();
	const pair = row.locator("li").last();
	await pair.getByLabel("Option name").fill(name);
	await pair.getByLabel("Option value").fill(value);
}

test.describe.configure({ mode: "serial" });

test.describe("structured product variants", () => {
	test("admin creates a phone with colour and storage options", async ({
		page,
	}) => {
		await signIn(page, ADMIN);
		await page.goto("/admin/products?new=true");
		await expect(
			page.getByRole("heading", { name: "Add product" }),
		).toBeVisible({ timeout: 30_000 });

		const main = page.locator("form");
		await main
			.getByLabel("Name", { exact: true })
			.first()
			.fill(PRODUCT_NAME);
		await main.getByLabel("URL slug").fill(PRODUCT_SLUG);
		await main.getByLabel("Brand").fill("QA Labs");
		await main.getByLabel("SKU", { exact: true }).first().fill(SKU_PREFIX);
		await main
			.getByLabel("Short description")
			.fill("A QA fixture phone with colour and storage options.");
		await main
			.getByLabel("Full description")
			.fill(
				"This product exists only so the automated QA suite can exercise variant options end to end.",
			);
		await main
			.getByLabel("Product image URLs")
			.fill(
				"https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
			);
		await chooseAdminOption(page, main.getByLabel("Status"), "Active");
		await chooseAdminOption(
			page,
			main.getByLabel("Category"),
			"Phones & tablets",
		);
		await main
			.getByLabel("Price (GH₵)", { exact: true })
			.first()
			.fill("900");
		await main.getByLabel("On-hand quantity").fill("5");

		for (const [index, variant] of VARIANTS.entries()) {
			await page.getByRole("button", { name: "Add variant" }).click();
			const row = page.getByTestId(`variant-${index}`);
			// The name stays blank on purpose — the option values should
			// become the variant's label everywhere downstream.
			await row
				.locator(`input[name="variants.${index}.sku"]`)
				.fill(variant.sku);
			await row
				.locator(`input[name="variants.${index}.priceInPesewas"]`)
				.fill(variant.price);
			await row
				.locator(`input[name="variants.${index}.stockQuantity"]`)
				.fill(variant.stock);
			await fillOption(row, "Colour", variant.colour);
			await fillOption(row, "Storage", variant.storage);
		}

		await page.getByRole("button", { name: "Save product" }).click();
		await expect(
			page.getByText(/Product created|created/i).first(),
		).toBeVisible({ timeout: 15_000 });

		// Derived names and structured attributes both landed on the rows.
		const stored = await sql(
			`SELECT name, attributes, "stockQuantity" FROM store_product_variant
			 WHERE "productId" = (SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}')
			 ORDER BY name`,
		);
		expect(stored).toContain("Black · 128 GB");
		expect(stored).toContain("Black · 256 GB");
		expect(stored).toContain("White · 128 GB");
		expect(
			await sql(
				`SELECT name FROM store_product_variant
				 WHERE "productId" = (SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}')
				   AND json_extract(attributes, '$.colour') = 'Black'
				   AND json_extract(attributes, '$.storage') = '256 GB'`,
			),
		).toBe("Black · 256 GB");
	});

	test("the card shows options and the product page resolves combinations", async ({
		page,
	}) => {
		await page.goto(`${STOREFRONT}/shop`);
		const card = page
			.locator("article")
			.filter({ hasText: PRODUCT_NAME })
			.first();
		await expect(card).toBeVisible({ timeout: 30_000 });
		await expect(
			card.getByRole("link", { name: "Choose options" }),
		).toBeVisible();
		await expect(card.getByText("2 colours · 2 storages")).toBeVisible();
		// Quick-add would have to guess the combination, so it is gone.
		await expect(
			card.getByRole("button", { name: "Add to bag" }),
		).toHaveCount(0);

		await card.getByRole("link", { name: "Choose options" }).click();
		await page.waitForURL(`**/products/${PRODUCT_SLUG}`, {
			timeout: 30_000,
		});
		await expect(
			page.getByRole("heading", { name: PRODUCT_NAME, level: 1 }),
		).toBeVisible({ timeout: 30_000 });

		// Default pick is the first in-stock combination: Black · 128 GB.
		await expect(page.getByText("Colour — Black")).toBeVisible();
		await expect(page.getByText("Storage — 128 GB")).toBeVisible();
		await expect(page.getByText("GH₵ 900").first()).toBeVisible();

		// Black × 256 GB exists and reprices the buy box.
		await page.getByRole("button", { name: "256 GB" }).click();
		await expect(page.getByText("Storage — 256 GB")).toBeVisible();
		await expect(page.getByText("GH₵ 1,100").first()).toBeVisible();
		await expect(page.getByText("Only 3 left")).toBeVisible();

		// Every White variant is sold out, so White is struck through.
		// Picking it re-resolves Storage: White × 256 GB was never created,
		// so the pick lands on the only White combination that exists.
		const white = page.getByRole("button", { name: "White" });
		await expect(white).toHaveClass(/line-through/);
		await white.click();
		await expect(page.getByText("Colour — White")).toBeVisible();
		await expect(page.getByText("Storage — 128 GB")).toBeVisible();
		await expect(page.getByText("Out of stock").first()).toBeVisible();
		// .first() — related-product cards further down the page carry their
		// own add-to-bag buttons.
		await expect(
			page.getByRole("button", { name: "Out of stock" }).first(),
		).toBeDisabled();

		// Back to a sellable combination before the journey ends.
		await page.getByRole("button", { name: "Black" }).click();
		await page.getByRole("button", { name: "256 GB" }).click();
		await expect(page.getByText("GH₵ 1,100").first()).toBeVisible();
		await expect(
			page
				.getByRole("button", { name: "Add to bag", exact: true })
				.first(),
		).toBeEnabled();
	});

	test("the chosen combination reaches the bag, checkout and order record", async ({
		page,
	}) => {
		const guestEmail = `qa-variant+${Date.now()}@geostore.test`;

		await page.goto(`${STOREFRONT}/products/${PRODUCT_SLUG}`);
		await expect(
			page.getByRole("heading", { name: PRODUCT_NAME, level: 1 }),
		).toBeVisible({ timeout: 30_000 });
		await page.getByRole("button", { name: "256 GB" }).click();
		await page
			.getByRole("button", { name: "Add to bag", exact: true })
			.first()
			.click();
		await expect(
			page.getByRole("button", { name: "Added to bag" }).first(),
		).toBeVisible();

		await page.goto(`${STOREFRONT}/cart`);
		await expect(
			page.getByRole("heading", { name: "Your bag" }),
		).toBeVisible();
		await expect(page.getByText("· Black · 256 GB").first()).toBeVisible();

		await page.goto(`${STOREFRONT}/checkout`);
		await page
			.getByRole("textbox", { name: "Full name" })
			.fill("QA Variant");
		await page
			.getByRole("textbox", { name: "Email address" })
			.fill(guestEmail);
		await page
			.getByRole("textbox", { name: "Phone number" })
			.fill("0240000007");
		await page
			.getByRole("textbox", { name: "Street address or landmark" })
			.fill("7 Variant Avenue");
		await page.getByRole("textbox", { name: "Town or city" }).fill("Accra");
		await page
			.getByRole("textbox", { name: "Region" })
			.fill("Greater Accra");
		await page.getByRole("button", { name: /Place order/ }).click();

		await expect(page.getByText(/Order GST-/)).toBeVisible({
			timeout: 60_000,
		});
		const confirmation = await page
			.getByText(/Order GST-/)
			.first()
			.innerText();
		const orderNumber = /GST-[0-9A-Z-]+/.exec(confirmation)?.[0];
		expect(orderNumber, "order number on the confirmation").toBeTruthy();

		// The order line names the combination and charges its own price.
		expect(
			await sql(
				`SELECT "variantName", "unitPriceInPesewas" FROM store_order_item
				 WHERE "orderId" = (SELECT id FROM store_order WHERE "orderNumber" = '${orderNumber}')`,
			),
		).toBe("Black · 256 GB|110000");

		// Only the bought combination lost stock — Black · 128 GB is untouched.
		const stockRows = await sql(
			`SELECT sku, "stockQuantity" FROM store_product_variant
			 WHERE "productId" = (SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}')
			 ORDER BY sku`,
		);
		expect(stockRows).toContain(`${SKU_PREFIX}-B128|5`);
		expect(stockRows).toContain(`${SKU_PREFIX}-B256|2`);
		expect(stockRows).toContain(`${SKU_PREFIX}-W128|0`);

		// And the back office can see which option the customer bought.
		await signIn(page, ADMIN);
		await page.goto("/admin/orders");
		await expect(page.getByText(orderNumber as string)).toBeVisible({
			timeout: 30_000,
		});
	});
});

test.afterAll(async () => {
	try {
		const productId = await sql(
			`SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}'`,
		);
		if (productId.trim()) {
			const orderIds = (
				await sql(
					`SELECT DISTINCT "orderId" FROM store_order_item WHERE "productId" = '${productId.trim()}'`,
				)
			)
				.split("\n")
				.map((id) => id.trim())
				.filter(Boolean);

			if (orderIds.length > 0) {
				const list = orderIds.map((id) => `'${id}'`).join(",");
				await sql(
					`DELETE FROM store_order_item WHERE "orderId" IN (${list})`,
				);
				await sql(
					`DELETE FROM store_order_status_event WHERE "orderId" IN (${list})`,
				);
				await sql(
					`DELETE FROM store_transaction WHERE "orderId" IN (${list})`,
				);
				await sql(`DELETE FROM store_order WHERE id IN (${list})`);
			}

			await sql(
				`DELETE FROM store_inventory_event WHERE "productId" = '${productId.trim()}'`,
			);
			await sql(
				`DELETE FROM store_product_variant WHERE "productId" = '${productId.trim()}'`,
			);
			await sql(
				`DELETE FROM store_product_image WHERE "productId" = '${productId.trim()}'`,
			);
			await sql(
				`DELETE FROM store_review WHERE "productId" = '${productId.trim()}'`,
			);
			await sql(
				`DELETE FROM store_product WHERE id = '${productId.trim()}'`,
			);
		}
	} catch (error) {
		console.warn("[product-variants] teardown failed:", error);
	} finally {
		db.close();
	}
});
