"use client";

import { storeLinks } from "@commerce/lib/store-links";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface MenuDepartment {
	slug: string;
	name: string;
	blurb: string;
	productCount: number;
	brands: string[];
	featured: {
		slug: string;
		name: string;
		brand: string;
		imageUrl: string;
		priceInPesewas: number;
	} | null;
}

interface MenuData {
	departments: MenuDepartment[];
	collections: { slug: string; name: string; kind: "manual" | "smart" }[];
	reducedCount: number;
}

/** Fetched once per page load and shared by every mount of the menu. */
let cachedMenu: MenuData | null = null;
let inFlight: Promise<MenuData> | null = null;

function loadMenu(): Promise<MenuData> {
	if (cachedMenu) {
		return Promise.resolve(cachedMenu);
	}
	if (!inFlight) {
		inFlight = fetch("/api/nav-menu")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Menu unavailable");
				}
				return response.json() as Promise<MenuData>;
			})
			.then((data) => {
				cachedMenu = data;
				return data;
			})
			.finally(() => {
				inFlight = null;
			});
	}
	return inFlight;
}

/** Long enough that crossing the word on the way elsewhere does not open it. */
const OPEN_DELAY_MS = 110;
/** Short enough to feel immediate, long enough to cross the gap to the panel. */
const CLOSE_DELAY_MS = 180;

const columnHeading =
	"eyebrow border-border border-b pb-3 text-muted-foreground";
const columnLink =
	"block py-[7px] text-[13.5px] text-muted-foreground transition-colors hover:text-foreground";

/**
 * The shop mega menu.
 *
 * Structure follows the reference: a department rail on the left, and for the
 * department under the cursor, its brands, the collections, and one product as
 * a shop window. Every row in the rail is a real link, so hovering previews a
 * department and clicking goes there — nothing is hover-only.
 *
 * Desktop only. On small screens the nav already opens a sheet, which is a
 * better fit for a thumb than a six-column panel.
 */
