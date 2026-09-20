import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { chooseAdminOption } from "./helpers";

/**
 * The customer-facing storefront moved to the marketing app, so these journeys
 * span two origins. Cookies on localhost are shared across ports, which is what
 * keeps a session opened on the account app valid on the storefront.
 */
const STOREFRONT =
	process.env.PLAYWRIGHT_STOREFRONT_URL ?? "http://localhost:3001";

/**
 * Coverage for the buyer and admin paths the other suites do not touch: cart
 * mutation, the stock cap, the free-delivery boundary, signed-in order history,
 * admin stock and category edits, cancellation restock, and image-host
 * validation on the product form.
 *
 * Fixtures are seeded straight into Postgres so the assertions can be about
 * exact money amounts and exact stock numbers rather than whatever the seed
 * catalogue happens to hold.
 */

const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };

const RUN_ID = (process.env.QA_COVERAGE_RUN_ID ?? Date.now().toString(36))
	.toLowerCase()
	.replace(/[^a-z0-9]/g, "");

const PRODUCT_ID = `qacov${RUN_ID}`;
const PRODUCT_NAME = `QA Coverage Widget ${RUN_ID}`;
const PRODUCT_SLUG = `qa-coverage-widget-${RUN_ID}`;
const PRODUCT_SKU = `QA-COV-${RUN_ID}`.toUpperCase();

const CATEGORY_NAME = `QA Coverage Category ${RUN_ID}`;
const CATEGORY_SLUG = `qa-coverage-category-${RUN_ID}`;
const CATEGORY_RENAMED = `${CATEGORY_NAME} Edited`;

const REJECTED_SLUG = `qa-coverage-rejected-${RUN_ID}`;
const REJECTED_SKU = `QA-REJ-${RUN_ID}`.toUpperCase();
const DISALLOWED_IMAGE_URL = "https://images.evil-example.com/x.png";

const BASE_PRICE_IN_PESEWAS = 50_000; // GH₵ 500
const SEED_STOCK = 2;

function sql(query: string): string {
	return execFileSync(
		"docker",
		[
			"exec",
			"geostore-postgres",
			"psql",
			"-U",
			"postgres",
			"-d",
			"geostore",
			"-v",
			"ON_ERROR_STOP=1",
			"-t",
			"-A",
			"-c",
			query,
		],
		{ encoding: "utf8" },
	).trim();
}

function readProductStock(): number {
	return Number(
		sql(
			`SELECT "stockQuantity" FROM store_product WHERE id = '${PRODUCT_ID}'`,
		),
	);
}

function setProduct(fields: string) {
	sql(`UPDATE store_product SET ${fields} WHERE id = '${PRODUCT_ID}'`);
}

async function signIn(page: Page, user: { email: string; password: string }) {
	await page.goto("/login");
	await page.getByRole("textbox", { name: "Email" }).fill(user.email);
	await page
		.locator('input[autocomplete="current-password"]')
		.fill(user.password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	// Generous because the first hit on an authenticated route in a dev server
	// pays for a cold compile.
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
		timeout: 90_000,
	});
}

async function addSeededProductToBag(page: Page) {
	await page.goto(`${STOREFRONT}/products/${PRODUCT_SLUG}`);
	await expect(
		page.getByRole("heading", { name: PRODUCT_NAME, level: 1 }),
	).toBeVisible();
	const addToBag = page
		.getByRole("button", { name: "Add to bag", exact: true })
		.first();
	await expect(addToBag).toBeEnabled();
	await addToBag.click();
	await expect(
		page.getByRole("button", { name: "Added to bag" }).first(),
	).toBeVisible();
}

function parseMoney(value: string | undefined): number | undefined {
	if (!value) {
		return undefined;
	}
	return Number(value.replace(/,/g, ""));
}

/** The order summary panel, parsed into numbers (in cedis). */
async function readOrderSummary(page: Page) {
	const raw = (await page.locator("aside").first().innerText()).replace(
		/\s+/g,
		" ",
	);
	const subtotal = /Subtotal GH₵ ?([\d,]+(?:\.\d+)?)/.exec(raw)?.[1];
	const deliveryFree = /Delivery Free/.test(raw);
	const delivery = /Delivery GH₵ ?([\d,]+(?:\.\d+)?)/.exec(raw)?.[1];
	const total = /Total GH₵ ?([\d,]+(?:\.\d+)?)/.exec(raw)?.[1];

	return {
		subtotal: parseMoney(subtotal),
		delivery: deliveryFree ? 0 : parseMoney(delivery),
		deliveryIsFree: deliveryFree,
		total: parseMoney(total),
		raw,
	};
}

