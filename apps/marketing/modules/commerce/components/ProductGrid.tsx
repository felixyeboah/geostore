import { ProductCard } from "@commerce/components/ProductCard";
import type { StoreCategory, StoreProduct } from "@repo/commerce";
import Link from "next/link";

interface ProductGridProps {
	products: StoreProduct[];
	categories?: StoreCategory[];
	clearHref?: string;
}

export function ProductGrid({
	products,
	categories = [],
	clearHref = "/shop",
}: ProductGridProps) {
	if (products.length === 0) {
		return (
			<div className="border-border border-t py-16 text-center">
				<p className="font-semibold text-[20px] text-foreground tracking-[-0.03em]">
					Nothing in that filter right now.
				</p>
				<span className="mx-auto mt-2.5 block max-w-md text-[14px] text-muted-foreground">
					Try a broader search, or clear the filters to see the whole
					catalogue. If you know the model you want, ask and we’ll
					source it.
				</span>
				<Link
					href={clearHref}
					className="mt-[18px] inline-block border-border border-b pb-0.5 font-medium text-[13.5px] text-foreground transition-colors hover:border-foreground"
				>
					Show every product
				</Link>
			</div>
		);
	}

	const categoryNames = new Map(
		categories.map((category) => [category.slug, category.name]),
	);

	return (
		<div className="grid grid-cols-1 gap-x-7 gap-y-[52px] min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					categoryName={categoryNames.get(product.categorySlug)}
				/>
			))}
		</div>
	);
}
