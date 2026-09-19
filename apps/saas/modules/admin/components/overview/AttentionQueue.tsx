import type { StatusTone } from "@admin/lib/overview";
import { cn } from "@repo/ui";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyRow, SectionCard, SectionHead } from "./SectionCard";

export interface AttentionItem {
	key: string;
	title: string;
	description: string;
	count: number;
	href: string;
	tone: StatusTone;
	icon: ReactNode;
}

const ICON_TONES: Record<StatusTone, string> = {
	danger: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
	warning:
		"border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	info: "border-primary/15 bg-accent text-accent-foreground",
	success:
		"border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	neutral: "border-border bg-muted text-muted-foreground",
};

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
	const open = items.filter((item) => item.count > 0);
	const total = open.reduce((sum, item) => sum + item.count, 0);

	return (
		<SectionCard>
			<SectionHead
				title="Needs attention"
				description={
					total
						? `${total} ${total === 1 ? "item" : "items"} across ${open.length} ${open.length === 1 ? "queue" : "queues"}`
						: "Nothing is waiting on you"
				}
			/>
			{open.length === 0 ? (
				<EmptyRow>All queues are clear.</EmptyRow>
			) : (
				<ul className="divide-y">
					{open.map((item) => (
						<li key={item.key}>
							<Link
								href={item.href}
								className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 sm:px-5"
							>
								<span
									aria-hidden="true"
									className={cn(
										"grid size-7 shrink-0 place-items-center rounded-lg border [&>svg]:size-3.5",
										ICON_TONES[item.tone],
									)}
								>
									{item.icon}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block font-medium text-[13px]">
										{item.title}
									</span>
									<span className="block text-muted-foreground text-xs">
										{item.description}
									</span>
								</span>
								<span className="font-semibold text-sm tabular-nums">
									{item.count}
								</span>
								<ChevronRightIcon className="size-3.5 text-muted-foreground/50" />
							</Link>
						</li>
					))}
				</ul>
			)}
		</SectionCard>
	);
}
