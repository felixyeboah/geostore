import { daysOfStockLeft, describeStockVelocity } from "@admin/lib/overview";
import type { StoreOverview } from "@repo/database";
import { cn } from "@repo/ui";
import Link from "next/link";
import { ProductThumb } from "./ProductThumb";
import { EmptyRow, SectionCard, SectionHead } from "./SectionCard";

export function isStockCritical(product: StoreOverview["lowStock"][number]) {
	const daysLeft = daysOfStockLeft(
		product.stockQuantity,
		product.unitsPerDay,
	);
	return (
		product.stockQuantity <= Math.ceil(product.lowStockThreshold / 2) ||
		(daysLeft !== null && daysLeft <= 2)
	);
}

export function RunningLow({
	products,
	activeProducts,
	totalProducts,
}: {
	products: StoreOverview["lowStock"];
	activeProducts: number;
	totalProducts: number;
}) {
	return (
		<SectionCard>
			<SectionHead
				title="Running low"
				description={`${activeProducts} of ${totalProducts} products active`}
				action={
					<Link
						href="/admin/products"
						className="font-medium text-primary text-xs"
					>
						Inventory
					</Link>
				}
			/>
			{products.length === 0 ? (
				<EmptyRow>
					Every active product is above its restock threshold.
				</EmptyRow>
			) : (
				<ul className="divide-y">
					{products.map((product) => {
						const critical = isStockCritical(product);
						return (
							<li key={product.id}>
								<Link
									href={`/admin/products/${product.id}`}
									className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 sm:px-5"
								>
									<ProductThumb
										name={product.name}
										imageUrl={product.imageUrl}
										imageAlt={product.imageAlt}
										tileKey={product.id}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-[13px]">
											{product.name}
										</span>
										<span className="block text-muted-foreground text-xs">
											{describeStockVelocity(
												product.stockQuantity,
												product.unitsPerDay,
											)}
										</span>
									</span>
									<span
										className={cn(
											"shrink-0 rounded-md border px-2 py-0.5 font-semibold text-xs tabular-nums",
											critical
												? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
												: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
										)}
									>
										{product.stockQuantity} left
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</SectionCard>
	);
}
