import {
	formatCedis,
	links,
	productHref,
	RAIL_PRODUCTS,
} from "@home/data/landing";
import {
	Container,
	Eyebrow,
	SectionHeader,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ProductRail() {
	const t = useTranslations();

	return (
		<section className="border-border border-t pt-16 pb-20 lg:pt-[88px] lg:pb-[88px]">
			<Container>
				<SectionHeader
					eyebrow={t("home.products.eyebrow")}
					title={t("home.products.title")}
					link={{ href: links.shop, label: t("home.products.link") }}
				/>
			</Container>

			<div className="no-scrollbar mt-10 overflow-x-auto lg:mt-12">
				<ul className="mx-auto flex w-max min-w-full max-w-[1360px] snap-x gap-6 px-6 lg:px-12">
					{RAIL_PRODUCTS.map((product) => (
						<li
							key={product.slug}
							className="w-[230px] shrink-0 snap-start sm:w-[294px]"
						>
							<Link
								href={productHref(product.slug)}
								className="group block"
							>
								<div className="relative aspect-[294/270] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
									<Image
										src={product.image}
										alt={product.name}
										fill
										sizes="300px"
										className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									/>
									{product.isNew && (
										<Eyebrow className="absolute top-3 left-3 rounded-[2px] bg-primary px-2 py-1.5 text-[8.5px] text-white">
											{t("home.products.new")}
										</Eyebrow>
									)}
								</div>
								<Eyebrow className="mt-6 text-[9.5px] text-muted-foreground">
									{product.brand}
								</Eyebrow>
								<p className="mt-2.5 font-medium text-[17px] text-foreground leading-tight">
									{product.name}
								</p>
								<p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<StarIcon className="size-3 fill-current text-foreground" />
									<span className="text-foreground">
										{product.rating.toFixed(1)}
									</span>
									<span aria-hidden="true">·</span>
									{t("home.products.reviews", {
										count: product.reviewCount,
									})}
								</p>
								<div className="mt-5 flex items-baseline justify-between gap-3 border-border border-t pt-4">
									<span className="font-medium text-[15px] text-foreground">
										{formatCedis(product.priceInPesewas)}
									</span>
									{product.compareAtInPesewas && (
										<span className="text-[11.5px] text-muted-foreground line-through">
											{formatCedis(
												product.compareAtInPesewas,
											)}
										</span>
									)}
								</div>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
