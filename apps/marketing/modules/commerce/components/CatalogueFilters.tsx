import { SortSelect } from "@commerce/components/SortSelect";
import {
	type CatalogueSearchParams,
	catalogueHref,
	describeActiveFilters,
	PRICE_BRACKETS,
	parseBrands,
	toggleBrand,
} from "@commerce/lib/catalogue";
import { storeLinks } from "@commerce/lib/store-links";
import type {
	ProductSort,
	StoreCategory,
	StoreCollection,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import Link from "next/link";

interface CatalogueFiltersProps {
	categories: StoreCategory[];
	activeSlug?: string;
	/** Manual and smart collections, in the order they should be offered. */
	collections: StoreCollection[];
	brands: string[];
	params: CatalogueSearchParams;
	sort: ProductSort;
	/** How many products the current filters return. */
	productCount: number;
	/** Where the filter links point and where "clear" goes. */
	basePath: string;
}

const tab =
	"-mb-1.5 shrink-0 border-b-2 border-transparent pb-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground";
const tabActive = "border-foreground font-medium text-foreground";

const pill =
	"shrink-0 rounded-[2px] border border-border px-2.5 py-[5px] text-[12.5px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground";
const pillActive =
	"border-foreground bg-foreground font-medium text-background hover:text-background";

const rowLabel = "eyebrow shrink-0 text-muted-foreground";

/**
 * The filter bar from design/landing-v5/02-editorial.html, widened into a
 * working set: departments and sort, then collections, brands, price bands and
 * the two switches that matter most in a shop with real stock. Everything is a
 * link except the sort select, so the whole thing works without JavaScript and
 * each state is a shareable URL.
 *
 * Departments answer "what kind of thing is it" and collections answer "what do
 * I want to do". They are alternative ways in rather than filters that stack,
 * so choosing one clears the other. Brand, price and the switches compound with
 * whichever is active.
 */
export function CatalogueFilters({
	categories,
	activeSlug,
	collections,
	brands,
	params,
	sort,
	productCount,
	basePath,
}: CatalogueFiltersProps) {
	const activeBrands = parseBrands(params.brand);
	const chips = describeActiveFilters(params, collections);

	return (
		<div className="border-t border-t-foreground border-b border-b-border">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
				<nav
					aria-label="Departments"
					className="no-scrollbar flex max-w-full items-center gap-[22px] overflow-x-auto"
				>
					<Link
						href={catalogueHref(storeLinks.shop, params, {
							collection: null,
						})}
						className={cn(
							tab,
							!activeSlug && !params.collection && tabActive,
						)}
						aria-current={
							!activeSlug && !params.collection
								? "page"
								: undefined
						}
					>
						All
					</Link>
					{categories.map((category) => {
						const isActive = category.slug === activeSlug;
						return (
							<Link
								key={category.slug}
								href={catalogueHref(
									storeLinks.category(category.slug),
									params,
									{ collection: null },
								)}
								className={cn(tab, isActive && tabActive)}
								aria-current={isActive ? "page" : undefined}
							>
								{category.name}
							</Link>
						);
					})}
				</nav>
				<SortSelect basePath={basePath} params={params} sort={sort} />
			</div>

			{collections.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-border border-t py-3">
					<span className={rowLabel}>Shop by</span>
					<div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-x-visible">
						{collections.map((collection) => {
							const isActive =
								params.collection === collection.slug;
							return (
								<Link
									key={collection.slug}
									// A collection is a way in, not a filter on
									// top of a department, so this leaves the
									// department page for the full shop.
									href={catalogueHref(
										storeLinks.shop,
										params,
										{
											collection: isActive
												? null
												: collection.slug,
										},
									)}
									className={cn(pill, isActive && pillActive)}
									aria-pressed={isActive}
								>
									{collection.name}
								</Link>
							);
						})}
					</div>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-border border-t py-3">
				<span className={rowLabel}>Brand</span>
				<div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-x-visible">
					{brands.map((item) => {
						const isActive = activeBrands.includes(item);
						const next = toggleBrand(activeBrands, item).join(",");
						return (
							<Link
								key={item}
								href={catalogueHref(basePath, params, {
									brand: next || null,
								})}
								className={cn(pill, isActive && pillActive)}
								aria-pressed={isActive}
							>
								{item}
							</Link>
						);
					})}
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-border border-t py-3">
				<span className={rowLabel}>Price</span>
				<div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-x-visible">
					{PRICE_BRACKETS.map((bracket) => {
						const isActive = params.price === bracket.id;
						return (
							<Link
								key={bracket.id}
								href={catalogueHref(basePath, params, {
									price: isActive ? null : bracket.id,
								})}
								className={cn(pill, isActive && pillActive)}
								aria-pressed={isActive}
							>
								{bracket.label}
							</Link>
						);
					})}
				</div>

				<div className="ml-auto flex items-center gap-2">
					<Link
						href={catalogueHref(basePath, params, {
							stock: params.stock === "in" ? null : "in",
						})}
						className={cn(
							pill,
							params.stock === "in" && pillActive,
						)}
						aria-pressed={params.stock === "in"}
					>
						In stock
					</Link>
					<Link
						href={catalogueHref(basePath, params, {
							sale: params.sale === "1" ? null : "1",
						})}
						className={cn(pill, params.sale === "1" && pillActive)}
						aria-pressed={params.sale === "1"}
					>
						Reduced
					</Link>
				</div>
			</div>

			{chips.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-border border-t py-3">
					<p className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
						<span className="font-medium text-foreground">
							{productCount}
						</span>{" "}
						{productCount === 1 ? "product" : "products"}
					</p>

					<ul className="flex flex-wrap items-center gap-2">
						{chips.map((chip) => (
							<li key={chip.label}>
								<Link
									href={catalogueHref(
										basePath,
										params,
										chip.patch,
									)}
									className="inline-flex items-center gap-2 rounded-[2px] border border-foreground px-2.5 py-[5px] font-medium text-[12.5px] text-foreground transition-colors hover:bg-foreground hover:text-background"
								>
									<span className="max-w-[22ch] truncate">
										{chip.label}
									</span>
									<span
										aria-hidden="true"
										className="text-[14px] leading-none"
									>
										×
									</span>
									<span className="sr-only">
										Remove this filter
									</span>
								</Link>
							</li>
						))}
					</ul>

					<Link
						href={basePath}
						className="ml-auto shrink-0 border-border border-b pb-px text-[13px] text-foreground transition-colors hover:border-foreground"
					>
						Clear all
					</Link>
				</div>
			)}
		</div>
	);
}
