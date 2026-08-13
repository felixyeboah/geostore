import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { ProductGrid } from "@commerce/components/ProductGrid";
import {
	getLiveCategories,
	getLiveProductBySlug,
	getLiveProducts,
} from "@commerce/lib/live-catalog";
import { formatMoney } from "@commerce/lib/money";
import {
	BadgeCheckIcon,
	ChevronRightIcon,
	RotateCcwIcon,
	ShieldCheckIcon,
	StarIcon,
	TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ProductPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: ProductPageProps): Promise<Metadata> {
	const { slug } = await params;
	const product = await getLiveProductBySlug(slug);

	return product
		? {
				title: product.name,
				description: product.shortDescription,
				openGraph: { images: [product.imageUrl] },
			}
		: { title: "Product not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { slug } = await params;
	const product = await getLiveProductBySlug(slug);

	if (!product) {
		notFound();
	}

	const [categories, categoryProducts] = await Promise.all([
		getLiveCategories(),
		getLiveProducts({ category: product.categorySlug }),
	]);
	const category = categories.find(
		(item) => item.slug === product.categorySlug,
	);
	const relatedProducts = categoryProducts
		.filter((item) => item.id !== product.id)
		.slice(0, 4);

	return (
		<div className="container py-8 lg:py-12">
			<nav
				aria-label="Breadcrumb"
				className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-muted-foreground text-sm"
			>
				<Link href="/" className="shrink-0 hover:text-foreground">
					Store
				</Link>
				<ChevronRightIcon
					className="size-3.5 shrink-0"
					aria-hidden="true"
				/>
				{category && (
					<>
						<Link
							href={`/categories/${category.slug}`}
							className="shrink-0 hover:text-foreground"
						>
							{category.name}
						</Link>
						<ChevronRightIcon
							className="size-3.5 shrink-0"
							aria-hidden="true"
						/>
					</>
				)}
				<span className="truncate text-foreground">{product.name}</span>
			</nav>

			<section className="mt-7 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
				<div>
					<div className="relative aspect-square overflow-hidden rounded-[2rem] bg-muted">
						<Image
							src={product.imageUrl}
							alt={product.name}
							fill
							priority
							sizes="(min-width: 1024px) 58vw, 100vw"
							className="object-cover"
						/>
						{product.isNew && (
							<span className="absolute top-5 left-5 rounded-md bg-foreground px-3 py-1.5 font-semibold text-background text-sm">
								New arrival
							</span>
						)}
					</div>
				</div>

				<div className="lg:sticky lg:top-40 lg:self-start">
					<p className="font-semibold text-primary text-sm">
						{product.brand}
					</p>
					<h1 className="mt-3 text-balance font-brand font-semibold text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
						{product.name}
					</h1>
					<div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
						<span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
							<StarIcon className="size-4 fill-current text-amber-500" />{" "}
							{product.rating}
						</span>
						<a
							href="#reviews"
							className="text-muted-foreground underline-offset-4 hover:underline"
						>
							{product.reviewCount} verified reviews
						</a>
						<span className="text-muted-foreground">
							SKU {product.sku}
						</span>
					</div>

					<p className="mt-7 text-pretty text-muted-foreground leading-7">
						{product.description}
					</p>

					<div className="mt-7 flex items-end gap-3 border-y py-5">
						<p className="font-semibold text-3xl tracking-tight tabular-nums">
							{formatMoney(product.priceInPesewas)}
						</p>
						{product.compareAtInPesewas && (
							<p className="pb-1 text-muted-foreground line-through tabular-nums">
								{formatMoney(product.compareAtInPesewas)}
							</p>
						)}
					</div>

					<div className="mt-5 flex items-center gap-2 text-sm">
						<span
							className={`size-2 rounded-full ${product.stockQuantity > 0 ? "bg-emerald-500" : "bg-destructive"}`}
						/>
						<span className="font-medium">
							{product.stockQuantity > 0
								? "In stock"
								: "Out of stock"}
						</span>
						{product.stockQuantity > 0 &&
							product.stockQuantity <= 5 && (
								<span className="text-muted-foreground">
									— only {product.stockQuantity} left
								</span>
							)}
					</div>

					<AddToCartButton
						product={product}
						size="lg"
						className="mt-5 h-12 w-full text-base"
					/>
					<p className="mt-3 text-center text-muted-foreground text-xs">
						No payment is taken until you confirm the mock checkout.
					</p>

					<div className="mt-7 divide-y rounded-2xl bg-muted/55 px-5">
						{[
							{
								icon: TruckIcon,
								title: "Delivery across Ghana",
								text: "Exact delivery cost and timing appear at checkout.",
							},
							{
								icon: ShieldCheckIcon,
								title: "Warranty included",
								text:
									product.specifications.Warranty ??
									"Warranty details are confirmed before delivery.",
							},
							{
								icon: RotateCcwIcon,
								title: "Straightforward returns",
								text: "Contact us within 7 days if the item arrives faulty.",
							},
						].map((item) => (
							<div key={item.title} className="flex gap-3 py-4">
								<item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
								<div>
									<p className="font-semibold text-sm">
										{item.title}
									</p>
									<p className="mt-1 text-muted-foreground text-xs leading-5">
										{item.text}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="grid gap-10 border-t py-14 lg:mt-16 lg:grid-cols-[0.7fr_1.3fr]">
				<div>
					<p className="font-semibold text-primary text-sm">
						Product details
					</p>
					<h2 className="mt-2 font-brand font-semibold text-3xl tracking-tight">
						What to know.
					</h2>
					<p className="mt-4 max-w-md text-muted-foreground text-sm leading-6">
						The details that matter when comparing this product with
						another option.
					</p>
				</div>
				<dl className="divide-y border-y">
					{Object.entries(product.specifications).map(
						([label, value]) => (
							<div
								key={label}
								className="grid grid-cols-[0.75fr_1.25fr] gap-4 py-4 text-sm"
							>
								<dt className="text-muted-foreground">
									{label}
								</dt>
								<dd className="font-medium">{value}</dd>
							</div>
						),
					)}
				</dl>
			</section>

			<section id="reviews" className="scroll-mt-40 border-t py-14">
				<div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
					<div>
						<p className="font-semibold text-primary text-sm">
							Verified customer reviews
						</p>
						<div className="mt-3 flex items-end gap-3">
							<span className="font-semibold text-5xl tabular-nums">
								{product.rating}
							</span>
							<span className="pb-1 text-muted-foreground text-sm">
								from {product.reviewCount} reviews
							</span>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{product.reviews?.map((review) => (
							<article
								key={`${review.customerName}-${review.createdAt}`}
								className="rounded-2xl bg-muted/55 p-5"
							>
								<div
									className="flex items-center gap-1 text-amber-500"
									role="img"
									aria-label={`${review.rating} out of 5 stars`}
								>
									{Array.from({ length: 5 }, (_, index) => (
										<StarIcon
											key={`${review.customerName}-${index}`}
											className={`size-3.5 ${index < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
										/>
									))}
								</div>
								<h3 className="mt-4 font-semibold">
									{review.title}
								</h3>
								<p className="mt-2 text-muted-foreground text-sm leading-6">
									{review.body}
								</p>
								<p className="mt-4 inline-flex items-center gap-1.5 font-medium text-xs">
									<BadgeCheckIcon className="size-3.5 text-emerald-600" />{" "}
									{review.customerName} · Verified purchase
								</p>
							</article>
						))}
						{product.reviewCount === 0 && (
							<div className="rounded-2xl bg-muted/55 p-6 sm:col-span-2">
								<h3 className="font-semibold">
									No reviews yet
								</h3>
								<p className="mt-2 text-muted-foreground text-sm leading-6">
									Customers can review this item after a
									delivered purchase.
								</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{relatedProducts.length > 0 && (
				<section className="border-t py-14">
					<div className="mb-8 flex items-end justify-between gap-4">
						<div>
							<p className="font-semibold text-primary text-sm">
								More in {category?.name ?? "this category"}
							</p>
							<h2 className="mt-2 font-brand font-semibold text-3xl tracking-tight">
								Compare your options.
							</h2>
						</div>
						{category && (
							<Link
								href={`/categories/${category.slug}`}
								className="font-semibold text-primary text-sm"
							>
								View category
							</Link>
						)}
					</div>
					<ProductGrid products={relatedProducts} />
				</section>
			)}
		</div>
	);
}
