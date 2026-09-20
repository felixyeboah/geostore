import { CATEGORY_RAIL, links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { Container, SectionHeader } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CategoriesSection({ copy, catalogue }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.categories");

	/*
	 * The departments you stock, in the order you arranged them in the back
	 * office. Falls back to the shipped rail when the catalogue has nothing,
	 * so this band cannot be emptied by an empty table.
	 */
	const tiles = catalogue?.departments.length
		? catalogue.departments.map((department) => ({
				key: department.slug,
				href: department.href,
				image: department.imageUrl,
				label: department.name,
			}))
		: CATEGORY_RAIL.map((tile) => ({
				key: tile.key,
				href: tile.href,
				image: tile.image,
				label: t(`home.categories.items.${tile.key}`),
			}));

	return (
		<section className="py-16 lg:py-[88px]">
			<Container>
				<SectionHeader
					eyebrow={c("eyebrow")}
					title={c("title")}
					link={{
						href: links.shop,
						label: c("link"),
					}}
				/>
			</Container>

			<div className="no-scrollbar mt-10 overflow-x-auto lg:mt-12">
				<ul className="mx-auto flex w-max min-w-full max-w-[1360px] snap-x gap-4 px-6 lg:px-12">
					{tiles.map((tile, index) => {
						return (
							<li
								key={tile.key}
								className="w-[150px] shrink-0 snap-start sm:w-[194px]"
							>
								<Link href={tile.href} className="group block">
									<div className="relative aspect-[194/168] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
										<Image
											src={tile.image}
											alt={tile.label}
											fill
											sizes="200px"
											className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
										/>
									</div>
									<div className="mt-5 flex items-center justify-between gap-2 text-[12.5px] text-foreground">
										<span className="flex items-center gap-2.5">
											<span className="text-[9px] text-muted-foreground">
												{String(index + 1).padStart(
													2,
													"0",
												)}
											</span>
											{tile.label}
										</span>
										<ArrowRightIcon className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
