import { OVERVIEW_RANGES, type OverviewRange } from "@admin/lib/overview";
import { cn } from "@repo/ui";
import Link from "next/link";

export function RangeToggle({ active }: { active: OverviewRange }) {
	return (
		<nav
			aria-label="Reporting range"
			className="flex rounded-lg border bg-background p-0.5"
		>
			{OVERVIEW_RANGES.map((range) => {
				const isActive = range === active;
				return (
					<Link
						key={range}
						href={
							range === 30
								? "/admin/overview"
								: `/admin/overview?range=${range}`
						}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"rounded-md px-2.5 py-1 font-medium text-xs tabular-nums transition-colors",
							isActive
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{range}d
					</Link>
				);
			})}
		</nav>
	);
}
