import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { storeLinks } from "@commerce/lib/store-links";
import type { StoreProduct } from "@repo/commerce";
import { formatMoney } from "@repo/commerce";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
	product: StoreProduct;
	/** Category name for the stock line; falls back to the brand. */
	categoryName?: string;
}

/**
 * The catalogue card from design/landing-v5/02-editorial.html: a 4:5 plate,
 * then a hairline, then name and price sharing a baseline row, the short
 * description, and a stock line pinned to the bottom so every card in a row
 * lines up regardless of how far its name wraps.
 */
export function ProductCard({ product, categoryName }: ProductCardProps) {
	const href = storeLinks.product(product.slug);
	const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 3;

	return (
		<article className="group flex h-full min-w-0 flex-col">
			<Link
				href={href}
				tabIndex={-1}
				aria-hidden="true"
				className="relative block aspect-[4/5] overflow-hidden bg-muted"
			>
				<Image
					src={product.imageUrl}
					alt={product.name}
					fill
					sizes="(min-width: 1280px) 360px, (min-width: 640px) 33vw, 50vw"
					className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
				/>
			</Link>

			<div className="mt-4 flex flex-1 flex-col border-border border-t pt-[13px]">
				<div className="flex items-baseline justify-between gap-3.5">
					<h3 className="min-w-0 font-semibold text-[15px] text-foreground leading-[1.3] tracking-[-0.02em]">
						<Link
							href={href}
							className="hover:text-[var(--ed-accent)]"
						>
							{product.name}
						</Link>
					</h3>
					<div className="whitespace-nowrap font-semibold text-[14px] text-foreground tabular-nums">
						{formatMoney(product.priceInPesewas)}
						{product.compareAtInPesewas && (
							<s className="ml-1.5 font-normal text-[12.5px] text-muted-foreground">
								{formatMoney(product.compareAtInPesewas)}
							</s>
						)}
					</div>
				</div>

				<p className="mt-[7px] text-[13px] text-muted-foreground leading-[1.5]">
					{product.shortDescription}
				</p>

				<p
					className={`eyebrow mt-auto pt-[11px] ${isLowStock ? "text-foreground" : "text-muted-foreground"}`}
				>
					{product.stockQuantity < 1
						? "Out of stock"
						: isLowStock
							? `Only ${product.stockQuantity} left`
							: `In stock · ${product.stockQuantity}`}
					{" · "}
					{categoryName ?? product.brand}
				</p>

				<div className="mt-[13px] flex items-center gap-2.5">
					<AddToCartButton product={product} appearance="text" />
					<span
						aria-hidden="true"
						className="text-[12px] text-border"
					>
						·
					</span>
					<Link
						href={href}
						className="border-transparent border-b pb-px font-medium text-[13px] text-foreground transition-colors hover:border-foreground"
					>
						View details
					</Link>
				</div>
			</div>
		</article>
	);
}
