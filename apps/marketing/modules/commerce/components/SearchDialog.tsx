"use client";

import { links } from "@commerce/lib/store-links";
import { formatMoney } from "@repo/commerce";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchResult {
	slug: string;
	name: string;
	brand: string;
	categorySlug: string;
	imageUrl: string;
	priceInPesewas: number;
}

interface SearchResponse {
	total: number;
	products: SearchResult[];
}

const EMPTY: SearchResponse = { total: 0, products: [] };

export function SearchDialog({ label }: { label: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResponse>(EMPTY);
	const [isSearching, setIsSearching] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [retry, setRetry] = useState(0);

	const trimmed = query.trim();
	const hasQuery = trimmed.length >= 2;

	// Cmd/Ctrl+K is what shoppers who use it expect; everyone else clicks.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen(true);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (!hasQuery) {
			setResults(EMPTY);
			setIsSearching(false);
			return;
		}

		const controller = new AbortController();
		setResults(EMPTY);
		setHasError(false);
		setIsSearching(true);
		const timeoutId = window.setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/search?q=${encodeURIComponent(trimmed)}`,
					{ signal: controller.signal },
				);
				if (!response.ok) {
					throw new Error("Search failed");
				}
				const data: SearchResponse = await response.json();
				if (!controller.signal.aborted) {
					setResults(data);
				}
			} catch {
				// An aborted request is the normal case while typing.
				if (!controller.signal.aborted) {
					setResults(EMPTY);
					setHasError(true);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsSearching(false);
				}
			}
		}, 220);

		return () => {
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [open, trimmed, hasQuery, retry]);

	function goToShop() {
		setOpen(false);
		router.push(hasQuery ? links.searchFor(trimmed) : links.shop);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) {
					setQuery("");
					setResults(EMPTY);
				}
			}}
		>
			<DialogTrigger asChild>
				<button
					type="button"
					className="p-1 text-foreground/80 transition-colors hover:text-foreground"
					aria-label={label}
				>
					<SearchIcon className="size-[18px]" strokeWidth={1.75} />
				</button>
			</DialogTrigger>

			<DialogContent className="top-[12%] max-w-[640px] translate-y-0 gap-0 rounded-[6px] p-0 [&>button]:hidden">
				<DialogTitle className="sr-only">{label}</DialogTitle>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						goToShop();
					}}
					className="flex items-center gap-3 border-border border-b px-5"
				>
					<SearchIcon
						className="size-[18px] shrink-0 text-foreground/50"
						strokeWidth={1.75}
					/>
					<input
						autoFocus
						type="search"
						maxLength={200}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search products or brands…"
						aria-label={label}
						className="h-[60px] w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground/40 focus:outline-none"
					/>
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="shrink-0 rounded-[3px] border border-border px-2 py-1 text-[10px] text-muted-foreground"
					>
						Esc
					</button>
				</form>

				<div className="max-h-[min(60vh,420px)] overflow-y-auto">
					{!hasQuery && (
						<p className="px-5 py-8 text-[12.5px] text-muted-foreground">
							Type at least two characters to search the
							catalogue.
						</p>
					)}

					{hasQuery &&
						isSearching &&
						results.products.length === 0 && (
							<p className="px-5 py-8 text-[12.5px] text-muted-foreground">
								Searching…
							</p>
						)}

					{hasQuery && hasError && !isSearching && (
						<div role="alert" className="px-5 py-8 text-sm">
							<p>Search is unavailable. Please try again.</p>
							<button
								type="button"
								onClick={() => setRetry((value) => value + 1)}
								className="mt-2 underline"
							>
								Retry search
							</button>
						</div>
					)}

					{hasQuery &&
						!hasError &&
						!isSearching &&
						results.products.length === 0 && (
							<div className="px-5 py-8">
								<p className="font-medium text-[15px] text-foreground">
									No products match “{trimmed}”.
								</p>
								<p className="mt-2 text-[12.5px] text-muted-foreground">
									Try a broader word, or browse the whole
									shop.
								</p>
							</div>
						)}

					{results.products.length > 0 && (
						<ul>
							{results.products.map((product) => (
								<li
									key={product.slug}
									className="border-border border-b"
								>
									<a
										href={links.product(product.slug)}
										onClick={() => setOpen(false)}
										className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/60"
									>
										<span className="relative size-12 shrink-0 overflow-hidden rounded-[3px] bg-[#f2f0ee]">
											<Image
												src={product.imageUrl}
												alt=""
												fill
												sizes="48px"
												className="object-contain"
											/>
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate font-medium text-[14px] text-foreground">
												{product.name}
											</span>
											<span className="mt-0.5 block text-[11px] text-muted-foreground">
												{product.brand}
											</span>
										</span>
										<span className="shrink-0 font-medium text-[13px] text-foreground tabular-nums">
											{formatMoney(
												product.priceInPesewas,
											)}
										</span>
									</a>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="border-border border-t">
					<button
						type="button"
						onClick={goToShop}
						className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60"
					>
						<span className="font-medium text-[13px] text-foreground">
							{hasQuery && results.total > 0
								? `View all ${results.total} ${results.total === 1 ? "result" : "results"} in the shop`
								: "Browse all products in the shop"}
						</span>
						<ArrowRightIcon className="size-4 shrink-0 text-foreground" />
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
