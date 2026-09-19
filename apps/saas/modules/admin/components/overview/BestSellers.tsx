import { formatMoney } from "@repo/commerce";
import type { StoreOverview } from "@repo/database";
import Link from "next/link";
import { ProductThumb } from "./ProductThumb";
import { EmptyRow, SectionCard, SectionHead } from "./SectionCard";

export function BestSellers({
	products,
	days,
}: {
	products: StoreOverview["topProducts"];
	days: number;
}) {
	return (
		<SectionCard>
			<SectionHead
				title="Best sellers"
				description={`By paid revenue, last ${days} days`}
				action={
					<Link
						href="/admin/analytics"
						className="shrink-0 border-border border-b pb-px text-[12.5px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
					>
						Analytics
					</Link>
				}
			/>
			{products.length === 0 ? (
				<EmptyRow>Rankings appear after the first paid order.</EmptyRow>
			) : (
				<ol className="divide-y">
					{products.map((product, index) => (
						<li key={product.productId}>
							<Link
								href={`/admin/products/${product.productId}`}
								className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 sm:px-5"
							>
								<span className="w-4 shrink-0 font-semibold text-[11px] text-muted-foreground/70 tabular-nums">
									{String(index + 1).padStart(2, "0")}
								</span>
								<ProductThumb
									name={product.name}
									imageUrl={product.imageUrl}
									imageAlt={product.imageAlt}
									tileKey={product.productId}
								/>
								<span className="min-w-0 flex-1">
									<span className="block truncate font-medium text-[13px]">
										{product.name}
									</span>
									<span className="block text-muted-foreground text-xs">
										{[
											product.categoryName,
											`${product.quantity} sold`,
										]
											.filter(Boolean)
											.join(" · ")}
									</span>
								</span>
								<span className="shrink-0 text-right">
									<span className="block font-semibold text-[13px] tabular-nums">
										{formatMoney(product.revenueInPesewas)}
									</span>
									<span className="block text-muted-foreground/80 text-[11px] tabular-nums">
										{formatMoney(
											Math.round(
												product.revenueInPesewas /
													Math.max(
														product.quantity,
														1,
													),
											),
										)}{" "}
										avg
									</span>
								</span>
							</Link>
						</li>
					))}
				</ol>
			)}
		</SectionCard>
	);
}
