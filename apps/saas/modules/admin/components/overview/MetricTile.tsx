import type { ReactNode } from "react";
import { SectionCard } from "./SectionCard";

export function MetricTile({
	label,
	value,
	trend,
	detail,
}: {
	label: string;
	value: string;
	trend: ReactNode;
	detail?: string;
}) {
	return (
		<SectionCard className="px-4 py-3.5 sm:px-5">
			<p className="font-medium text-muted-foreground text-xs sm:text-[13px]">
				{label}
			</p>
			<p className="mt-2 font-semibold text-2xl tracking-tight tabular-nums">
				{value}
			</p>
			<div className="mt-2.5 flex items-center gap-2">
				{trend}
				{detail && (
					<span className="truncate text-muted-foreground/80 text-xs tabular-nums">
						{detail}
					</span>
				)}
			</div>
		</SectionCard>
	);
}
