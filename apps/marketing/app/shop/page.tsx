import { CatalogueFilters } from "@commerce/components/CatalogueFilters";
import { CatalogueHeader } from "@commerce/components/CatalogueHeader";
import { ProductGrid } from "@commerce/components/ProductGrid";
import {
	type CatalogueSearchParams,
	catalogueTitle,
	listBrands,
	parseBrands,
	parsePriceBracket,
	parseSort,
} from "@commerce/lib/catalogue";
import {
	getLiveCategories,
	getLiveCollections,
	getLiveProducts,
} from "@commerce/lib/live-catalog";
import { storeLinks } from "@commerce/lib/store-links";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Shop phones, computers, gaming and home appliances",
	description:
		"Browse the GeoStores catalogue: phones, laptops, gaming, appliances and everyday accessories, delivered across Ghana.",
};

interface StorePageProps {
	searchParams: Promise<CatalogueSearchParams>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
	const params = await searchParams;
	const sort = parseSort(params.sort);
	const bracket = parsePriceBracket(params.price);
	const filters = {
		query: params.q,
		collection: params.collection,
		brands: parseBrands(params.brand),
		minPriceInPesewas: bracket?.min,
		maxPriceInPesewas: bracket?.max,
		inStock: params.stock === "in",
		onSale: params.sale === "1",
		sort,
	};
	const [categories, collections, products, allProducts] = await Promise.all([
		getLiveCategories({ stockedOnly: true }),
		getLiveCollections({ includeSmart: true }),
		getLiveProducts(filters),
		getLiveProducts(),
	]);

	return (
		<div className="editorial">
			<section className="mx-auto w-full max-w-[1560px] px-5 pt-12 md:px-10 lg:pt-20">
				<CatalogueHeader
					title={catalogueTitle(
						"Everything we stock",
						params,
						collections,
					)}
					subtitle="For your work, your play and everything in between. Held in real stock in Accra."
					productCount={products.length}
				/>
			</section>

			{/* Departments are the tab row in the filter bar; a second,
			    picture-led index of the same thing only pushed the products
			    below the fold. */}
			<section
				id="products"
				className="mx-auto mt-11 w-full max-w-[1560px] scroll-mt-40 px-5 md:px-10"
			>
				<CatalogueFilters
					categories={categories}
					collections={collections}
					brands={listBrands(allProducts)}
					params={params}
					sort={sort}
					productCount={products.length}
					basePath={storeLinks.shop}
				/>

				<div className="mt-[52px]">
					<ProductGrid
						products={products}
						categories={categories}
						clearHref={storeLinks.shop}
					/>
				</div>

				<p className="mt-14 text-[12px] text-muted-foreground">
					Prices are shown in Ghana cedis. Delivery is calculated at
					checkout, and stock is confirmed before payment is taken.
				</p>
			</section>

			<EnquiryBand />
		</div>
	);
}

function EnquiryBand() {
	return (
		<section className="mx-auto mt-20 w-full max-w-[1560px] px-5 md:px-10">
			<div className="flex flex-col gap-10 border-border border-t pt-16 md:flex-row md:items-start md:justify-between">
				<div>
					<p className="eyebrow text-muted-foreground">
						A little guidance goes a long way
					</p>
					<h2 className="mt-4 max-w-[18ch] font-semibold text-[clamp(28px,3.4vw,44px)] text-foreground leading-[1.05] tracking-[-0.042em]">
						Not seeing the model you want? Ask and we’ll source it.
					</h2>
					<p className="mt-6 max-w-[46ch] text-[15px] text-muted-foreground leading-[1.62]">
						Tell us the exact device or appliance and we’ll come
						back with a price and a delivery date.
					</p>
				</div>
				<Link
					href={storeLinks.contact}
					className="inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-[2px] bg-[var(--ed-accent)] px-[26px] font-semibold text-[14.5px] text-white tracking-[-0.01em] transition-colors hover:bg-[#5a1fbd] md:mt-14"
				>
					Make an enquiry
				</Link>
			</div>
		</section>
	);
}
