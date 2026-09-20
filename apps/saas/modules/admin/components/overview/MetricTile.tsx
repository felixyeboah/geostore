import type { ReactNode } from "react";

/**
 * One figure in the strip under the headline. No tile, no border of its own:
 * the strip draws the dividers, so the numbers line up as a row of type.
 */
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
		<div className="min-w-0">
			<p className="eyebrow text-muted-foreground">{label}</p>
			<p className="mt-3 font-semibold text-[clamp(22px,2.2vw,28px)] text-foreground leading-none tracking-[-0.03em] tabular-nums">
				{value}
			</p>
			<div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
				{trend}
				{detail && (
					<span className="truncate text-[12px] text-muted-foreground tabular-nums">
						{detail}
					</span>
				)}
			</div>
		</div>
	);
}
