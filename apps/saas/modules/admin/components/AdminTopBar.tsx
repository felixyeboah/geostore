import { AdminNav, type AdminNavItem } from "@admin/components/AdminNav";
import { Logo } from "@repo/ui";
import { UserMenu } from "@shared/components/UserMenu";
import { storefront } from "@shared/lib/storefront";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

/**
 * The admin's whole chrome.
 *
 * The admin used to sit inside the app's sidebar layout, which meant two
 * navigations competing for the same job. The sidebar is gone from here, so
 * this bar has to carry what it used to: the brand, the way back to the shop
 * and the account menu, with the section tabs underneath.
 */
export function AdminTopBar({ items }: { items: AdminNavItem[] }) {
	return (
		<header className="border-border border-b bg-background">
			<div className="mx-auto w-full max-w-[1240px] px-6">
				<div className="flex h-16 items-center justify-between gap-6">
					<div className="flex min-w-0 items-center gap-4">
						<Link
							href="/admin"
							className="shrink-0"
							aria-label="Back office"
						>
							<Logo />
						</Link>
						<span
							aria-hidden="true"
							className="hidden h-5 w-px bg-border sm:block"
						/>
						<p className="eyebrow hidden truncate text-muted-foreground sm:block">
							Back office
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-5">
						<a
							href={storefront.home}
							target="_blank"
							rel="noreferrer"
							className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
						>
							View the shop
							<ArrowUpRightIcon className="size-3.5" />
						</a>
						<UserMenu variant="admin" />
					</div>
				</div>
			</div>

			<div className="mx-auto w-full max-w-[1240px] px-6">
				<AdminNav items={items} />
			</div>
		</header>
	);
}
