import { createClient } from "@libsql/client";
import { expect, type Page, test } from "@playwright/test";
import type { CartLine, StoreProduct } from "@repo/commerce";
import { formatMoney } from "@repo/commerce/money";
import { STORE_PRODUCTS } from "@repo/commerce/seed-catalog";
import {
	resolveOptionGallery,
	resolveVariant,
	variantAxes,
} from "@repo/commerce/variants";

const STOREFRONT =
	process.env.PLAYWRIGHT_STOREFRONT_URL ?? "http://localhost:3001";
const TIMEOUT = 30_000;
const CART_KEY = "geostoresgh-cart-v1";
const representativeCategories = [
	"phones",
	"tablets",
	"watches-wearables",
	"appliances",
];
const cartProducts = new Set(
	representativeCategories.map((category) => {
		const product = STORE_PRODUCTS.find(
			(candidate) =>
				candidate.categorySlug === category &&
				candidate.variants?.length,
		);
		if (!product) {
			throw new Error(
				`Missing seeded variant acceptance fixture: ${category}`,
			);
		}
		return product.slug;
	}),
);

function fieldset(page: Page, label: string) {
	return page.locator("fieldset").filter({
		has: page.locator("legend").filter({
			hasText: new RegExp(
				`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — `,
			),
		}),
	});
}

/** Compare original URLs even when Next's image optimizer wraps the source. */
function originalImageUrl(src: string): string {
	const url = new URL(src, STOREFRONT);
	return url.pathname === "/_next/image"
		? (url.searchParams.get("url") ?? src)
		: url.href;
}

async function selectedAttributes(page: Page, product: StoreProduct) {
	const selection: Record<string, string> = {};
	for (const axis of variantAxes(product.variants ?? [])) {
		const group = fieldset(page, axis.label);
		await expect(group).toHaveCount(1, { timeout: TIMEOUT });
		const selected = group.locator('button[aria-pressed="true"]');
		await expect(selected).toHaveCount(1, { timeout: TIMEOUT });
		selection[axis.key] = (await selected.innerText()).trim();
		await expect(group.getByRole("button")).toHaveCount(axis.values.length);
	}
	return selection;
}

async function verifySelection(page: Page, product: StoreProduct) {
	const selection = await selectedAttributes(page, product);
	const variant = resolveVariant(product.variants ?? [], selection);
	if (product.variants?.length) {
		expect(
			variant,
			`Existing complete configuration for ${product.slug}`,
		).toBeDefined();
	}
	const price = variant?.priceInPesewas ?? product.priceInPesewas;
	const stock = variant?.stockQuantity ?? product.stockQuantity;
	await expect(
		page.getByText(formatMoney(price), { exact: true }).first(),
	).toBeVisible({ timeout: TIMEOUT });
	const stockLabel =
		stock < 1
			? "Out of stock"
			: stock <= 3
				? `Only ${stock} left`
				: `In stock · ${stock}`;
	await expect(
		page.getByText(`${stockLabel} · ships from Accra`, { exact: true }),
	).toBeVisible({ timeout: TIMEOUT });

	const gallery = resolveOptionGallery(product, selection);
	expect(gallery.length, `Gallery for ${product.slug}`).toBeGreaterThan(0);
	const primary = page
		.getByRole("img", { name: product.name, exact: true })
		.first();
	await expect
		.poll(
			async () =>
				originalImageUrl((await primary.getAttribute("src")) ?? ""),
			{ timeout: TIMEOUT },
		)
		.toBe(gallery[0]);
	await expect(primary).not.toHaveAttribute("aria-hidden", "true");
	await expect
		.poll(
			() =>
				primary.evaluate(
					(image: HTMLImageElement) =>
						image.complete && image.naturalWidth > 0,
				),
			{ timeout: TIMEOUT },
		)
		.toBe(true);
	const mountedImages = primary.locator("..").locator("img");
	await expect
		.poll(
			async () =>
				(
					await mountedImages.evaluateAll(
						(images: HTMLImageElement[]) =>
							images.map(
								(image) => image.getAttribute("src") ?? "",
							),
					)
				).map(originalImageUrl),
			{ timeout: TIMEOUT },
		)
		.toEqual(gallery);

	// This is independent of resolveOptionGallery: a faulty generic fallback
	// must not silently reintroduce another colour's photographs.
	const owned = product.optionMedia ?? [];
	const selectedImages = new Set(
		owned
			.filter((media) => selection[media.axis] === media.value)
			.flatMap((media) => media.images),
	);
	const foreignImages = owned
		.filter((media) => selection[media.axis] !== media.value)
		.flatMap((media) => media.images)
		.filter((url) => !selectedImages.has(url));
	for (const foreign of foreignImages) {
		expect(
			gallery,
			`Other option's image leaked for ${product.slug}`,
		).not.toContain(foreign);
	}
	return { selection, variant, price, stock, gallery };
}

