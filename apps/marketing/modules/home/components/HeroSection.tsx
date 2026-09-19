import { IMAGES, links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon, MessageCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection({ copy }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.hero");
	const tagline = t.raw("home.hero.tagline") as string[];

	return (
		<section id="top" className="border-border border-b">
			<Container className="grid gap-12 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,632px)] lg:gap-10">
				<div className="flex flex-col justify-center pt-6 lg:pt-12 lg:pb-8">
					<Eyebrow rule>{c("eyebrow")}</Eyebrow>

					<h1 className="mt-8 font-semibold text-[56px] text-foreground leading-[0.98] tracking-[-0.045em] md:text-[72px] lg:text-[84px]">
						{c("titleLine1")}
						<br />
						{c("titleLine2")}
						<br />
						{c("titleLine3")}{" "}
						<span className="text-primary">{c("titleAccent")}</span>
					</h1>

					<p className="mt-9 text-[14px] text-muted-foreground leading-[1.7]">
						{c("subtitle1")}
						<br />
						{c("subtitle2")}
					</p>

					<div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
						<Link
							href={links.shop}
							className="inline-flex h-[52px] items-center gap-6 rounded-[4px] bg-primary px-6 font-medium text-[13.5px] text-white transition-colors hover:bg-primary/90"
						>
							{c("primaryCta")}
							<ArrowRightIcon className="size-4" />
						</Link>
						<Link
							href={links.contact}
							className="inline-flex items-center gap-4 font-medium text-[13.5px] text-foreground"
						>
							{c("secondaryCta")}
							<MessageCircleIcon
								className="size-[18px] text-primary"
								strokeWidth={1.75}
							/>
						</Link>
					</div>

					<ul className="mt-14 flex items-center gap-6 text-[9.5px] text-muted-foreground uppercase tracking-[0.2em]">
						{tagline.map((item, index) => (
							<li key={item} className="flex items-center gap-6">
								{index > 0 && (
									<span
										aria-hidden="true"
										className="h-3 w-px bg-border"
									/>
								)}
								{item}
							</li>
						))}
					</ul>
				</div>

				<div className="relative aspect-[632/574] overflow-hidden rounded-[6px] bg-[#5e4e98] text-white">
					<Eyebrow className="absolute top-8 left-8 text-[10px] text-white/90">
						{t("home.hero.card.eyebrow")}
					</Eyebrow>
					<Image
						src={IMAGES.surfaceLaptop}
						alt={t("home.hero.card.product")}
						fill
						priority
						sizes="(min-width: 1024px) 632px, 100vw"
						className="object-contain p-[14%_4%_12%_2%]"
					/>
					<div className="absolute bottom-8 left-8">
						<Eyebrow className="text-[9.5px] text-white/80">
							{t("home.hero.card.spotlight")}
						</Eyebrow>
						<p className="mt-2.5 font-medium text-[15px]">
							{t("home.hero.card.product")}
						</p>
					</div>
					<Link
						href={links.category("laptops")}
						aria-label={t("home.hero.card.product")}
						className="absolute right-8 bottom-7 flex size-11 items-center justify-center rounded-full border border-white/60 transition-colors hover:bg-white/10"
					>
						<ArrowRightIcon className="size-4" />
					</Link>
				</div>
			</Container>
		</section>
	);
}
