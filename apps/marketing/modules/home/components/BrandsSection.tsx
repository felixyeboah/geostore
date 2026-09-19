import { Container } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";

export function BrandsSection() {
	const t = useTranslations();

	return (
		<Container>
			<div className="flex flex-col gap-8 border-border border-b py-10 lg:flex-row lg:items-center lg:gap-14 lg:py-12">
				<p className="shrink-0 text-[11px] text-muted-foreground leading-[1.7] lg:w-[110px]">
					{t("home.brands.line1")}
					<br />
					<span className="font-medium text-foreground">
						{t("home.brands.line2")}
					</span>
				</p>
				<ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-6 text-[#3c3a39] lg:justify-between">
					<li className="font-medium text-[22px] tracking-[-0.02em]">
						Apple
					</li>
					<li className="font-bold text-[17px] tracking-[-0.02em]">
						SAMSUNG
					</li>
					<li className="flex items-center gap-2 text-[20px] tracking-[-0.01em]">
						<span
							aria-hidden="true"
							className="grid grid-cols-2 gap-[2px]"
						>
							<span className="size-[7px] bg-current" />
							<span className="size-[7px] bg-current" />
							<span className="size-[7px] bg-current" />
							<span className="size-[7px] bg-current" />
						</span>
						Microsoft
					</li>
					<li className="font-bold text-[24px] italic tracking-[-0.06em]">
						hp
					</li>
					<li className="font-bold text-[20px] tracking-[-0.02em]">
						Lenovo
					</li>
					<li className="font-light text-[20px] tracking-[-0.03em]">
						PlayStation
					</li>
				</ul>
			</div>
		</Container>
	);
}
