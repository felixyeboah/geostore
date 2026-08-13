import { ProductCard } from "@commerce/components/ProductCard";
import type { StoreProduct } from "@commerce/types";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";

interface ProductGridProps {
	products: StoreProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
	if (products.length === 0) {
		return (
			<div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-muted/60 px-6 text-center">
				<span className="flex size-12 items-center justify-center rounded-xl bg-background">
					<SearchXIcon className="size-5 text-muted-foreground" />
				</span>
				<h2 className="mt-4 font-semibold text-xl">
					No products found
				</h2>
				<p className="mt-2 max-w-md text-muted-foreground text-sm leading-6">
					Try a broader search or clear the current filters to see the
					full catalogue.
				</p>
				<Link
					href="/"
					className="mt-5 rounded-lg bg-foreground px-4 py-2 font-semibold text-background text-sm"
				>
					Clear filters
				</Link>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
}
