import { IMAGES, links } from "@home/data/landing";
import { ArrowLink, Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function GamingSection() {
	const t = useTranslations();

	return (
		<section className="bg-[#212121] text-white">
			<Container className="grid gap-12 pt-16 pb-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-20 lg:pt-[70px]">
				<div className="lg:pt-2">
					<Eyebrow rule className="text-white/90">
						{t("home.gaming.eyebrow")}
					</Eyebrow>
					<h2 className="mt-8 font-semibold text-[52px] leading-[1] tracking-[-0.04em] md:text-[64px]">
						{t("home.gaming.title1")}
						<br />
						{t("home.gaming.title2")}
					</h2>
					<p className="mt-8 text-[13px] text-white/70 leading-[1.7]">
						{t("home.gaming.subtitle1")}
						<br />
						{t("home.gaming.subtitle2")}
					</p>
					<Link
						href={links.category("gaming")}
						className="mt-8 inline-flex h-[52px] items-center gap-6 rounded-[4px] bg-white px-6 font-medium text-[#1d1c1c] text-[13.5px] transition-colors hover:bg-white/90"
					>
						{t("home.gaming.cta")}
						<ArrowRightIcon className="size-4" />
					</Link>
					<div className="mt-9">
						<ArrowLink
							href={links.category("monitors")}
							className="text-[11.5px] text-white"
						>
							{t("home.gaming.link")}
						</ArrowLink>
					</div>
				</div>

				<div>
					<div className="relative aspect-[706/342] overflow-hidden rounded-[4px] bg-[#2a2a2a]">
						<Image
							src={IMAGES.gaming}
							alt="Samsung Odyssey G9 on a desk"
							fill
							sizes="(min-width: 1024px) 706px, 100vw"
							className="object-cover"
						/>
					</div>
					<p className="mt-10 text-center text-[9.5px] text-white/50 uppercase tracking-[0.2em]">
						{t("home.gaming.caption")}
					</p>
				</div>
			</Container>
		</section>
	);
}
