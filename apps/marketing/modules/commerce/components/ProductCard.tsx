import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { storeLinks } from "@commerce/lib/store-links";
import type { StoreProduct } from "@repo/commerce";
import {
	conditionLabel,
	formatMoney,
	isColourAxis,
	optionValueHex,
	variantAxes,
} from "@repo/commerce";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
	product: StoreProduct;
	/** Category name for the stock line; falls back to the brand. */
	categoryName?: string;
}

const MAX_SWATCHES = 6;

/**
 * The catalogue card from design/landing-v5/02-editorial.html: a 4:5 plate,
 * then a hairline, then name and price sharing a baseline row, the short
 * description, and a stock line pinned to the bottom so every card in a row
 * lines up regardless of how far its name wraps.
 *
 * A product with variants shows its colour dots and option counts, and its
 * action becomes "Choose options" — quick-add would have to guess which
 * combination the buyer wanted.
 */
export function ProductCard({ product, categoryName }: ProductCardProps) {
	const href = storeLinks.product(product.slug);
	const variants = product.variants ?? [];
	const hasVariants = variants.length > 0;
	const stock = hasVariants
		? variants.reduce((total, variant) => total + variant.stockQuantity, 0)
		: product.stockQuantity;
	const isLowStock = stock > 0 && stock <= 3;

	const axes = hasVariants ? variantAxes(variants) : [];
	const colourAxis = axes.find((axis) => isColourAxis(axis.key));
	const colourValues = colourAxis?.values ?? [];
	const optionSummary = axes
		.map(
			(axis) =>
				`${axis.values.length} ${axis.label.toLowerCase()}${axis.values.length === 1 ? "" : "s"}`,
		)
		.join(" · ");

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
					className="object-contain transition-transform duration-500 group-hover:scale-[1.035]"
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

				{hasVariants ? (
					<div className="mt-2 flex items-center gap-2">
						{colourValues.slice(0, MAX_SWATCHES).map((value) => {
							const hex = optionValueHex(
								product.optionMedia,
								colourAxis?.key ?? "colour",
								value,
							);
							return hex ? (
								<span
									key={value}
									title={value}
									className="size-3 rounded-full border border-black/15"
									style={{ backgroundColor: hex }}
								/>
							) : null;
						})}
						{colourValues.length > MAX_SWATCHES ? (
							<span className="text-[11px] text-muted-foreground">
								+{colourValues.length - MAX_SWATCHES}
							</span>
						) : null}
						<span className="eyebrow text-muted-foreground">
							{optionSummary}
						</span>
					</div>
				) : null}

				<p
					className={`eyebrow mt-auto pt-[11px] ${isLowStock ? "text-foreground" : "text-muted-foreground"}`}
				>
					{stock < 1
						? "Out of stock"
						: isLowStock
							? `Only ${stock} left`
							: `In stock · ${stock}`}
					{" · "}
					{categoryName ?? product.brand}
					{product.condition !== "NEW"
						? ` · ${conditionLabel(product.condition)}`
						: null}
				</p>

				<div className="mt-[13px] flex items-center gap-2.5">
					{hasVariants ? (
						<Link
							href={href}
							className="border-transparent border-b pb-px font-medium text-[13px] text-foreground transition-colors hover:border-foreground"
						>
							Choose options
						</Link>
					) : (
						<AddToCartButton product={product} appearance="text" />
					)}
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
