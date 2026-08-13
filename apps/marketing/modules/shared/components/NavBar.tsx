"use client";

import { config } from "@config";
import { cn, Logo } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import {
	MenuIcon,
	PhoneIcon,
	SearchIcon,
	ShoppingBagIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@shared/lib/translations";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

interface NavItem {
	label: string;
	href: string;
}

const phoneNumber = "+233 20 913 3372";

function getStoreHref(query: string) {
	const storeUrl = config.saasUrl
		? String(config.saasUrl).replace(/\/$/, "")
		: "";

	return `${storeUrl}/?${query}`;
}

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isTop, setIsTop] = useState(true);

	const handleMobileMenuClose = () => {
		setMobileMenuOpen(false);
	};

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		handleMobileMenuClose();
	}, [pathname]);

	const menuItems: NavItem[] = [
		{
			label: t("common.menu.latestDrops"),
			href: "/#latest-drops",
		},
		{
			label: t("common.menu.faq"),
			href: "/#faq",
		},
		{
			label: t("common.menu.blog"),
			href: "/blog",
		},
		{
			label: t("common.menu.contact"),
			href: "/contact",
		},
	];

	const brandItems: NavItem[] = [
		{ label: "Apple", href: getStoreHref("brand=apple") },
		{ label: "Samsung", href: getStoreHref("brand=samsung") },
		{ label: "JBL", href: getStoreHref("brand=jbl") },
		{ label: "Sony", href: getStoreHref("brand=sony") },
		{ label: "LG", href: getStoreHref("brand=lg") },
	];

	const isMenuItemActive = (href: string) =>
		href.startsWith("/#") ? false : pathname.startsWith(href);

	return (
		<nav
			className={cn(
				"sticky top-0 z-50 w-full border-b bg-background transition-shadow duration-200",
				{ "shadow-sm": !isTop },
			)}
			data-test="navigation"
		>
			<div className="hidden bg-brand-gradient text-brand-white lg:block">
				<div className="container flex h-9 items-center justify-between text-sm">
					<span className="font-medium">
						gadgets & more, delivered across Ghana
					</span>
					<Link
						href="/contact"
						className="inline-flex items-center gap-2 font-medium"
					>
						<PhoneIcon className="size-3.5" />
						{phoneNumber}
					</Link>
				</div>
			</div>

			<div className="container">
				<div className="flex items-center justify-between gap-4 py-4">
					<Link
						href="/"
						className="block hover:no-underline active:no-underline"
					>
						<Logo />
					</Link>

					<div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
						<span className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 font-medium text-primary text-sm">
							<SparklesIcon className="size-4" />
							Brands
						</span>
						{brandItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="inline-flex items-center rounded-lg px-3 py-2 font-medium text-foreground/75 text-sm transition hover:bg-primary/10 hover:text-primary"
							>
								{item.label}
							</Link>
						))}
					</div>

					<div className="flex items-center gap-2">
						<Link
							href={getStoreHref("q=")}
							className="hidden items-center gap-2 rounded-full bg-muted px-3 py-2 font-medium text-foreground/70 text-sm transition hover:bg-primary/10 hover:text-primary xl:inline-flex"
						>
							<SearchIcon className="size-4" />
							Search store
						</Link>
						<ShopButton />
						<MobileMenu
							brandItems={brandItems}
							menuItems={menuItems}
							open={mobileMenuOpen}
							onOpenChange={setMobileMenuOpen}
							onClose={handleMobileMenuClose}
							isMenuItemActive={isMenuItemActive}
							menuLabel={t("common.aria.menu")}
						/>
					</div>
				</div>
			</div>
		</nav>
	);
}

function ShopButton() {
	if (!config.saasUrl) {
		return null;
	}

	return (
		<Button className="hidden lg:flex" asChild variant="secondary">
			<Link href={config.saasUrl} prefetch>
				<ShoppingBagIcon className="size-4" />
				Shop now
			</Link>
		</Button>
	);
}

function MobileMenu({
	brandItems,
	menuItems,
	open,
	onOpenChange,
	onClose,
	isMenuItemActive,
	menuLabel,
}: {
	brandItems: NavItem[];
	menuItems: NavItem[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onClose: () => void;
	isMenuItemActive: (href: string) => boolean;
	menuLabel: string;
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<Button
					className="lg:hidden"
					size="icon"
					variant="secondary"
					aria-label={menuLabel}
				>
					<MenuIcon className="size-4" />
				</Button>
			</SheetTrigger>
			<SheetContent className="w-[300px]" side="right">
				<SheetTitle className="sr-only">Navigation menu</SheetTitle>
				<div className="flex flex-col items-start justify-center">
					<div className="mb-5 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 font-medium text-primary text-sm">
						<SparklesIcon className="size-4" />
						Shop by brand
					</div>

					<div className="grid w-full grid-cols-2 gap-2">
						{brandItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className="rounded-lg bg-muted px-3 py-2 font-medium text-foreground/80 text-sm transition hover:bg-primary/10 hover:text-primary"
								prefetch
							>
								{item.label}
							</Link>
						))}
					</div>

					<div className="mt-6 h-px w-full bg-border" />

					<div className="mt-4 flex w-full flex-col">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className={cn(
									"block shrink-0 rounded-lg px-3 py-2 font-medium text-base text-foreground/80",
									isMenuItemActive(item.href)
										? "bg-primary/10 font-bold text-primary"
										: "",
								)}
								prefetch
							>
								{item.label}
							</Link>
						))}
					</div>

					{config.saasUrl && (
						<Link
							href={config.saasUrl}
							className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground"
							onClick={onClose}
							prefetch
						>
							<ShoppingBagIcon className="size-4" />
							Shop now
						</Link>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
