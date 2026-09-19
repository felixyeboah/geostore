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
import {
	breadcrumbSchema,
	itemListSchema,
	StructuredData,
} from "@shared/components/StructuredData";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface CategoryPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<CatalogueSearchParams>;
}

export async function generateMetadata({
	params,
}: CategoryPageProps): Promise<Metadata> {
	const { slug } = await params;
	const categories = await getLiveCategories();
	const category = categories.find((item) => item.slug === slug);

	return category
		? { title: category.name, description: category.description }
		: { title: "Category not found" };
}

export default async function CategoryPage({
	params,
	searchParams,
}: CategoryPageProps) {
	const [{ slug }, query] = await Promise.all([params, searchParams]);
	const sort = parseSort(query.sort);
	const bracket = parsePriceBracket(query.price);
	const [categories, collections, products, categoryProducts] =
		await Promise.all([
			getLiveCategories({ stockedOnly: true }),
			getLiveCollections({ includeSmart: true }),
			getLiveProducts({
				category: slug,
				query: query.q,
				brands: parseBrands(query.brand),
				minPriceInPesewas: bracket?.min,
				maxPriceInPesewas: bracket?.max,
				inStock: query.stock === "in",
				onSale: query.sale === "1",
				sort,
			}),
			getLiveProducts({ category: slug }),
		]);
	const category = categories.find((item) => item.slug === slug);

	if (!category) {
		notFound();
	}

	const basePath = storeLinks.category(category.slug);

	return (
		<div className="editorial">
			<StructuredData
				data={[
					itemListSchema(products, {
						name: category.name,
						path: `/categories/${category.slug}`,
					}),
					breadcrumbSchema([
						{ name: "Shop", path: "/shop" },
						{
							name: category.name,
							path: `/categories/${category.slug}`,
						},
					]),
				]}
			/>
			<section className="mx-auto w-full max-w-[1560px] px-5 pt-12 md:px-10 lg:pt-20">
				<CatalogueHeader
					title={catalogueTitle(category.name, query, collections)}
					subtitle={category.description}
					productCount={products.length}
				/>

				<div className="mt-11">
					<CatalogueFilters
						categories={categories}
						activeSlug={category.slug}
						collections={collections}
						brands={listBrands(categoryProducts)}
						params={query}
						sort={sort}
						productCount={products.length}
						basePath={basePath}
					/>
				</div>

				<div className="mt-[52px]">
					<ProductGrid
						products={products}
						categories={categories}
						clearHref={basePath}
					/>
				</div>

				<p className="mt-14 text-[12px] text-muted-foreground">
					Prices are shown in Ghana cedis. Delivery is calculated at
					checkout, and stock is confirmed before payment is taken.
				</p>
			</section>

			{/* Without this the last line sits flush against the footer band. */}
			<div className="h-20 lg:h-28" />
		</div>
	);
}
