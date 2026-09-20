"use client";

import { useFormatter } from "@shared/lib/translations";
import type { ReactNode } from "react";

export type ChangelogItem = {
	date: string;
	title: string;
	changes: ReactNode[];
};

export function ChangelogSection() {
	const formatter = useFormatter();

	const items: ChangelogItem[] = [
		{
			date: "2026-01-30",
			title: "Performance Improvements",
			changes: ["🚀 Improved performance"],
		},
		{
			date: "2026-01-26",
			title: "Design Updates",
			changes: ["🎨 Updated design", "🐞 Fixed a bug"],
		},
		{
			date: "2026-01-12",
			title: "New Features",
			changes: ["🎉 Added new feature", "🐞 Fixed a bug"],
		},
	];

	return (
		<section id="changelog" className="border-foreground border-t">
			{items?.map((item) => (
				<article
					key={item.date}
					className="grid gap-x-14 gap-y-4 border-border border-b py-10 lg:grid-cols-[200px_minmax(0,1fr)]"
				>
					<p className="eyebrow text-muted-foreground lg:pt-1.5">
						{formatter.dateTime(new Date(item.date))}
					</p>
					<div>
						<h2 className="font-semibold text-[clamp(20px,1.8vw,26px)] text-foreground leading-[1.15] tracking-[-0.035em]">
							{item.title}
						</h2>
						<ul className="mt-5 space-y-2.5">
							{item.changes.map((change, index) => (
								<li
									key={index}
									className="flex gap-3 text-[14.5px] text-muted-foreground leading-[1.6]"
								>
									<span
										aria-hidden="true"
										className="mt-[9px] size-1 shrink-0 rounded-full bg-border"
									/>
									{change}
								</li>
							))}
						</ul>
					</div>
				</article>
			))}
		</section>
	);
}
