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
			className={cn("-mx-4 border-b sm:mx-0", className)}
		>
			<ul className="no-scrollbar flex list-none items-stretch gap-0.5 overflow-x-auto px-4 sm:px-0">
				{items.map((item) => {
					const isActive = pathname.startsWith(item.href);
					return (
						<li key={item.href} className="shrink-0">
							<Link
								href={item.href}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"relative flex h-11 items-center gap-2 px-3 text-sm transition-colors",
									isActive
										? "font-semibold text-primary"
										: "font-medium text-muted-foreground hover:text-foreground",
								)}
							>
								<span
									className={cn(
										"[&>svg]:size-4",
										isActive
											? "text-primary"
											: "text-muted-foreground/70",
									)}
								>
									{item.icon}
								</span>
								{item.title}
								{item.count ? (
									<span
										className={cn(
											"rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums text-primary-foreground",
											isActive
												? "bg-primary"
												: "bg-foreground",
										)}
									>
										{item.count}
									</span>
								) : null}
								{isActive && (
									<span
										aria-hidden="true"
										className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-t bg-primary"
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
