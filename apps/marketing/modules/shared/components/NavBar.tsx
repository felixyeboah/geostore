"use client";

import { CartLink } from "@commerce/components/CartLink";
import { SearchDialog } from "@commerce/components/SearchDialog";
import { ShopMegaMenu } from "@commerce/components/ShopMegaMenu";
import { links, PHONE_NUMBER } from "@home/data/landing";
import { cn } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { BrandLogo } from "@shared/components/BrandLogo";
import { useTranslations } from "@shared/lib/translations";
import { MenuIcon, PhoneIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
	label: string;
	href: string;
}

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	const shopLabel = t("common.menu.shop");

	// `Shop` is the mega menu on desktop, so it is not in this list; the
	// mobile sheet adds it back at the top, where a flat link is right.
	const menuItems: NavItem[] = [
		{ label: t("common.menu.phones"), href: links.category("phones") },
		{ label: t("common.menu.computers"), href: links.category("laptops") },
		{ label: t("common.menu.gaming"), href: links.category("gaming") },
		{
			label: t("common.menu.appliances"),
			href: links.category("appliances"),
		},
		{
			label: t("common.menu.accessories"),
			href: links.category("accessories"),
		},
		{ label: t("common.menu.about"), href: links.about },
	];

	return (
		<nav
			className="sticky top-0 z-50 w-full border-border border-b bg-background"
			data-test="navigation"
		>
			<div className="hidden border-border border-b lg:block">
				<div className="mx-auto flex h-9 w-full max-w-[1360px] items-center justify-between px-12 text-[11px] text-muted-foreground">
					<p>{t("common.menu.utility")}</p>
					<div className="flex items-center gap-6">
						<Link
							href={links.contact}
							className="transition-colors hover:text-foreground"
						>
							{t("common.menu.help")}
						</Link>
						<a
							href={`tel:${PHONE_NUMBER.replace(/\s+/g, "")}`}
							className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
						>
							<PhoneIcon className="size-3" />
							{PHONE_NUMBER}
						</a>
					</div>
				</div>
			</div>
			<div className="mx-auto flex h-[72px] w-full max-w-[1360px] items-center justify-between px-6 lg:h-[84px] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12">
				<Link
					href="/"
					className="block hover:no-underline active:no-underline"
					aria-label="Geostoresgh"
				>
					<BrandLogo className="h-9 lg:h-12" />
				</Link>

				<ul className="hidden items-center gap-6 lg:flex">
					<li>
						<ShopMegaMenu label={shopLabel} />
					</li>
					{menuItems.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									"text-[13px] text-foreground/85 transition-colors hover:text-foreground",
									pathname === item.href && "text-foreground",
								)}
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>

				<div className="flex items-center justify-end gap-3">
					<SearchDialog label={t("common.menu.search")} />
					<span
						aria-hidden="true"
						className="mx-1 hidden h-6 w-px bg-border lg:block"
					/>
					<CartLink />
					<MobileMenu
						items={[
							{ label: shopLabel, href: links.shop },
							...menuItems,
						]}
						open={mobileMenuOpen}
						onOpenChange={setMobileMenuOpen}
						menuLabel={t("common.aria.menu")}
						searchLabel={t("common.menu.search")}
					/>
				</div>
			</div>
		</nav>
	);
}

function MobileMenu({
	items,
	open,
	onOpenChange,
	menuLabel,
	searchLabel,
}: {
	items: NavItem[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	menuLabel: string;
	searchLabel: string;
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<button
					type="button"
					className="ml-2 p-1 text-foreground lg:hidden"
					aria-label={menuLabel}
				>
					<MenuIcon className="size-5" strokeWidth={1.75} />
				</button>
			</SheetTrigger>
			<SheetContent className="w-[300px] bg-background" side="right">
				<SheetTitle className="sr-only">{menuLabel}</SheetTitle>
				<ul className="mt-8 flex flex-col">
					{items.map((item) => (
						<li key={item.href} className="border-border border-b">
							<Link
								href={item.href}
								onClick={() => onOpenChange(false)}
								className="block py-4 font-medium text-[15px] text-foreground"
							>
								{item.label}
							</Link>
						</li>
					))}
					<li>
						<Link
							href={links.search}
							onClick={() => onOpenChange(false)}
							className="mt-4 inline-flex items-center gap-2 text-[13px] text-foreground/80"
						>
							<SearchIcon className="size-4" />
							{searchLabel}
						</Link>
					</li>
				</ul>
			</SheetContent>
		</Sheet>
	);
}
