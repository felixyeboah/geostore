import { links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { ArrowLink, Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function KitchenBundleSection({ copy }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.kitchen");
	const items = t.raw("home.kitchen.items") as string[];

	return (
		<section className="pt-16 lg:pt-20">
			<Container>
				<div className="grid overflow-hidden rounded-[4px] bg-[#e9e2f0] lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
					<div className="flex flex-col justify-center px-8 py-12 lg:px-[60px] lg:py-16">
						<Eyebrow className="text-[10px] text-[#2b2247]/80">
							{c("eyebrow")}
						</Eyebrow>
						<h2 className="mt-8 font-medium text-[#2b2247] text-[36px] leading-[1.05] tracking-[-0.03em] md:text-[48px]">
							{c("title1")}
							<br />
							{c("title2")}
						</h2>
						<p className="mt-8 max-w-[420px] text-[#2b2247]/75 text-[13.5px] leading-[1.65]">
							{c("description")}
						</p>
						<ul className="mt-8 grid max-w-[460px] gap-x-8 gap-y-3 text-[#2b2247] text-[12.5px] sm:grid-cols-2">
							{items.map((item) => (
								<li
									key={item}
									className="flex items-center gap-2.5"
								>
									<CheckIcon
										className="size-3.5 text-primary"
										strokeWidth={2.5}
									/>
									{item}
								</li>
							))}
						</ul>
						<div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
							<Link
								href={links.contact}
								className="inline-flex h-[52px] items-center gap-6 rounded-[4px] bg-primary px-6 font-medium text-[13.5px] text-white transition-colors hover:bg-primary/90"
							>
								{c("cta")}
								<ArrowRightIcon className="size-4" />
							</Link>
							<ArrowLink
								href={links.category("appliances")}
								className="text-[#2b2247]"
							>
								{c("secondary")}
							</ArrowLink>
						</div>
					</div>
					<div className="relative min-h-[320px] lg:min-h-[460px]">
						<Image
							src="/images/landing/kitchen-fridge.jpg"
							alt="A tall two-door refrigerator in a bright kitchen"
							fill
							sizes="(min-width: 1024px) 460px, 100vw"
							className="object-cover"
						/>
					</div>
				</div>
			</Container>
		</section>
	);
}
