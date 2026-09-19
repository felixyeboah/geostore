import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import {
	Container,
	Eyebrow,
	SectionHeading,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { LayoutGridIcon, MessageCircleIcon, SearchIcon } from "lucide-react";

const ABOUT_ITEMS = [
	{ key: "wider", icon: LayoutGridIcon },
	{ key: "fit", icon: SearchIcon },
	{ key: "conversation", icon: MessageCircleIcon },
] as const;

export function AboutSection({ copy }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.about");

	return (
		<section id="about" className="scroll-mt-24 py-20 lg:py-[104px]">
			<Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,538px)] lg:gap-20">
				<div>
					<Eyebrow>{c("eyebrow")}</Eyebrow>
					<SectionHeading className="mt-6">
						{c("title1")}
						<br />
						{c("title2")}
					</SectionHeading>
					<p className="mt-8 max-w-[370px] text-[13px] text-muted-foreground leading-[1.7]">
						{c("description")}
					</p>
				</div>

				<ul>
					{ABOUT_ITEMS.map((item) => (
						<li
							key={item.key}
							className="flex gap-6 border-border border-b py-7 first:pt-0"
						>
							<item.icon
								className="mt-0.5 size-5 shrink-0 text-primary"
								strokeWidth={1.75}
							/>
							<div>
								<p className="font-medium text-[17px] text-foreground">
									{t(`home.about.items.${item.key}.title`)}
								</p>
								<p className="mt-2 max-w-[370px] text-[12.5px] text-muted-foreground leading-[1.65]">
									{t(
										`home.about.items.${item.key}.description`,
									)}
								</p>
							</div>
						</li>
					))}
				</ul>
			</Container>
		</section>
	);
}
