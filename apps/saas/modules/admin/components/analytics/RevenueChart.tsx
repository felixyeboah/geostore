"use client";

import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { useState } from "react";

export interface RevenueDay {
	date: string;
	orders: number;
	revenueInPesewas: number;
}

/**
 * Daily paid revenue.
 *
 * Bars rather than a line: a day either took money or it did not, and a line
 * drawn through a run of empty days implies a trend that never happened. Days
 * with orders but no realised revenue keep a visible stub, so a run of unpaid
 * attempts is not mistaken for a quiet week.
 *
 * The readout sits above the chart rather than in a tooltip that follows the
 * pointer — it never covers the bars it describes, and it is still there when
 * the pointer leaves.
 */
export function RevenueChart({ days }: { days: RevenueDay[] }) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const peak = Math.max(...days.map((day) => day.revenueInPesewas), 1);
	// By index, not by value: two days can take exactly the same money, and
	// marking both of them "best day" reads as a bug.
	const bestIndex = days.reduce(
		(leader, day, index) =>
			day.revenueInPesewas > (days[leader]?.revenueInPesewas ?? -1)
				? index
				: leader,
		0,
	);
	const best = days[bestIndex];
	const active = activeIndex === null ? null : days[activeIndex];
	const shown = active ?? best;

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat("en-GH", {
			weekday: "short",
			day: "numeric",
			month: "short",
		}).format(new Date(value));

	return (
		<section>
			<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
				<div>
					<h2 className="eyebrow text-muted-foreground">
						Daily paid revenue
					</h2>
					<p className="mt-2 font-semibold text-[22px] text-foreground tabular-nums tracking-[-0.02em]">
						{shown ? formatMoney(shown.revenueInPesewas) : "—"}
					</p>
				</div>
				<p className="text-[12.5px] text-muted-foreground">
					{shown ? (
						<>
							{formatDate(shown.date)} ·{" "}
							<span className="tabular-nums">{shown.orders}</span>{" "}
							{shown.orders === 1 ? "order" : "orders"}
							{active === null && " · best day"}
						</>
					) : (
						"No days to show"
					)}
				</p>
			</div>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: the bars below are the interactive elements; this only clears the readout */}
			<div
				className="mt-7 flex h-48 items-end gap-px"
				onMouseLeave={() => setActiveIndex(null)}
			>
				{days.map((day, index) => {
					const height =
						day.revenueInPesewas > 0
							? Math.max((day.revenueInPesewas / peak) * 100, 2)
							: 0;
					const isActive = index === activeIndex;
					const isBest = index === bestIndex && peak > 1;

					return (
						<button
							key={day.date}
							type="button"
							onMouseEnter={() => setActiveIndex(index)}
							onFocus={() => setActiveIndex(index)}
							onBlur={() => setActiveIndex(null)}
							aria-label={`${formatDate(day.date)}: ${formatMoney(day.revenueInPesewas)} from ${day.orders} ${day.orders === 1 ? "order" : "orders"}`}
							className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
						>
							{height > 0 ? (
								<span
									style={{ height: `${height}%` }}
									className={cn(
										"w-full transition-colors",
										isActive
											? "bg-[var(--ed-accent)]"
											: isBest
												? "bg-foreground"
												: "bg-foreground/35 group-hover:bg-foreground",
									)}
								/>
							) : (
								/* A day that took orders but no money still
								   marks itself, so it reads as attempted
								   rather than absent. */
								<span
									className={cn(
										"w-full",
										day.orders > 0
											? "h-[3px] bg-[var(--ed-accent)]/50"
											: "h-px bg-border",
									)}
								/>
							)}
						</button>
					);
				})}
			</div>

			<div className="mt-3 flex justify-between border-border border-t pt-2 text-[11px] text-muted-foreground tabular-nums">
				<span>{days[0] ? formatDate(days[0].date) : ""}</span>
				<span>
					{days.length > 1 && days.at(-1)
						? formatDate(String(days.at(-1)?.date))
						: ""}
				</span>
			</div>
		</section>
	);
}
