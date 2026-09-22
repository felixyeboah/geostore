import { links, productHref } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { ArrowLink, Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function GamingSection({ copy, products }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.gaming");

	const product = products?.productId;
	if (!product) {
		return null;
	}

	return (
		<section className="bg-[#212121] text-white">
			<Container className="grid gap-12 pt-16 pb-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-20 lg:pt-[70px]">
				<div className="lg:pt-2">
					<Eyebrow rule className="text-white/90">
						{c("eyebrow")}
					</Eyebrow>
					<h2 className="mt-8 font-semibold text-[52px] leading-[1] tracking-[-0.04em] md:text-[64px]">
						{c("title1")}
						<br />
						{c("title2")}
					</h2>
					<p className="mt-8 text-[13px] text-white/70 leading-[1.7]">
						{c("subtitle1")}
						<br />
						{c("subtitle2")}
					</p>
					<Link
						href={productHref(product.slug)}
						className="mt-8 inline-flex h-[52px] items-center gap-6 rounded-[4px] bg-white px-6 font-medium text-[#1d1c1c] text-[13.5px] transition-colors hover:bg-white/90"
					>
						{c("cta")}
						<ArrowRightIcon className="size-4" />
					</Link>
					<div className="mt-9">
						<ArrowLink
							href={links.department("home-tv")}
							className="text-[11.5px] text-white"
						>
							{c("link")}
						</ArrowLink>
					</div>
				</div>

				<div>
					<div className="relative aspect-[706/342] overflow-hidden rounded-[4px] bg-[#2a2a2a]">
						{product.imageUrl ? (
							<Image
								src={product.imageUrl}
								alt={product.name}
								fill
								sizes="(min-width: 1024px) 706px, 100vw"
								className="object-contain"
							/>
						) : (
							<span className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
								Image unavailable
							</span>
						)}
					</div>
					<p className="mt-10 text-center text-[9.5px] text-white/50 uppercase tracking-[0.2em]">
						{c("caption")}
					</p>
				</div>
			</Container>
		</section>
	);
}
