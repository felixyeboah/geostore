import { cn } from "@repo/ui";
import type { PropsWithChildren } from "react";

export type TrendDirection = "up" | "down" | "flat";

export function trendDirection(change: number | null): TrendDirection {
	if (change === null || change === 0) {
		return "flat";
	}
	return change > 0 ? "up" : "down";
}

const TREND_MARKS: Record<TrendDirection, string> = {
	up: "↑",
	down: "↓",
	flat: "·",
};

/**
 * A delta, as text.
 *
 * This was a filled green or red pill. Two problems: the colour shouted louder
 * than the figure it described, and "down" is not always bad — fewer failed
 * payments is good. An arrow states the direction and leaves the reading to
 * whoever knows the business.
 */
export function TrendChip({
	direction,
	children,
	className,
}: PropsWithChildren<{ direction: TrendDirection; className?: string }>) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 font-medium text-[12.5px] tabular-nums",
				direction === "flat"
					? "text-muted-foreground"
					: "text-foreground",
				className,
			)}
		>
			<span aria-hidden="true" className="text-[11px]">
				{TREND_MARKS[direction]}
			</span>
			{children}
		</span>
	);
}