for (const product of STORE_PRODUCTS) {
	test(`seeded catalogue: ${product.slug} options and owned images`, async ({
		page,
	}) => {
		test.setTimeout(180_000);
		await page.goto(`${STOREFRONT}/products/${product.slug}`);
		await expect(
			page.getByRole("heading", {
				level: 1,
				name: product.name,
				exact: true,
			}),
		).toBeVisible({ timeout: TIMEOUT });
		let current = await verifySelection(page, product);
		const available = (product.variants ?? []).filter(
			(variant) => variant.stockQuantity > 0,
		);
		const candidates = available.length
			? available
			: (product.variants ?? []);
		if (candidates.length) {
			expect(current.price).toBe(
				Math.min(
					...candidates.map((variant) => variant.priceInPesewas),
				),
			);
		}
		for (const media of product.optionMedia ?? []) {
			const axis = variantAxes(product.variants ?? []).find(
				(candidate) => candidate.key === media.axis,
			);
			expect(
				axis,
				`Media owner must be selectable: ${media.axis}`,
			).toBeDefined();
			if (!axis) {
				throw new Error(`Missing media axis ${media.axis}`);
			}
			const button = fieldset(page, axis.label).getByRole("button", {
				name: media.value,
				exact: true,
			});
			await button.click();
			await expect(button).toHaveAttribute("aria-pressed", "true");
			current = await verifySelection(page, product);
			expect(current.selection[media.axis]).toBe(media.value);
		}
		if (!cartProducts.has(product.slug)) {
			return;
		}

		expect(
			current.stock,
			"Representative fixture must be purchasable",
		).toBeGreaterThan(0);
		await page
			.getByRole("button", { name: "Add to bag", exact: true })
			.first()
			.click();
		const toastImage = page
			.locator("[data-sonner-toast]")
			.filter({ hasText: "Added to bag" })
			.locator("img");
		await expect(toastImage).toBeVisible({ timeout: TIMEOUT });
		await expect
			.poll(
				async () =>
					originalImageUrl(
						(await toastImage.getAttribute("src")) ?? "",
					),
				{ timeout: TIMEOUT },
			)
			.toBe(current.gallery[0]);
		await expect
			.poll(
				() =>
					page.evaluate(
						(key) =>
							JSON.parse(localStorage.getItem(key) ?? "[]")
								.length,
						CART_KEY,
					),
				{ timeout: TIMEOUT },
			)
			.toBe(1);
		const lines: CartLine[] = await page.evaluate(
			(key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
			CART_KEY,
		);
		const line = lines[0];
		expect(line).toMatchObject({
			productId: product.id,
			priceInPesewas: current.price,
			stockQuantity: current.stock,
			quantity: 1,
			imageUrl: current.gallery[0],
		});
		expect(line.variantId).toBeTruthy();
		for (const value of Object.values(current.selection)) {
			expect(line.variantName).toContain(value);
		}

		// SKU is not rendered by the picker. Verify the real persisted SKU
		// behind the exact variant ID that the browser added to its bag.
		const databaseUrl = process.env.DATABASE_URL;
		if (
			!databaseUrl ||
			!["localhost", "127.0.0.1", "[::1]"].includes(
				new URL(databaseUrl).hostname,
			)
		) {
			throw new Error(
				"Seeded acceptance tests require an isolated local database",
			);
		}
		const db = createClient({ url: databaseUrl });
		try {
			const result = await db.execute({
				sql: 'SELECT sku, "priceInPesewas", "stockQuantity" FROM store_product_variant WHERE id = ? AND "productId" = ?',
				args: [line.variantId ?? "", product.id],
			});
			expect(result.rows).toHaveLength(1);
			expect(result.rows[0]).toMatchObject({
				sku: current.variant?.sku,
				priceInPesewas: current.price,
				stockQuantity: current.stock,
			});
		} finally {
			db.close();
		}
		await page.goto(`${STOREFRONT}/cart`);
		const cartImage = page
			.getByRole("img", { name: product.name, exact: true })
			.first();
		await expect
			.poll(
				async () =>
					originalImageUrl(
						(await cartImage.getAttribute("src")) ?? "",
					),
				{ timeout: TIMEOUT },
			)
			.toBe(current.gallery[0]);
		await expect(
			page.getByRole("heading", { name: "Your bag", exact: true }),
		).toBeVisible({ timeout: TIMEOUT });
		await expect(
			page.getByText(
				`${formatMoney(current.price)} each · ${line.variantName}`,
				{ exact: true },
			),
		).toBeVisible({ timeout: TIMEOUT });
		await expect(
			page.getByText(formatMoney(current.price), { exact: true }).first(),
		).toBeVisible({ timeout: TIMEOUT });
	});
}
