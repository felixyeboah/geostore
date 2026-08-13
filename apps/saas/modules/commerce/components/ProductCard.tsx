import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { formatMoney } from "@commerce/lib/money";
import type { StoreProduct } from "@commerce/types";
import { ArrowUpRightIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
	product: StoreProduct;
}

export function ProductCard({ product }: ProductCardProps) {
	return (
		<article className="group flex min-w-0 flex-col">
			<Link
				href={`/products/${product.slug}`}
				className="relative block aspect-square overflow-hidden rounded-2xl bg-muted"
			>
				<Image
					src={product.imageUrl}
					alt={product.name}
					fill
					sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
					className="object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
				/>
				<div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
					<div className="flex flex-wrap gap-1.5">
						{product.isNew && (
							<span className="rounded-md bg-foreground px-2 py-1 font-semibold text-background text-xs">
								New
							</span>
						)}
						{product.compareAtInPesewas && (
							<span className="rounded-md bg-background/90 px-2 py-1 font-semibold text-foreground text-xs backdrop-blur">
								Price drop
							</span>
						)}
					</div>
					<span className="flex size-9 items-center justify-center rounded-xl bg-background/90 opacity-0 shadow-sm backdrop-blur transition duration-200 group-hover:opacity-100">
						<ArrowUpRightIcon className="size-4" />
					</span>
				</div>
			</Link>

			<div className="flex flex-1 flex-col pt-4">
				<div className="flex items-center justify-between gap-3 text-xs">
					<span className="font-medium text-muted-foreground">
						{product.brand}
					</span>
					<span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
						<StarIcon className="size-3.5 fill-current text-amber-500" />
						{product.rating} ({product.reviewCount})
					</span>
				</div>
				<Link
					href={`/products/${product.slug}`}
					className="mt-2 text-pretty font-semibold text-base leading-6 tracking-tight hover:text-primary"
				>
					{product.name}
				</Link>
				<p className="mt-1 line-clamp-2 text-muted-foreground text-sm leading-5">
					{product.shortDescription}
				</p>
				<div className="mt-auto flex items-end justify-between gap-3 pt-4">
					<div>
						<p className="font-semibold text-base tabular-nums">
							{formatMoney(product.priceInPesewas)}
						</p>
						{product.compareAtInPesewas && (
							<p className="text-muted-foreground text-xs line-through tabular-nums">
								{formatMoney(product.compareAtInPesewas)}
							</p>
						)}
					</div>
					<AddToCartButton product={product} />
				</div>
			</div>
		</article>
	);
}