function cartLine(page: Page) {
	return page.locator("article").filter({ hasText: PRODUCT_NAME }).first();
}

/** The bold line total on a cart row (the "GH₵ 500 each" line has a suffix). */
async function readLineTotal(page: Page): Promise<number | undefined> {
	const raw = (await cartLine(page).innerText()).replace(/\s+/g, " ");
	const matches = [
		...raw.matchAll(/GH₵ ?([\d,]+(?:\.\d+)?)(?![\d,.])(?! each)/g),
	];
	return parseMoney(matches.at(-1)?.[1]);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
	sql(
		`INSERT INTO store_product (
			id, name, slug, "shortDescription", description, brand, sku, status,
			"priceInPesewas", "stockQuantity", "lowStockThreshold", "isFeatured",
			specifications, "categoryId", "publishedAt", "createdAt", "updatedAt"
		) VALUES (
			'${PRODUCT_ID}', '${PRODUCT_NAME}', '${PRODUCT_SLUG}',
			'A fixture product for the automated QA coverage suite.',
			'This product exists only so the automated QA coverage suite can exercise cart mutation, the delivery threshold, order history, and restock-on-cancel end to end.',
			'QA Labs', '${PRODUCT_SKU}', 'ACTIVE',
			${BASE_PRICE_IN_PESEWAS}, ${SEED_STOCK}, 1, false,
			'{}'::jsonb,
			(SELECT id FROM store_category WHERE slug = 'phones'),
			NOW(), NOW(), NOW()
		)`,
	);
	sql(
		`INSERT INTO store_product_image (id, "productId", url, alt, "sortOrder", "createdAt")
		VALUES ('${PRODUCT_ID}img', '${PRODUCT_ID}',
			'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
			'${PRODUCT_NAME}', 0, NOW())`,
	);
});

test.afterAll(() => {
	// Orders reference products with ON DELETE RESTRICT, so the fixture's
	// orders have to go first.
	const orderIds = sql(
		`SELECT DISTINCT "orderId" FROM store_order_item WHERE "productId" = '${PRODUCT_ID}'`,
	)
		.split("\n")
		.map((id) => id.trim())
		.filter(Boolean);

	if (orderIds.length > 0) {
		const list = orderIds.map((id) => `'${id}'`).join(",");
		sql(
			`DELETE FROM store_inventory_event WHERE "productId" = '${PRODUCT_ID}'`,
		);
		sql(`DELETE FROM store_review WHERE "productId" = '${PRODUCT_ID}'`);
		sql(`DELETE FROM store_order_item WHERE "orderId" IN (${list})`);
		sql(
			`DELETE FROM store_order_status_event WHERE "orderId" IN (${list})`,
		);
		sql(`DELETE FROM store_transaction WHERE "orderId" IN (${list})`);
		sql(`DELETE FROM store_order WHERE id IN (${list})`);
	}

	sql(
		`DELETE FROM store_inventory_event WHERE "productId" = '${PRODUCT_ID}'`,
	);
	sql(`DELETE FROM store_product WHERE id = '${PRODUCT_ID}'`);
	sql(`DELETE FROM store_product WHERE slug = '${REJECTED_SLUG}'`);
	sql(`DELETE FROM store_category WHERE slug = '${CATEGORY_SLUG}'`);
});

