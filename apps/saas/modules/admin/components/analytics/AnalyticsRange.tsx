"use client";

import { analyticsParsers } from "@admin/lib/list-params";
import { cn } from "@repo/ui";
import { useQueryStates } from "nuqs";
import { useTransition } from "react";

const OPTIONS = [
	{ days: 7 as const, label: "7 days" },
	{ days: 30 as const, label: "30 days" },
	{ days: 90 as const, label: "90 days" },
];

/**
 * The window every figure on the page is measured over.
 *
 * It was fixed at thirty days, which is the one question this screen could not
 * answer: whether a good month was a good week repeated or one good day. The
 * range lives in the URL and the database does the work, like every other
 * admin filter.
 */
export function AnalyticsRange() {
	const [isPending, startNavigation] = useTransition();
	const [params, setParams] = useQueryStates(analyticsParsers, {
		shallow: false,
		startTransition: startNavigation,
	});

	return (
		<div
			className={cn(
				"flex items-center gap-1 transition-opacity",
				isPending && "opacity-60",
			)}
		>
			{OPTIONS.map((option) => (
				<button
					key={option.days}
					type="button"
					disabled={isPending}
					onClick={() => void setParams({ days: option.days })}
					aria-pressed={params.days === option.days}
					className={cn(
						"border px-2.5 py-1 text-[12.5px] transition-colors",
						params.days === option.days
							? "border-foreground text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
