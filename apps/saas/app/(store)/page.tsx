import { ProductGrid } from "@commerce/components/ProductGrid";
import { getLiveCategories, getLiveProducts } from "@commerce/lib/live-catalog";
import type { ProductSort } from "@commerce/types";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	BadgeCheckIcon,
	HeadphonesIcon,
	ShieldCheckIcon,
	TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Shop phones, audio and home tech",
	description:
		"Shop carefully selected phones, audio, wearables and home technology with delivery across Ghana.",
};

interface StorePageProps {
	searchParams: Promise<{
		q?: string;
		brand?: string;
		sort?: string;
	}>;
}

const PRODUCT_SORTS: ProductSort[] = [
	"featured",
	"price-asc",
	"price-desc",
	"rating",
];

function parseSort(value?: string): ProductSort {
	return PRODUCT_SORTS.includes(value as ProductSort)
		? (value as ProductSort)
		: "featured";
}

export default async function StorePage({ searchParams }: StorePageProps) {
	const params = await searchParams;
	const sort = parseSort(params.sort);
	const [categories, products, allProducts] = await Promise.all([
		getLiveCategories(),
		getLiveProducts({
			query: params.q,
			brand: params.brand,
			sort,
		}),
		getLiveProducts(),
	]);
	const isFiltered = Boolean(params.q || params.brand);

	return (
		<>
			<section className="container py-8 lg:py-12">
				<div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] bg-[#171b18] text-white lg:min-h-[38rem]">
					<Image
						src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1800&q=90"
						alt="Smartphone displayed on a dark surface"
						fill
						priority
						sizes="100vw"
						className="object-cover object-center opacity-65 lg:object-[70%_50%]"
					/>
					<div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/5" />
					<div className="relative flex min-h-[34rem] max-w-3xl flex-col justify-end p-7 sm:p-10 lg:min-h-[38rem] lg:p-14">
						<p className="font-semibold text-sm text-white/70 tracking-wide">
							Tech that fits real life
						</p>
						<h1 className="mt-4 text-balance font-brand font-semibold text-5xl leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
							Find the right gadget without the guesswork.
						</h1>
						<p className="mt-5 max-w-[55ch] text-pretty text-base text-white/75 leading-7 sm:text-lg">
							Clear product details, useful local support, and
							delivery across Ghana. Start with what you need, not
							a wall of options.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button
								size="lg"
								className="bg-white text-zinc-950 hover:bg-white/90"
								asChild
							>
								<a href="#products">
									Browse products{" "}
									<ArrowRightIcon className="size-4" />
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-white/25 bg-white/5 text-white hover:bg-white/10"
								asChild
							>
								<Link href="/categories/phones">
									Shop phones
								</Link>
							</Button>
						</div>
					</div>
				</div>

				<div className="grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-3">
					{[
						{
							icon: BadgeCheckIcon,
							title: "Carefully checked",
							body: "Clear condition and warranty details",
						},
						{
							icon: TruckIcon,
							title: "Delivery across Ghana",
							body: "Your delivery cost is shown before payment",
						},
						{
							icon: HeadphonesIcon,
							title: "Support you can reach",
							body: "Help before and after your purchase",
						},
					].map((item) => (
						<div
							key={item.title}
							className="flex items-start gap-3 bg-background px-5 py-5"
						>
							<item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
							<div>
								<p className="font-semibold text-sm">
									{item.title}
								</p>
								<p className="mt-1 text-muted-foreground text-xs leading-5">
									{item.body}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="container py-10 lg:py-16">
				<div className="flex items-end justify-between gap-6">
					<div>
						<p className="font-semibold text-primary text-sm">
							Shop by category
						</p>
						<h2 className="mt-2 text-balance font-brand font-semibold text-3xl tracking-tight sm:text-4xl">
							A useful place to start.
						</h2>
					</div>
				</div>

				<div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
					{categories.map((category, index) => (
						<Link
							key={category.slug}
							href={`/categories/${category.slug}`}
							className={`group relative overflow-hidden rounded-2xl bg-muted ${index === 0 ? "col-span-2 aspect-[2/1] lg:col-span-1 lg:aspect-[4/5]" : "aspect-[4/5]"}`}
						>
							<Image
								src={category.imageUrl}
								alt={category.name}
								fill
								sizes="(min-width: 1024px) 25vw, 50vw"
								className="object-cover transition duration-500 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
							<div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
								<h3 className="font-semibold text-lg sm:text-xl">
									{category.name}
								</h3>
								<p className="mt-1 hidden text-white/70 text-sm sm:block">
									{category.description}
								</p>
							</div>
						</Link>
					))}
				</div>
			</section>

			<section
				id="products"
				className="container scroll-mt-40 py-10 lg:py-16"
			>
				<div className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="font-semibold text-primary text-sm">
							{isFiltered
								? "Search results"
								: "Customer favourites"}
						</p>
						<h2 className="mt-2 font-brand font-semibold text-3xl tracking-tight sm:text-4xl">
							{params.q
								? `Results for “${params.q}”`
								: params.brand
									? `${params.brand} products`
									: "Products worth a closer look."}
						</h2>
						<p className="mt-2 text-muted-foreground text-sm tabular-nums">
							{products.length} of {allProducts.length} products
						</p>
					</div>

					<form
						action="/"
						className="flex flex-wrap items-center gap-2"
					>
						{params.q && (
							<input type="hidden" name="q" value={params.q} />
						)}
						{params.brand && (
							<input
								type="hidden"
								name="brand"
								value={params.brand}
							/>
						)}
						<label
							htmlFor="sort"
							className="text-muted-foreground text-sm"
						>
							Sort by
						</label>
						<select
							id="sort"
							name="sort"
							defaultValue={sort}
							className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
						>
							<option value="featured">Featured</option>
							<option value="rating">Top rated</option>
							<option value="price-asc">
								Price: low to high
							</option>
							<option value="price-desc">
								Price: high to low
							</option>
						</select>
						<Button type="submit" variant="secondary" size="sm">
							Apply
						</Button>
					</form>
				</div>

				<div className="mt-8">
					<ProductGrid products={products} />
				</div>
			</section>

			<section className="container py-10 lg:py-16">
				<div className="grid overflow-hidden rounded-[2rem] bg-[#e9f0e8] text-[#142016] lg:grid-cols-[1fr_0.9fr]">
					<div className="p-8 sm:p-10 lg:p-14">
						<ShieldCheckIcon className="size-8" />
						<h2 className="mt-8 max-w-xl text-balance font-brand font-semibold text-4xl tracking-tight sm:text-5xl">
							Useful advice before you spend.
						</h2>
						<p className="mt-4 max-w-[55ch] text-[#405144] leading-7">
							Not sure whether the upgrade is worth it? Tell us
							how you use your device and your budget. We’ll help
							narrow the options without pushing the most
							expensive one.
						</p>
						<a
							href="mailto:support@geostoresgh.com"
							className="mt-7 inline-flex items-center gap-2 border-b border-current pb-1 font-semibold"
						>
							Ask the store <ArrowRightIcon className="size-4" />
						</a>
					</div>
					<div className="relative min-h-80">
						<Image
							src="https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1200&q=85"
							alt="A selection of smartphones arranged on a table"
							fill
							sizes="(min-width: 1024px) 45vw, 100vw"
							className="object-cover"
						/>
					</div>
				</div>
			</section>
		</>
	);
}