test.describe("buyer cart and delivery", () => {
	test("quantity edits and removal update the line total and summary", async ({
		page,
	}) => {
		await addSeededProductToBag(page);
		await page.goto(`${STOREFRONT}/cart`);
		await expect(
			page.getByRole("heading", { name: "Your shopping bag" }),
		).toBeVisible();

		expect(await readLineTotal(page)).toBe(500);
		await expect(page.getByText("1 item", { exact: true })).toBeVisible();
		expect(await readOrderSummary(page)).toMatchObject({
			subtotal: 500,
			delivery: 35,
			total: 535,
		});

		await cartLine(page)
			.getByRole("button", { name: `Increase ${PRODUCT_NAME} quantity` })
			.click();

		await expect.poll(() => readLineTotal(page)).toBe(1000);
		await expect(page.getByText("2 items", { exact: true })).toBeVisible();
		await expect
			.poll(async () => await readOrderSummary(page))
			.toMatchObject({ subtotal: 1000, delivery: 0, total: 1000 });

		await cartLine(page)
			.getByRole("button", { name: `Decrease ${PRODUCT_NAME} quantity` })
			.click();

		await expect.poll(() => readLineTotal(page)).toBe(500);
		await expect
			.poll(async () => await readOrderSummary(page))
			.toMatchObject({ subtotal: 500, delivery: 35, total: 535 });

		await cartLine(page)
			.getByRole("button", { name: `Remove ${PRODUCT_NAME} from bag` })
			.click();

		await expect(
			page.getByRole("heading", {
				name: "Your bag is ready when you are.",
			}),
		).toBeVisible();
		await expect(page.getByText(PRODUCT_NAME)).toHaveCount(0);

		// A reload proves the removal was persisted, not just re-rendered.
		await page.reload();
		await expect(
			page.getByRole("heading", {
				name: "Your bag is ready when you are.",
			}),
		).toBeVisible();
	});

	test("cart quantity is capped at the product stock quantity", async ({
		page,
	}) => {
		setProduct('"stockQuantity" = 1');

		try {
			await addSeededProductToBag(page);
			await page.goto(`${STOREFRONT}/cart`);

			const increase = cartLine(page).getByRole("button", {
				name: `Increase ${PRODUCT_NAME} quantity`,
			});
			await expect(increase).toBeDisabled();
			await expect(
				page.getByText("Maximum available quantity selected."),
			).toBeVisible();
			expect(await readLineTotal(page)).toBe(500);

			// The clamp has to hold even when the increase is dispatched
			// programmatically rather than through the disabled button.
			await page.evaluate(() => {
				const stored = window.localStorage.getItem(
					"geostoresgh-cart-v1",
				);
				const items = stored ? JSON.parse(stored) : [];
				window.localStorage.setItem(
					"geostoresgh-cart-v1",
					JSON.stringify(
						items.map((item: { quantity: number }) => ({
							...item,
							quantity: 5,
						})),
					),
				);
			});
			await page.reload();
			await cartLine(page)
				.getByRole("button", {
					name: `Decrease ${PRODUCT_NAME} quantity`,
				})
				.click();
			await expect
				.poll(async () => (await readOrderSummary(page)).subtotal)
				.toBeLessThanOrEqual(500);
		} finally {
			setProduct(`"stockQuantity" = ${SEED_STOCK}`);
		}
	});

	test("free delivery starts exactly at GH₵1,000", async ({ page }) => {
		// GH₵ 999 — one pesewa under the threshold.
		setProduct('"priceInPesewas" = 99900');
		await addSeededProductToBag(page);
		await page.goto(`${STOREFRONT}/cart`);
		await expect
			.poll(async () => await readOrderSummary(page))
			.toMatchObject({ subtotal: 999, delivery: 35, total: 1034 });
		await expect(
			page.getByText("Add GH₵ 1 more for free delivery in Accra."),
		).toBeVisible();

		// GH₵ 1,000 — exactly at the threshold.
		setProduct('"priceInPesewas" = 100000');
		await page.evaluate(() =>
			window.localStorage.removeItem("geostoresgh-cart-v1"),
		);
		await addSeededProductToBag(page);
		await page.goto(`${STOREFRONT}/cart`);
		await expect
			.poll(async () => await readOrderSummary(page))
			.toMatchObject({
				subtotal: 1000,
				deliveryIsFree: true,
				total: 1000,
			});
		await expect(
			page.getByText("Your order qualifies for free delivery in Accra."),
		).toBeVisible();

		setProduct(`"priceInPesewas" = ${BASE_PRICE_IN_PESEWAS}`);
	});

	/**
	 * There are no customer accounts any more: shoppers check out as guests and
	 * the order is followed up in the back office. This replaces the old
	 * "signed-in buyer sees their order history" case, which tested a feature
	 * the storefront no longer offers.
	 */
	test("a guest order is recorded and shows in the admin orders list", async ({
		page,
	}) => {
		const stockBefore = readProductStock();
		const guestEmail = `qa-guest+${Date.now()}@geostore.test`;

		await addSeededProductToBag(page);
		await page.goto(`${STOREFRONT}/checkout`);

		await page.getByRole("textbox", { name: "Full name" }).fill("QA Guest");
		await page
			.getByRole("textbox", { name: "Email address" })
			.fill(guestEmail);
		await page
			.getByRole("textbox", { name: "Phone number" })
			.fill("0240000002");
		await page
			.getByRole("textbox", { name: "Street address or landmark" })
			.fill("14 Coverage Street");
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

		expect(
			sql(
				`SELECT "customerEmail" FROM store_order WHERE "orderNumber" = '${orderNumber}'`,
			),
			"the order records the email given at checkout",
		).toBe(guestEmail);
		expect(readProductStock()).toBe(stockBefore - 1);

		await signIn(page, ADMIN);
		await page.goto("/admin/orders");
		await expect(page.getByText(orderNumber as string)).toBeVisible({
			timeout: 30_000,
		});
	});
});

