import { createClient } from "@libsql/client";
import { expect, type Locator, type Page, test } from "@playwright/test";
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

// Per-colour media: Black carries a swatch hex plus two shots, White carries
// one shot and relies on the built-in swatch table.
const BASE_IMAGE =
	"https://images.unsplash.com/photo-1505740420928-5e560c06d30e";
const BLACK_IMAGES = [
	"https://images.unsplash.com/photo-1592286927505-1def25115558",
	"https://images.unsplash.com/photo-1524226108234-3cccbbbfa86d",
];
const WHITE_IMAGES = [
	"https://images.unsplash.com/photo-1561154464-82e9adf32764",
];
const BLACK_HEX = "#112233";

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

/**
 * Defines one option on the editor — a name plus its values, entered as
 * chips. The editor opens with one blank option row, so only the second and
 * later options need the "Add another option" click. The combinations table
 * underneath regenerates itself.
 */
async function addOption(
	page: Page,
	index: number,
	name: string,
	values: string[],
) {
	if (index > 0) {
		await page
			.getByRole("button", { name: /Add (another|an) option/ })
			.click();
	}
	const card = page.getByTestId(`option-${index}`);
	await card.getByLabel("Option name").fill(name);
	for (const value of values) {
		await card.getByLabel("Option values").fill(value);
		await card.getByLabel("Option values").press("Enter");
	}
	return card;
}

/**
 * Photos are dropped onto the form in normal use; the seeded URLs the suite
 * relies on go through the "Paste image URLs instead" disclosure, which
 * exists on the main gallery and on every colour's row.
 */
async function pasteImageUrls(scope: Locator, urls: string[]) {
	await scope
		.getByRole("button", { name: "Paste image URLs instead" })
		.click();
	await scope.getByLabel("Product image URLs").fill(urls.join("\n"));
}

test.describe.configure({ mode: "serial" });

