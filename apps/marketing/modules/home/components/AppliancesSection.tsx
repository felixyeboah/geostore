import { IMAGES, links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AppliancesSection({ copy }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.appliances");

	return (
		<section className="pt-16 lg:pt-20">
			<Container>
				<div className="grid overflow-hidden rounded-[4px] lg:grid-cols-2">
					<div className="relative aspect-[625/556] bg-[#1a1a1a]">
						<Image
							src={IMAGES.appliances}
							alt="A french-door refrigerator in a modern kitchen"
							fill
							sizes="(min-width: 1024px) 625px, 100vw"
							className="object-cover"
						/>
						<Eyebrow className="absolute bottom-7 left-6 bg-[#2b2b2b]/90 px-3 py-2.5 text-[9px] text-white">
							{c("badge")}
						</Eyebrow>
					</div>
					<div className="flex flex-col justify-center bg-[#efeae3] px-8 py-12 lg:px-[60px]">
						<Eyebrow className="text-[10px] text-foreground/80">
							{c("eyebrow")}
						</Eyebrow>
						<h2 className="mt-8 font-medium text-[40px] text-foreground leading-[1.05] tracking-[-0.03em] md:text-[52px]">
							{c("title1")}
							<br />
							{c("title2")}
						</h2>
						<p className="mt-8 max-w-[310px] text-[13.5px] text-muted-foreground leading-[1.65]">
							{c("description")}
						</p>
						<Link
							href={links.category("appliances")}
							className="mt-8 inline-flex h-[52px] w-fit items-center gap-6 rounded-[4px] bg-[#212121] px-6 font-medium text-[13.5px] text-white transition-colors hover:bg-[#333]"
						>
							{c("cta")}
							<ArrowRightIcon className="size-4" />
						</Link>
						<p className="mt-7 text-[9.5px] text-muted-foreground">
							{c("note")}
						</p>
					</div>
				</div>
			</Container>
		</section>
	);
}
