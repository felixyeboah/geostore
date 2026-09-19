"use client";

import { cn } from "@repo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface AdminNavItem {
	title: string;
	href: string;
	icon: ReactNode;
	/** Live count shown beside the label, e.g. orders awaiting dispatch. */
	count?: number;
}

export function AdminNav({
	items,
	className,
}: {
	items: AdminNavItem[];
	className?: string;
}) {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Administration"
			// The surrounding bar owns the rule and the gutter now, so this
			// is only the row of tabs.
			className={cn("w-full", className)}
		>
			<ul className="no-scrollbar flex list-none items-stretch gap-6 overflow-x-auto">
				{items.map((item) => {
					const isActive = pathname.startsWith(item.href);
					return (
						<li key={item.href} className="shrink-0">
							<Link
								href={item.href}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"relative flex h-11 items-center gap-2 text-[13px] transition-colors",
									isActive
										? "font-medium text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<span
									className={cn(
										"[&>svg]:size-[15px]",
										isActive
											? "text-foreground"
											: "text-muted-foreground/60",
									)}
								>
									{item.icon}
								</span>
								{item.title}
								{item.count ? (
									<span className="rounded-[2px] border border-border px-1.5 py-px font-medium text-[11px] text-muted-foreground tabular-nums">
										{item.count}
									</span>
								) : null}
								{isActive && (
									<span
										aria-hidden="true"
										className="-bottom-px absolute inset-x-0 h-0.5 bg-foreground"
									/>
								)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
