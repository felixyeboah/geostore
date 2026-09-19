import { OVERVIEW_RANGES, type OverviewRange } from "@admin/lib/overview";
import { cn } from "@repo/ui";
import Link from "next/link";

export function RangeToggle({ active }: { active: OverviewRange }) {
	return (
		<nav aria-label="Reporting range" className="flex items-center gap-2">
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
							"rounded-[2px] border px-2.5 py-[5px] font-medium text-[12.5px] tabular-nums transition-colors",
							isActive
								? "border-foreground bg-foreground text-background"
								: "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
						)}
					>
						{range} days
					</Link>
				);
			})}
		</nav>
	);
}