test.describe("admin catalogue and fulfilment", () => {
	test("editing a product's stock from the products table persists", async ({
		page,
	}) => {
		await signIn(page, ADMIN);
		await page.goto("/admin/products");

		const row = page
			.locator("tr")
			.filter({ hasText: PRODUCT_NAME })
			.first();
		await expect(row).toBeVisible({ timeout: 30_000 });

		await row.getByLabel("Stock quantity").fill("9");
		await row.getByRole("button", { name: "Save stock" }).click();
		await expect(page.getByText("Stock updated").first()).toBeVisible({
			timeout: 20_000,
		});

		await expect
			.poll(() => readProductStock(), { timeout: 20_000 })
			.toBe(9);

		await page.goto("/admin/products");
		const reloadedRow = page
			.locator("tr")
			.filter({ hasText: PRODUCT_NAME })
			.first();
		await expect(reloadedRow.getByLabel("Stock quantity")).toHaveValue("9");
	});

	test("an admin can create and then edit a category", async ({ page }) => {
		await signIn(page, ADMIN);
		await page.goto("/admin/categories");
		await expect(
			page.getByRole("heading", { name: "Categories" }),
		).toBeVisible();

		const createForm = page.locator("form").first();
		await createForm.locator('input[name="name"]').fill(CATEGORY_NAME);
		await createForm.locator('input[name="slug"]').fill(CATEGORY_SLUG);
		await createForm
			.locator('textarea[name="description"]')
			.fill("Created by the automated QA coverage suite.");
		await createForm.locator('input[name="sortOrder"]').fill("99");
		await createForm.getByRole("button", { name: "Add category" }).click();

		await expect(page.getByText("Category created.").first()).toBeVisible({
			timeout: 20_000,
		});
		await expect
			.poll(
				() =>
					sql(
						`SELECT name FROM store_category WHERE slug = '${CATEGORY_SLUG}'`,
					),
				{ timeout: 20_000 },
			)
			.toBe(CATEGORY_NAME);

		await page.goto("/admin/categories");
		const editForm = page.locator(
			`form:has(input[name="slug"][value="${CATEGORY_SLUG}"])`,
		);
		await expect(editForm).toBeVisible({ timeout: 30_000 });
		await editForm.locator('input[name="name"]').fill(CATEGORY_RENAMED);
		await editForm.getByRole("button", { name: "Update category" }).click();

		await expect(page.getByText("Category updated.").first()).toBeVisible({
			timeout: 20_000,
		});
		await expect
			.poll(
				() =>
					sql(
						`SELECT name FROM store_category WHERE slug = '${CATEGORY_SLUG}'`,
					),
				{ timeout: 20_000 },
			)
			.toBe(CATEGORY_RENAMED);

		await page.goto("/admin/categories");
		await expect(page.getByText(CATEGORY_RENAMED).first()).toBeVisible();
	});

	test("cancelling an order restocks the product and records a RETURN event", async ({
		page,
	}) => {
		const orderNumber = sql(
			`SELECT o."orderNumber" FROM store_order o
			 JOIN store_order_item i ON i."orderId" = o.id
			 WHERE i."productId" = '${PRODUCT_ID}'
			 ORDER BY o."placedAt" DESC LIMIT 1`,
		);
		expect(orderNumber, "an order for the fixture product exists").toMatch(
			/^GST-/,
		);

		const stockBefore = readProductStock();
		const returnEventsBefore = Number(
			sql(
				`SELECT COUNT(*) FROM store_inventory_event WHERE "productId" = '${PRODUCT_ID}' AND type = 'RETURN'`,
			),
		);

		await signIn(page, ADMIN);
		await page.goto("/admin/orders");
		const row = page.locator("tr").filter({ hasText: orderNumber }).first();
		await expect(row).toBeVisible({ timeout: 30_000 });
		await chooseAdminOption(
			page,
			row.getByLabel("Order status"),
			"Cancelled",
		);

		await expect(
			page.getByText("Order status updated").first(),
		).toBeVisible({ timeout: 20_000 });

		await expect
			.poll(
				() =>
					sql(
						`SELECT status FROM store_order WHERE "orderNumber" = '${orderNumber}'`,
					),
				{ timeout: 20_000 },
			)
			.toBe("CANCELLED");
		await expect
			.poll(() => readProductStock(), { timeout: 20_000 })
			.toBe(stockBefore + 1);
		await expect
			.poll(
				() =>
					Number(
						sql(
							`SELECT COUNT(*) FROM store_inventory_event WHERE "productId" = '${PRODUCT_ID}' AND type = 'RETURN'`,
						),
					),
				{ timeout: 20_000 },
			)
			.toBe(returnEventsBefore + 1);
		expect(
			sql(
				`SELECT quantity || '|' || reason FROM store_inventory_event
				 WHERE "productId" = '${PRODUCT_ID}' AND type = 'RETURN'
				 ORDER BY "createdAt" DESC LIMIT 1`,
			),
		).toBe(`1|CANCELLED ${orderNumber}`);
	});

	test("the product form rejects a disallowed image host", async ({
		page,
	}) => {
		await signIn(page, ADMIN);
		// Adding a product is a sheet over the list now; the query parameter is
		// what the retired /admin/products/new route redirects to.
		await page.goto("/admin/products?new=true");
		await expect(
			page.getByRole("heading", { name: "Add product" }),
		).toBeVisible({ timeout: 30_000 });

		const form = page.locator("form");
		await form
			.getByLabel("Name", { exact: true })
			.first()
			.fill("QA Rejected Image Product");
		await form.getByLabel("URL slug").fill(REJECTED_SLUG);
		await form.getByLabel("Brand").fill("QA Labs");
		await form
			.getByLabel("SKU", { exact: true })
			.first()
			.fill(REJECTED_SKU);
		await form
			.getByLabel("Short description")
			.fill("A product whose image host is not on the allow list.");
		await form
			.getByLabel("Full description")
			.fill(
				"This submission must be rejected before it reaches the database because next/image would throw on an unconfigured remote host at render time.",
			);
		await form.getByLabel("Product image URLs").fill(DISALLOWED_IMAGE_URL);
		await chooseAdminOption(page, form.getByLabel("Status"), "Active");
		await chooseAdminOption(
			page,
			form.getByLabel("Category"),
			"Phones & tablets",
		);
		await form
			.getByLabel("Price (GH₵)", { exact: true })
			.first()
			.fill("250");
		await form.getByLabel("On-hand quantity").fill("4");

		await page.getByRole("button", { name: "Save product" }).click();

		// The submission is refused: the form stays put and nothing is written.
		const inlineMessages = page.locator("form p.text-destructive");
		await expect(inlineMessages.first()).toBeVisible({ timeout: 20_000 });
		await expect(page).toHaveURL(/\/admin\/products\?new=true/);
		expect(
			sql(
				`SELECT COUNT(*) FROM store_product WHERE slug = '${REJECTED_SLUG}' OR sku = '${REJECTED_SKU}'`,
			),
			"no product row was created",
		).toBe("0");

		// And the admin has to be able to read why. The message under
		// "Product image URLs" is the only feedback the form gives — the
		// submit never reaches the server, so no toast appears either.
		expect(
			(await inlineMessages.allInnerTexts()).join(" | "),
			'the inline validation message must name the rejected image host (the schema message in packages/api/modules/commerce/types.ts). A literal "undefined" here means FormMessage stringified an array-typed field error',
		).toMatch(/image host is not allowed/i);
	});
});