export function ShopMegaMenu({ label }: { label: string }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [menu, setMenu] = useState<MenuData | null>(cachedMenu);
	const [activeSlug, setActiveSlug] = useState<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	const clearTimer = useCallback(() => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	const openMenu = useCallback(() => {
		clearTimer();
		setOpen(true);
		if (!cachedMenu) {
			loadMenu()
				.then(setMenu)
				.catch(() => setMenu(null));
		}
	}, [clearTimer]);

	const closeMenu = useCallback(() => {
		clearTimer();
		setOpen(false);
	}, [clearTimer]);

	// Backstop for navigations that do not start with a click in the panel,
	// such as the browser's back button.
	useEffect(() => {
		closeMenu();
	}, [pathname, closeMenu]);

	useEffect(() => clearTimer, [clearTimer]);

	const departments = menu?.departments ?? [];
	const active =
		departments.find((department) => department.slug === activeSlug) ??
		departments[0];

	return (
		// Hover is an enhancement: the trigger is a real button, focus opens
		// the panel, and Escape or blur closes it, so the keyboard path never
		// depends on the handlers below.
		// biome-ignore lint/a11y/noStaticElementInteractions: see above
		<div
			className="hidden lg:block"
			onMouseEnter={() => {
				clearTimer();
				timer.current = setTimeout(openMenu, OPEN_DELAY_MS);
			}}
			onMouseLeave={() => {
				clearTimer();
				timer.current = setTimeout(closeMenu, CLOSE_DELAY_MS);
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape" && open) {
					event.stopPropagation();
					closeMenu();
					triggerRef.current?.focus();
				}
			}}
			// Following a link closes the menu. The route effect below is not
			// enough on its own: going from /shop to /shop?collection=x keeps
			// the same pathname, so it would never fire.
			onClickCapture={(event) => {
				if (
					event.target instanceof Element &&
					event.target.closest("a")
				) {
					closeMenu();
				}
			}}
			// Tabbing past the last link in the panel should close it, the
			// same as clicking away would.
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					closeMenu();
				}
			}}
		>
			<button
				ref={triggerRef}
				type="button"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => (open ? closeMenu() : openMenu())}
				onFocus={openMenu}
				className={cn(
					"flex items-center gap-1.5 py-1 text-[13px] transition-colors hover:text-foreground",
					open ? "text-foreground" : "text-foreground/85",
				)}
			>
				{label}
				<ChevronRightIcon
					aria-hidden="true"
					className={cn(
						"size-3 transition-transform duration-200",
						open ? "-rotate-90" : "rotate-90",
					)}
				/>
			</button>

			{open && (
				<div
					id={panelId}
					// Pinned to the viewport edge rather than the trigger: the
					// panel is a band across the header, like the reference.
					className="-translate-x-1/2 absolute top-full left-1/2 z-50 w-screen border-border border-t border-b bg-background shadow-[0_24px_48px_-32px_rgba(17,17,16,0.3)]"
				>
					<div className="editorial mx-auto w-full max-w-[1360px] px-12">
						{menu ? (
							<>
								<div className="grid grid-cols-[236px_1fr] gap-10">
									<ul className="border-border border-r py-6 pr-6">
										{departments.map((department) => {
											const isActive =
												department.slug ===
												active?.slug;
											return (
												<li key={department.slug}>
													<Link
														href={storeLinks.category(
															department.slug,
														)}
														onMouseEnter={() =>
															setActiveSlug(
																department.slug,
															)
														}
														onFocus={() =>
															setActiveSlug(
																department.slug,
															)
														}
														className={cn(
															"flex items-center justify-between gap-3 rounded-[2px] py-[9px] pr-2 pl-3 text-[13.5px] transition-colors",
															isActive
																? "bg-muted font-medium text-foreground"
																: "text-muted-foreground hover:text-foreground",
														)}
													>
														<span className="truncate">
															{department.name}
														</span>
														<ChevronRightIcon
															aria-hidden="true"
															className="size-3.5 shrink-0 opacity-45"
														/>
													</Link>
												</li>
											);
										})}
									</ul>

									{active && (
										<div className="py-6">
											<div className="border-border border-b pb-4">
												<div className="flex items-baseline justify-between gap-6">
													<Link
														href={storeLinks.category(
															active.slug,
														)}
														className="group inline-flex items-baseline gap-2 font-semibold text-[17px] text-foreground tracking-[-0.02em]"
													>
														Shop all {active.name}
														<ArrowRightIcon
															aria-hidden="true"
															className="size-3.5 self-center transition-transform group-hover:translate-x-0.5"
														/>
													</Link>
													<p className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
														{active.productCount} in
														stock
													</p>
												</div>
												<p className="mt-2 max-w-[52ch] text-[13px] text-muted-foreground leading-[1.55]">
													{active.blurb}
												</p>
											</div>

											<div className="grid grid-cols-[1fr_1fr_260px] gap-10 pt-6">
												<div>
													<p
														className={
															columnHeading
														}
													>
														Brand
													</p>
													<ul className="pt-2">
														{active.brands.map(
															(brand) => (
																<li key={brand}>
																	<Link
																		href={`${storeLinks.category(active.slug)}?brand=${encodeURIComponent(brand)}`}
																		className={
																			columnLink
																		}
																	>
																		{brand}
																	</Link>
																</li>
															),
														)}
													</ul>
												</div>

												<div>
													<p
														className={
															columnHeading
														}
													>
														Shop by need
													</p>
													<ul className="pt-2">
														{menu.collections.map(
															(collection) => (
																<li
																	key={
																		collection.slug
																	}
																>
																	<Link
																		href={storeLinks.collection(
																			collection.slug,
																		)}
																		className={
																			columnLink
																		}
																	>
																		{
																			collection.name
																		}
																	</Link>
																</li>
															),
														)}
													</ul>
												</div>

												{active.featured && (
													<Link
														href={storeLinks.product(
															active.featured
																.slug,
														)}
														className="group block"
													>
														<span className="relative block aspect-[4/3] overflow-hidden rounded-[2px] bg-muted">
															<Image
																src={
																	active
																		.featured
																		.imageUrl
																}
																alt=""
																fill
																sizes="260px"
																className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
															/>
															<span className="eyebrow absolute top-0 left-0 bg-background px-2.5 py-2 text-foreground">
																Best seller
															</span>
														</span>
														<span className="mt-3 block text-[12px] text-muted-foreground">
															{
																active.featured
																	.brand
															}
														</span>
														<span className="mt-1 block font-medium text-[14px] text-foreground leading-[1.3] group-hover:text-[var(--ed-accent)]">
															{
																active.featured
																	.name
															}
														</span>
														<span className="mt-1.5 block text-[13px] text-foreground tabular-nums">
															{formatMoney(
																active.featured
																	.priceInPesewas,
															)}
														</span>
													</Link>
												)}
											</div>
										</div>
									)}
								</div>

								<div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-border border-t py-3.5">
									<Link
										href={storeLinks.shop}
										className="font-medium text-[13px] text-foreground hover:text-[var(--ed-accent)]"
									>
										Everything we stock
									</Link>
									<Link
										href={storeLinks.collection(
											"best-sellers",
										)}
										className="text-[13px] text-muted-foreground hover:text-foreground"
									>
										Best sellers
									</Link>
									<Link
										href={storeLinks.collection("new-in")}
										className="text-[13px] text-muted-foreground hover:text-foreground"
									>
										New in
									</Link>
									<Link
										href={`${storeLinks.shop}?sale=1`}
										className="text-[13px] text-muted-foreground hover:text-foreground"
									>
										Reduced
										<span className="ml-1.5 text-muted-foreground tabular-nums">
											({menu.reducedCount})
										</span>
									</Link>
								</div>
							</>
						) : (
							<div className="flex items-center gap-3 py-10 text-[13px] text-muted-foreground">
								<span className="size-3 animate-spin rounded-full border border-border border-t-foreground" />
								Loading the catalogue…
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