test.describe("structured product variants", () => {
	test("admin creates a phone with colour and storage options", async ({
		page,
	}) => {
		await signIn(page, ADMIN);
		await page.goto("/admin/products/new");
		await expect(
			page.getByRole("heading", { name: "Add product" }),
		).toBeVisible({ timeout: 30_000 });

		const main = page.locator("form");
		await main.getByLabel("Name", { exact: true }).fill(PRODUCT_NAME);
		// The slug follows the name; "Change" opens it for editing.
		await main.getByRole("button", { name: "Change" }).click();
		await main.getByLabel("URL slug").fill(PRODUCT_SLUG);
		await main.getByLabel("Brand").fill("QA Labs");
		await chooseAdminOption(
			page,
			main.getByLabel("Department"),
			"Phones & tablets",
		);
		await chooseAdminOption(page, main.getByLabel("Condition"), "Used");
		await main
			.getByLabel("Summary")
			.fill("A QA fixture phone with colour and storage options.");
		await main
			.getByLabel("Description", { exact: true })
			.fill(
				"This product exists only so the automated QA suite can exercise variant options end to end.",
			);
		await pasteImageUrls(main.locator("#photos"), [BASE_IMAGE]);

		// It comes in options: the price and code become the starting values
		// every combination inherits.
		await main.getByText("Comes in options", { exact: true }).click();
		await main.getByLabel("Starting price (GH₵)").fill("900");
		await main.getByLabel("Base product code (SKU)").fill(SKU_PREFIX);

		// Options-first: Colour × Storage generates the table itself. The
		// combinations come out ordered Black × sizes, then White × sizes.
		await addOption(page, 0, "Colour", ["Black", "White"]);
		await addOption(page, 1, "Storage", ["128 GB", "256 GB"]);

		for (const [index, variant] of VARIANTS.entries()) {
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
		}
		// White × 256 GB is the combination the picker must not offer — it
		// stays in the table but is switched off.
		await page.getByTestId("variant-3").getByRole("switch").click();

		// "Photos for each colour" lists every colour with its swatch and its
		// own gallery: Black takes a swatch hex plus two shots, White gets one
		// shot and relies on the built-in swatch table.
		const blackMedia = page.getByTestId("option-0-value-0-media");
		await blackMedia.getByLabel("Swatch hex").fill(BLACK_HEX);
		await pasteImageUrls(blackMedia, BLACK_IMAGES);
		const whiteMedia = page.getByTestId("option-0-value-1-media");
		await pasteImageUrls(whiteMedia, WHITE_IMAGES);

		// Publish saves it as Active in one step.
		await page.getByRole("button", { name: "Publish" }).click();
		await expect(
			page.getByText(/Product created|created/i).first(),
		).toBeVisible({ timeout: 15_000 });

		// The product row records its condition too.
		expect(
			await sql(
				`SELECT "condition" FROM store_product WHERE slug = '${PRODUCT_SLUG}'`,
			),
		).toBe("USED");

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

		// The colour shots land tagged on the image rows, and the hex lands
		// in the product's option styles — normalised to the lowercase axis.
		expect(
			await sql(
				`SELECT "optionAxis", "optionValue", COUNT(*) FROM store_product_image
				 WHERE "productId" = (SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}')
				   AND "optionAxis" IS NOT NULL
				 GROUP BY "optionAxis", "optionValue" ORDER BY "optionValue"`,
			),
		).toBe("colour|Black|2\ncolour|White|1");
		expect(
			await sql(
				`SELECT json_extract(optionStyles, '$[0].axis'),
						json_extract(optionStyles, '$[0].value'),
						json_extract(optionStyles, '$[0].hex')
				 FROM store_product WHERE slug = '${PRODUCT_SLUG}'`,
			),
		).toBe(`colour|Black|${BLACK_HEX}`);
	});

	test("admin edit reads back media and persists condition changes", async ({
		page,
	}) => {
		// Fresh context for the heavy editor page — the create journey's
		// session ends here so the renderer starts clean.
		await signIn(page, ADMIN);
		const productId = await sql(
			`SELECT id FROM store_product WHERE slug = '${PRODUCT_SLUG}'`,
		);
		await page.goto(`/admin/products/${productId.trim()}`);
		const editForm = page.locator("form");
		await expect(editForm.getByLabel("Condition")).toContainText("Used", {
			timeout: 30_000,
		});

		// Option media survives the round trip: the Colour option reads back
		// both values, and Black's row shows its swatch hex and shots.
		const colourCard = editForm.getByTestId("option-0");
		await expect(colourCard.getByLabel("Option name")).toHaveValue(
			"Colour",
		);
		const blackMedia = editForm.getByTestId("option-0-value-0-media");
		await expect(blackMedia.getByLabel("Swatch hex")).toHaveValue(
			BLACK_HEX,
		);
		await blackMedia
			.getByRole("button", { name: "Paste image URLs instead" })
			.click();
		await expect(blackMedia.getByLabel("Product image URLs")).toHaveValue(
			BLACK_IMAGES.join("\n"),
		);
		// White reads back its shot and no hex — the name table supplies
		// the swatch.
		const whiteMedia = editForm.getByTestId("option-0-value-1-media");
		await expect(whiteMedia.getByLabel("Swatch hex")).toHaveValue("");
		await whiteMedia
			.getByRole("button", { name: "Paste image URLs instead" })
			.click();
		await expect(whiteMedia.getByLabel("Product image URLs")).toHaveValue(
			WHITE_IMAGES.join("\n"),
		);

		// The stored condition is read back too — and saving a change
		// persists. It goes back to Used because the later tests expect it.
		await chooseAdminOption(
			page,
			editForm.getByLabel("Condition"),
			"Refurbished",
		);
		await page.getByRole("button", { name: "Save changes" }).click();
		await expect(
			page.getByText(/Product updated|updated/i).first(),
		).toBeVisible({ timeout: 15_000 });
		await expect
			.poll(() =>
				sql(
					`SELECT "condition" FROM store_product WHERE slug = '${PRODUCT_SLUG}'`,
				),
			)
			.toBe("REFURBISHED");

		// The write path is proven; flipping back to Used is fixture hygiene
		// for the storefront tests, not a second trip through the editor.
		await sql(
			`UPDATE store_product SET "condition" = 'USED' WHERE slug = '${PRODUCT_SLUG}'`,
		);
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
		await expect(card.getByText(/· Used/)).toBeVisible();
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

		// The listing announces its condition beside the brand.
		await expect(page.getByText("QA Labs · Used")).toBeVisible();

		// Default pick is the first in-stock combination: Black · 128 GB.
		await expect(page.getByText("Colour — Black")).toBeVisible();
		await expect(page.getByText("Storage — 128 GB")).toBeVisible();
		await expect(page.getByText("GH₵ 900").first()).toBeVisible();

		// The saved hex drives the swatch — #112233 renders as rgb(17,34,51) —
		// and the gallery opens on Black's two shots plus the generic photo.
		const blackSwatch = page
			.getByRole("button", { name: "Black", exact: true })
			.locator("span");
		await expect(blackSwatch).toHaveCSS(
			"background-color",
			"rgb(17, 34, 51)",
		);
		const thumbs = page.locator(
			`ul[aria-label="${PRODUCT_NAME} images"] li`,
		);
		await expect(thumbs).toHaveCount(3);
		const mainImage = page.locator(`img[alt="${PRODUCT_NAME}"]`).first();
		await expect(mainImage).toHaveAttribute("src", /1592286927505/);

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
		// White owns one shot — the gallery swaps to it plus the generic photo.
		await expect(thumbs).toHaveCount(2);
		await expect(mainImage).toHaveAttribute("src", /1561154464/);
		await expect(page.getByText("Out of stock").first()).toBeVisible();
		// .first() — related-product cards further down the page carry their
		// own add-to-bag buttons.
		await expect(
			page.getByRole("button", { name: "Out of stock" }).first(),
		).toBeDisabled();

		// Back to a sellable combination before the journey ends — and back to
		// Black's gallery.
		await page.getByRole("button", { name: "Black" }).click();
		await page.getByRole("button", { name: "256 GB" }).click();
		await expect(page.getByText("GH₵ 1,100").first()).toBeVisible();
		await expect(thumbs).toHaveCount(3);
		await expect(mainImage).toHaveAttribute("src", /1592286927505/);
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
