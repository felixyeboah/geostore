import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { parseBrandList } from "@repo/commerce";
import { Container } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import type { ReactNode } from "react";

/**
 * The brands this band ships with, typeset to read as their wordmarks.
 *
 * These were hardcoded in the markup, which is why nobody could add or remove
 * one. They are keyed by name now so an editor can choose which appear, and a
 * brand from the catalogue with no entry here still shows — in the plain
 * setting below — rather than being silently dropped.
 */
const WORDMARKS: Record<string, { className: string; render?: ReactNode }> = {
	Apple: { className: "font-medium text-[22px] tracking-[-0.02em]" },
	Samsung: { className: "font-bold text-[17px] tracking-[-0.02em]" },
	Microsoft: {
		className: "flex items-center gap-2 text-[20px] tracking-[-0.01em]",
		render: (
			<>
				<span aria-hidden="true" className="grid grid-cols-2 gap-[2px]">
					<span className="size-[7px] bg-current" />
					<span className="size-[7px] bg-current" />
					<span className="size-[7px] bg-current" />
					<span className="size-[7px] bg-current" />
				</span>
				Microsoft
			</>
		),
	},
	HP: { className: "font-bold text-[24px] italic tracking-[-0.06em]" },
	Lenovo: { className: "font-bold text-[20px] tracking-[-0.02em]" },
	PlayStation: { className: "font-light text-[20px] tracking-[-0.03em]" },
};

/** What the band shows when an editor has not chosen. */
const SHIPPED_BRANDS = [
	"Apple",
	"Samsung",
	"Microsoft",
	"HP",
	"Lenovo",
	"PlayStation",
];

const PLAIN = "font-medium text-[19px] tracking-[-0.02em]";

/** Apple's wordmark is capitalised; SAMSUNG's is not. */
const DISPLAY_NAME: Record<string, string> = { Samsung: "SAMSUNG", HP: "hp" };

export function BrandsSection({ copy }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.brands");

	const chosen = parseBrandList(copy?.brandList);
	const brands = chosen.length > 0 ? chosen : SHIPPED_BRANDS;

	return (
		<Container>
			<div className="flex flex-col gap-8 border-border border-b py-10 lg:flex-row lg:items-center lg:gap-14 lg:py-12">
				<p className="shrink-0 text-[11px] text-muted-foreground leading-[1.7] lg:w-[110px]">
					{c("line1")}
					<br />
					<span className="font-medium text-foreground">
						{c("line2")}
					</span>
				</p>
				<ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-6 text-[#3c3a39] lg:justify-between">
					{brands.map((brand) => {
						const wordmark = WORDMARKS[brand];
						return (
							<li
								key={brand}
								className={wordmark?.className ?? PLAIN}
							>
								{wordmark?.render ??
									DISPLAY_NAME[brand] ??
									brand}
							</li>
						);
					})}
				</ul>
			</div>
		</Container>
	);
}
