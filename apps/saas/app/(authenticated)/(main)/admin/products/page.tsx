import { AdminHeader } from "@admin/components/AdminPage";
import {
	AddProductButton,
	AddProductSheet,
} from "@admin/components/products/ProductSheet";
import {
	type ProductRow,
	type ProductStatus,
	ProductsTable,
	type StockState,
} from "@admin/components/products/ProductsTable";
import { formatMoney } from "@repo/commerce";
import { getAdminStoreProducts, getStoreCategories } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products" };

function getStockState(
	stockQuantity: number,
	lowStockThreshold: number,
): StockState {
	if (stockQuantity <= 0) {
		return "OUT";
	}
	return stockQuantity <= lowStockThreshold ? "LOW" : "OK";
}

export default async function AdminProductsPage() {
	const [products, categories] = await Promise.all([
		getAdminStoreProducts(),
		getStoreCategories({ includeInactive: true }),
	]);

	const rows: ProductRow[] = products.map((product) => ({
		id: product.id,
		name: product.name,
		slug: product.slug,
		brand: product.brand,
		sku: product.sku,
		imageUrl: product.images[0]?.url ?? null,
		categoryName: product.category.name,
		priceInPesewas: product.priceInPesewas,
		compareAtInPesewas: product.compareAtInPesewas,
		stockQuantity: product.stockQuantity,
		lowStockThreshold: product.lowStockThreshold,
		status: product.status as ProductStatus,
		isFeatured: product.isFeatured,
		updatedAt: product.updatedAt.toISOString(),
		stockState: getStockState(
			product.stockQuantity,
			product.lowStockThreshold,
		),
	}));

	const outOfStock = rows.filter((row) => row.stockState === "OUT");
	const lowStock = rows.filter((row) => row.stockState === "LOW");
	const drafts = rows.filter((row) => row.status === "DRAFT");
	const liveValue = rows
		.filter((row) => row.status === "ACTIVE")
		.reduce((sum, row) => sum + row.priceInPesewas * row.stockQuantity, 0);

	// The headline reads as a sentence, so the state of the catalogue is
	// legible before anyone parses a table.
	const summary = [
		outOfStock.length ? `${outOfStock.length} out of stock` : null,
		lowStock.length ? `${lowStock.length} running low` : null,
		drafts.length ? `${drafts.length} still in draft` : null,
	].filter(Boolean);

	const triage = [
		{
			key: "out",
			count: outOfStock.length,
			title: "Out of stock",
			detail: "Live on the storefront with nothing to sell",
			urgent: true,
		},
		{
			key: "low",
			count: lowStock.length,
			title: "Running low",
			detail: "At or under their low-stock warning",
			urgent: false,
		},
		{
			key: "draft",
			count: drafts.length,
			title: "Still in draft",
			detail: "Not yet visible to customers",
			urgent: false,
		},
	].filter((item) => item.count > 0);

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Products and stock"
				description={
					summary.length > 0
						? `${rows.length} products · ${summary.join(" · ")}.`
						: `${rows.length} products, all in stock and published.`
				}
				actions={<AddProductButton />}
			/>

			{triage.length > 0 && (
				<section className="mt-9 grid gap-x-10 gap-y-5 border-border border-b pb-6 sm:grid-cols-3">
					{triage.map((item) => (
						<div
							key={item.key}
							className="flex items-baseline gap-3.5"
						>
							<span
								className={
									item.urgent
										? "font-semibold text-[22px] text-[var(--ed-accent)] tabular-nums"
										: "font-semibold text-[22px] text-foreground tabular-nums"
								}
							>
								{item.count}
							</span>
							<span className="min-w-0">
								<span className="block font-medium text-[13.5px] text-foreground">
									{item.title}
								</span>
								<span className="mt-0.5 block text-[12px] text-muted-foreground">
									{item.detail}
								</span>
							</span>
						</div>
					))}
				</section>
			)}

			<div className={triage.length > 0 ? "mt-2" : "mt-9"}>
				<ProductsTable products={rows} />
			</div>

			{liveValue > 0 && (
				<p className="text-[12px] text-muted-foreground">
					{formatMoney(liveValue)} of published stock on hand.
				</p>
			)}

			<AddProductSheet
				categories={categories.map(({ id, name }) => ({ id, name }))}
			/>
		</div>
	);
}
