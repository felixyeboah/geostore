import { NEEDS } from "@home/data/landing";
import {
	Container,
	Eyebrow,
	SectionHeader,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function NeedsSection() {
	const t = useTranslations();

	return (
		<section className="pt-20 lg:pt-[104px]">
			<Container>
				<SectionHeader
					eyebrow={t("home.needs.eyebrow")}
					title={t("home.needs.title")}
				/>

				<ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
					{NEEDS.map((need) => (
						<li key={need.key}>
							<Link href={need.href} className="group block">
								<div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
									<Image
										src={need.image}
										alt=""
										fill
										sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
										className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									/>
									<Eyebrow className="absolute top-3 left-3 rounded-[2px] bg-white/95 px-2 py-1.5 text-[8.5px] text-foreground">
										{t(
											`home.needs.items.${need.key}.badge`,
										)}
									</Eyebrow>
								</div>
								<div className="mt-5 flex items-start justify-between gap-4">
									<div>
										<p className="font-medium text-[17px] text-foreground">
											{t(
												`home.needs.items.${need.key}.title`,
											)}
										</p>
										<p className="mt-1.5 text-[12px] text-muted-foreground leading-[1.6]">
											{t(
												`home.needs.items.${need.key}.subtitle`,
											)}
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
