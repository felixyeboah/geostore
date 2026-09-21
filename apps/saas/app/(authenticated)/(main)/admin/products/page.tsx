import { AdminHeader } from "@admin/components/AdminPage";
import { AddProductButton } from "@admin/components/products/AddProductButton";
import {
	type ProductRow,
	type ProductStatus,
	ProductsTable,
	type StockState,
} from "@admin/components/products/ProductsTable";
import { loadProductListParams } from "@admin/lib/list-params";
import { formatMoney } from "@repo/commerce";
import { getAdminProductList, getAdminProductSummary } from "@repo/database";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

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

export default async function AdminProductsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await loadProductListParams(searchParams);

	const [list, summary] = await Promise.all([
		getAdminProductList({
			q: params.q,
			status: params.status ?? undefined,
			stock: params.stock ?? undefined,
			categoryId: params.dept ?? undefined,
			sort: params.sort,
			dir: params.dir,
			page: params.page,
		}),
		getAdminProductSummary(),
	]);

	const rows: ProductRow[] = list.products.map((product) => ({
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
		condition: product.condition,
		isFeatured: product.isFeatured,
		updatedAt: product.updatedAt.toISOString(),
		stockState: getStockState(
			product.stockQuantity,
			product.lowStockThreshold,
		),
	}));

	// The band reports the shop, not the current filter, so it reads from the
	// catalogue-wide summary rather than from the page of rows below it.
	const headline = [
		summary.outOfStock ? `${summary.outOfStock} out of stock` : null,
		summary.lowStock ? `${summary.lowStock} running low` : null,
		summary.drafts ? `${summary.drafts} still in draft` : null,
	].filter(Boolean);

	const triage = [
		{
			key: "out",
			count: summary.outOfStock,
			title: "Out of stock",
			detail: "Live on the storefront with nothing to sell",
			urgent: true,
		},
		{
			key: "low",
			count: summary.lowStock,
			title: "Running low",
			detail: "At or under their low-stock warning",
			urgent: false,
		},
		{
			key: "draft",
			count: summary.drafts,
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
					headline.length > 0
						? `${summary.total} products · ${headline.join(" · ")}.`
						: `${summary.total} products, all in stock and published.`
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
				<ProductsTable
					products={rows}
					facets={list.facets}
					total={list.total}
					page={list.page}
					pageCount={list.pageCount}
				/>
			</div>

			{summary.liveStockValueInPesewas > 0 && (
				<p className="text-[12px] text-muted-foreground">
					{formatMoney(summary.liveStockValueInPesewas)} of published
					stock on hand.
				</p>
			)}
		</div>
	);
}
