import { CartLink } from "@commerce/components/CartLink";
import { getLiveCategories } from "@commerce/lib/live-catalog";
import { Logo } from "@repo/ui";
import { CircleUserRoundIcon, SearchIcon, TruckIcon } from "lucide-react";
import Link from "next/link";

export async function StoreHeader() {
	const categories = await getLiveCategories();
	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
			<div className="bg-foreground text-background">
				<div className="container flex min-h-9 items-center justify-center gap-2 text-center text-xs sm:text-sm">
					<TruckIcon className="size-3.5" />
					<span>Free delivery on orders over GH₵ 1,000 in Accra</span>
				</div>
			</div>
			<form action="/" className="container relative mb-3 md:hidden">
				<SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-8 size-4 text-muted-foreground" />
				<input
					type="search"
					name="q"
					aria-label="Search products"
					placeholder="Search products..."
					className="h-10 w-full rounded-xl border bg-muted/50 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
				/>
			</form>

			<div className="container flex items-center gap-3 py-3 lg:gap-6">
				<Link
					href="/"
					aria-label="Geostoresgh home"
					className="shrink-0"
				>
					<Logo className="h-9" />
				</Link>

				<form
					action="/"
					className="relative mx-auto hidden w-full max-w-xl md:block"
				>
					<SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 text-muted-foreground" />
					<input
						type="search"
						name="q"
						aria-label="Search products"
						placeholder="Search phones, audio, wearables..."
						className="h-11 w-full rounded-xl border bg-muted/50 pr-4 pl-11 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
					/>
				</form>

				<div className="ml-auto flex items-center gap-1.5">
					<Link
						href="/dashboard"
						className="inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="Your account"
					>
						<CircleUserRoundIcon className="size-5" />
					</Link>
					<CartLink />
				</div>
			</div>

			<nav
				className="container no-scrollbar flex items-center gap-1 overflow-x-auto pb-3"
				aria-label="Shop categories"
			>
				<Link
					href="/"
					className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-sm transition hover:bg-muted hover:text-primary"
				>
					Shop all
				</Link>
				{categories.map((category) => (
					<Link
						key={category.slug}
						href={`/categories/${category.slug}`}
						className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-muted-foreground text-sm transition hover:bg-muted hover:text-primary"
					>
						{category.name}
					</Link>
				))}
			</nav>
		</header>
	);
}
