import { DEPARTMENTS, links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import {
	ArrowLink,
	Container,
	Eyebrow,
	SectionHeading,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function DepartmentsSection({ copy, catalogue }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.departments");

	// The departments you actually stock, in the order you put them in.
	const entries = catalogue?.departments.length
		? catalogue.departments.map((department) => ({
				key: department.slug,
				href: department.href,
				name: department.name,
				note: department.description,
			}))
		: DEPARTMENTS.map((department) => ({
				key: department.key,
				href: department.href,
				name: t(`home.departments.items.${department.key}.name`),
				note: t(`home.departments.items.${department.key}.note`),
			}));

	return (
		<section className="pt-20 lg:pt-[104px]">
			<Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,760px)] lg:gap-20">
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
					<div className="mt-8">
						<ArrowLink href={links.shop}>{c("link")}</ArrowLink>
					</div>
				</div>

				<ul className="grid border-border border-t sm:grid-cols-2 sm:gap-x-10">
					{entries.map((department, index) => (
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
										{department.name}
									</span>
									<span className="mt-1 block text-[11px] text-muted-foreground">
										{department.note}
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
