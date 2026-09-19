import { ProductGallery } from "@commerce/components/ProductGallery";
import { ProductGrid } from "@commerce/components/ProductGrid";
import { VariantPicker } from "@commerce/components/VariantPicker";
import {
	getLiveCategories,
	getLiveProductBySlug,
	getLiveProducts,
} from "@commerce/lib/live-catalog";
import { storeLinks } from "@commerce/lib/store-links";
import {
	breadcrumbSchema,
	productSchema,
	StructuredData,
} from "@shared/components/StructuredData";
import {
	RotateCcwIcon,
	ShieldCheckIcon,
	StarIcon,
	TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
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

	const assurances = [
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
	];

	return (
		<div className="editorial">
			<StructuredData
				data={[
					productSchema(product),
					breadcrumbSchema([
						{ name: "Shop", path: "/shop" },
						...(category
							? [
									{
										name: category.name,
										path: `/categories/${category.slug}`,
									},
								]
							: []),
						{
							name: product.name,
							path: `/products/${product.slug}`,
						},
					]),
				]}
			/>
			<div className="mx-auto w-full max-w-[1560px] px-5 py-10 md:px-10 lg:py-14">
				<nav
					aria-label="Breadcrumb"
					className="no-scrollbar eyebrow flex items-center gap-2.5 overflow-x-auto text-muted-foreground"
				>
					<Link
						href={storeLinks.shop}
						className="shrink-0 hover:text-foreground"
					>
						Shop
					</Link>
					<span aria-hidden="true" className="shrink-0">
						/
					</span>
					{category && (
						<>
							<Link
								href={storeLinks.category(category.slug)}
								className="shrink-0 hover:text-foreground"
							>
								{category.name}
							</Link>
							<span aria-hidden="true" className="shrink-0">
								/
							</span>
						</>
					)}
					<span className="truncate text-foreground">
						{product.name}
					</span>
				</nav>

				{/* The featured-product split from the mockup: image to the
				    edge on the left, everything else in a narrower column. */}
				<section className="mt-9 grid items-stretch gap-0 lg:grid-cols-[60fr_40fr]">
					<ProductGallery
						name={product.name}
						images={
							product.images.length > 0
								? product.images
								: [product.imageUrl]
						}
						badge={
							product.isNew ? (
								<span className="eyebrow absolute top-0 left-0 bg-white px-[13px] py-2.5 text-foreground">
									Just landed
								</span>
							) : null
						}
					/>

					<div className="flex flex-col justify-center pt-8 lg:pt-0 lg:pl-16">
						<p className="eyebrow text-muted-foreground">
							{product.brand}
						</p>
						<h1 className="mt-4 font-semibold text-[clamp(28px,2.7vw,38px)] text-foreground leading-[1.05] tracking-[-0.04em]">
							{product.name}
						</h1>

						<p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
							{product.reviewCount > 0 && (
								<a
									href="#reviews"
									className="inline-flex items-center gap-1.5 text-foreground"
								>
									<StarIcon className="size-3.5 fill-current" />
									<span className="tabular-nums">
										{product.rating.toFixed(1)}
									</span>
									<span className="text-muted-foreground">
										· {product.reviewCount} verified{" "}
										{product.reviewCount === 1
											? "review"
											: "reviews"}
									</span>
								</a>
							)}
							<span className="tabular-nums">
								SKU {product.sku}
							</span>
						</p>

						<p className="mt-6 text-[15.5px] text-muted-foreground leading-[1.65]">
							{product.description}
						</p>

						<dl className="mt-8 mb-8 border-border border-t">
							{Object.entries(product.specifications).map(
								([label, value]) => (
									<div
										key={label}
										className="flex items-baseline justify-between gap-5 border-border border-b py-[11px]"
									>
										<dt className="eyebrow text-muted-foreground">
											{label}
										</dt>
										<dd className="m-0 text-right font-medium text-[13.5px] text-foreground">
											{value}
										</dd>
									</div>
								),
							)}
						</dl>

						<VariantPicker product={product} />

						<ul className="mt-9 border-border border-t">
							{assurances.map((item) => (
								<li
									key={item.title}
									className="flex gap-3 border-border border-b py-3.5"
								>
									<item.icon
										className="mt-0.5 size-[15px] shrink-0 text-muted-foreground"
										strokeWidth={1.6}
									/>
									<div>
										<p className="eyebrow text-foreground">
											{item.title}
										</p>
										<p className="mt-1.5 text-[13px] text-muted-foreground leading-[1.5]">
											{item.text}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				</section>

				<section id="reviews" className="mt-20 scroll-mt-40">
					<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
						<div>
							<p className="eyebrow mb-4 text-muted-foreground">
								In their words
							</p>
							<h2 className="font-semibold text-[clamp(26px,3.2vw,40px)] text-foreground leading-[1.05] tracking-[-0.04em]">
								What buyers said.
							</h2>
						</div>
						{product.reviewCount > 0 && (
							<p className="eyebrow text-muted-foreground tabular-nums">
								{product.rating.toFixed(1)} from{" "}
								{product.reviewCount}{" "}
								{product.reviewCount === 1
									? "review"
									: "reviews"}
							</p>
						)}
					</div>

					{product.reviewCount === 0 || !product.reviews?.length ? (
						<div className="mt-11 border-foreground border-t py-14">
							<p className="font-semibold text-[20px] text-foreground tracking-[-0.03em]">
								No reviews yet.
							</p>
							<p className="mt-2.5 max-w-[46ch] text-[14px] text-muted-foreground">
								Customers can review this item after a delivered
								purchase, so everything here is from someone who
								actually received it.
							</p>
						</div>
					) : (
						<div className="mt-11 border-foreground border-t">
							{product.reviews.map((review) => (
								<article
									key={`${review.customerName}-${review.createdAt}`}
									className="grid gap-x-14 gap-y-5 border-border border-b py-10 lg:grid-cols-[minmax(0,1fr)_300px]"
								>
									<blockquote className="m-0 text-[clamp(18px,1.6vw,22px)] text-foreground leading-[1.5] tracking-[-0.02em]">
										{review.body}
									</blockquote>
									<div className="lg:pt-1.5">
										<div
											className="mb-3.5 flex items-center gap-1 text-foreground"
											role="img"
											aria-label={`${review.rating} out of 5 stars`}
										>
											{Array.from(
												{ length: 5 },
												(_, index) => (
													<StarIcon
														key={`${review.customerName}-${index}`}
														className={`size-3.5 ${index < review.rating ? "fill-current" : "text-border"}`}
													/>
												),
											)}
										</div>
										<p className="eyebrow text-muted-foreground leading-[1.7]">
											{review.customerName}
											<br />
											Verified purchase
										</p>
									</div>
								</article>
							))}
						</div>
					)}
				</section>

				{relatedProducts.length > 0 && (
					<section className="mt-20">
						<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
							<div>
								<p className="eyebrow mb-4 text-muted-foreground">
									More in{" "}
									{category?.name ?? "this department"}
								</p>
								<h2 className="font-semibold text-[clamp(26px,3.2vw,40px)] text-foreground leading-[1.05] tracking-[-0.04em]">
									Compare your options.
								</h2>
							</div>
							{category && (
								<Link
									href={storeLinks.category(category.slug)}
									className="text-[var(--ed-accent)] underline decoration-1 underline-offset-[3px] hover:decoration-2"
								>
									All {category.name} &rarr;
								</Link>
							)}
						</div>
						<div className="mt-11">
							<ProductGrid
								products={relatedProducts}
								categories={categories}
							/>
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
