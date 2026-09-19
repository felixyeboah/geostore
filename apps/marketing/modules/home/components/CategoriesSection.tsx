import { CATEGORY_RAIL, links } from "@home/data/landing";
import { Container, SectionHeader } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CategoriesSection() {
	const t = useTranslations();

	return (
		<section className="py-16 lg:py-[88px]">
			<Container>
				<SectionHeader
					eyebrow={t("home.categories.eyebrow")}
					title={t("home.categories.title")}
					link={{
						href: links.shop,
						label: t("home.categories.link"),
					}}
				/>
			</Container>

			<div className="no-scrollbar mt-10 overflow-x-auto lg:mt-12">
				<ul className="mx-auto flex w-max min-w-full max-w-[1360px] snap-x gap-4 px-6 lg:px-12">
					{CATEGORY_RAIL.map((tile, index) => {
						const label = t(`home.categories.items.${tile.key}`);
						return (
							<li
								key={tile.key}
								className="w-[150px] shrink-0 snap-start sm:w-[194px]"
							>
								<Link href={tile.href} className="group block">
									<div className="relative aspect-[194/168] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
										<Image
											src={tile.image}
											alt={label}
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
											{label}
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
