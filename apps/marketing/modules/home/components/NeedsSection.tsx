import { IMAGES, NEEDS } from "@home/data/landing";

/** Used when a collection has no tile image of its own. */
const PLACEHOLDER_IMAGE = IMAGES.appliances;

import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import {
	Container,
	Eyebrow,
	SectionHeader,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function NeedsSection({ copy, catalogue }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.needs");

	/*
	 * The collections an editor flagged for the landing page, falling back to
	 * the shipped tiles when none are flagged — a band of the shop window is
	 * never left empty by an empty table.
	 */
	const tiles = catalogue?.collections.length
		? catalogue.collections.map((collection) => ({
				key: collection.slug,
				href: collection.href,
				image: collection.imageUrl ?? PLACEHOLDER_IMAGE,
				badge: null,
				title: collection.name,
				subtitle: collection.description,
			}))
		: NEEDS.map((need) => ({
				key: need.key,
				href: need.href,
				image: need.image,
				badge: t(`home.needs.items.${need.key}.badge`),
				title: t(`home.needs.items.${need.key}.title`),
				subtitle: t(`home.needs.items.${need.key}.subtitle`),
			}));

	return (
		<section className="pt-20 lg:pt-[104px]">
			<Container>
				<SectionHeader eyebrow={c("eyebrow")} title={c("title")} />

				<ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
					{tiles.map((tile) => (
						<li key={tile.key}>
							<Link href={tile.href} className="group block">
								<div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
									<Image
										src={tile.image}
										alt=""
										fill
										sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
										className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									/>
									{tile.badge && (
										<Eyebrow className="absolute top-3 left-3 rounded-[2px] bg-white/95 px-2 py-1.5 text-[8.5px] text-foreground">
											{tile.badge}
										</Eyebrow>
									)}
								</div>
								<div className="mt-5 flex items-start justify-between gap-4">
									<div>
										<p className="font-medium text-[17px] text-foreground">
											{tile.title}
										</p>
										<p className="mt-1.5 text-[12px] text-muted-foreground leading-[1.6]">
											{tile.subtitle}
										</p>
									</div>
									<ArrowRightIcon className="mt-1.5 size-4 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5" />
								</div>
							</Link>
						</li>
					))}
				</ul>
			</Container>
		</section>
	);
}
