import { ProductGrid } from "@commerce/components/ProductGrid";
import { getLiveCategories, getLiveProducts } from "@commerce/lib/live-catalog";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CategoryPageProps {
	params: Promise<{ slug: string }>;
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

export default async function CategoryPage({ params }: CategoryPageProps) {
	const { slug } = await params;
	const [categories, products] = await Promise.all([
		getLiveCategories(),
		getLiveProducts({ category: slug, sort: "featured" }),
	]);
	const category = categories.find((item) => item.slug === slug);

	if (!category) {
		notFound();
	}

	return (
		<div className="container py-8 lg:py-12">
			<nav
				aria-label="Breadcrumb"
				className="flex items-center gap-2 text-muted-foreground text-sm"
			>
				<Link href="/" className="hover:text-foreground">
					Store
				</Link>
				<span aria-hidden="true">/</span>
				<span className="text-foreground">{category.name}</span>
			</nav>

			<section className="relative mt-6 min-h-80 overflow-hidden rounded-[2rem] bg-zinc-900 text-white">
				<Image
					src={category.imageUrl}
					alt={category.name}
					fill
					priority
					sizes="100vw"
					className="object-cover opacity-55"
				/>
				<div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/50 to-transparent" />
				<div className="relative flex min-h-80 max-w-2xl flex-col justify-end p-8 sm:p-10">
					<p className="font-semibold text-white/65 text-sm">
						Shop category
					</p>
					<h1 className="mt-2 font-brand font-semibold text-5xl tracking-tight sm:text-6xl">
						{category.name}
					</h1>
					<p className="mt-4 text-white/75 leading-7">
						{category.description}
					</p>
				</div>
			</section>

			<section className="py-12">
				<div className="mb-7 flex items-end justify-between gap-4 border-b pb-5">
					<div>
						<h2 className="font-semibold text-2xl">
							Browse {category.name.toLocaleLowerCase()}
						</h2>
						<p className="mt-1 text-muted-foreground text-sm tabular-nums">
							{products.length} products
						</p>
					</div>
					<Link
						href="/"
						className="font-semibold text-primary text-sm"
					>
						View all products
					</Link>
				</div>
				<ProductGrid products={products} />
			</section>
		</div>
	);
}
