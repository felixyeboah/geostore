import { cn } from "@repo/ui";
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import type { PropsWithChildren } from "react";

export type TrendDirection = "up" | "down" | "flat";

export function trendDirection(change: number | null): TrendDirection {
	if (change === null || change === 0) {
		return "flat";
	}
	return change > 0 ? "up" : "down";
}

const TREND_STYLES: Record<TrendDirection, string> = {
	up: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	down: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
	flat: "bg-muted text-muted-foreground",
};

const TREND_ICONS = {
	up: ArrowUpRightIcon,
	down: ArrowDownRightIcon,
	flat: MinusIcon,
};

export function TrendChip({
	direction,
	children,
	className,
}: PropsWithChildren<{ direction: TrendDirection; className?: string }>) {
	const Icon = TREND_ICONS[direction];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold text-xs tabular-nums",
				TREND_STYLES[direction],
				className,
			)}
		>
			<Icon className="size-3" strokeWidth={2.75} aria-hidden="true" />
			{children}
		</span>
	);
}
