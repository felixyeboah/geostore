import { DEPARTMENTS, links } from "@home/data/landing";
import {
	ArrowLink,
	Container,
	Eyebrow,
	SectionHeading,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function DepartmentsSection() {
	const t = useTranslations();

	return (
		<section className="pt-20 lg:pt-[104px]">
			<Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,760px)] lg:gap-20">
				<div>
					<Eyebrow>{t("home.departments.eyebrow")}</Eyebrow>
					<SectionHeading className="mt-6">
						{t("home.departments.title1")}
						<br />
						{t("home.departments.title2")}
					</SectionHeading>
					<p className="mt-8 max-w-[370px] text-[13px] text-muted-foreground leading-[1.7]">
						{t("home.departments.description")}
					</p>
					<div className="mt-8">
						<ArrowLink href={links.shop}>
							{t("home.departments.link")}
						</ArrowLink>
					</div>
				</div>

				<ul className="grid border-border border-t sm:grid-cols-2 sm:gap-x-10">
					{DEPARTMENTS.map((department, index) => (
						<li
							key={department.key}
							className="border-border border-b"
						>
							<Link
								href={department.href}
								className="group flex items-center gap-4 py-5"
							>
								<span className="w-5 shrink-0 text-[10px] text-primary">
									{String(index + 1).padStart(2, "0")}
								</span>
								<span className="flex-1">
									<span className="block font-medium text-[15px] text-foreground leading-tight">
										{t(
											`home.departments.items.${department.key}.name`,
										)}
									</span>
									<span className="mt-1 block text-[11px] text-muted-foreground">
										{t(
											`home.departments.items.${department.key}.note`,
										)}
									</span>
								</span>
								<ArrowRightIcon className="size-3.5 shrink-0 text-foreground/70 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</li>
					))}
				</ul>
			</Container>
		</section>
	);
}
