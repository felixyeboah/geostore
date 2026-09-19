import type { StatusTone } from "@admin/lib/overview";
import { cn } from "@repo/ui";
import { ArrowRightIcon } from "lucide-react";
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
	/** Kept for the call sites; the list leads with the count instead. */
	icon?: ReactNode;
}

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
				<ul>
					{open.map((item) => (
						<li key={item.key} className="border-border border-b">
							<Link
								href={item.href}
								className="group flex items-baseline gap-4 py-3.5"
							>
								{/*
								 * The count leads, because it is the thing
								 * being triaged. Only a genuinely urgent
								 * queue is inked; the rest stay quiet so the
								 * urgent one is visible at a glance.
								 */}
								<span
									className={cn(
										"w-7 shrink-0 font-semibold text-[17px] tabular-nums",
										item.tone === "danger"
											? "text-[var(--ed-accent)]"
											: "text-foreground",
									)}
								>
									{item.count}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate font-medium text-[13.5px] text-foreground">
										{item.title}
									</span>
									<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
										{item.description}
									</span>
								</span>
								<ArrowRightIcon className="size-3.5 shrink-0 self-center text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</li>
					))}
				</ul>
			)}
		</SectionCard>
	);
}
