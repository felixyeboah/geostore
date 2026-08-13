import { Logo } from "@repo/ui";
import Link from "next/link";

export function StoreFooter() {
	return (
		<footer className="mt-20 border-t bg-muted/35">
			<div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
				<div className="max-w-sm">
					<Logo className="h-9" />
					<p className="mt-4 text-muted-foreground text-sm leading-6">
						Useful tech, honest product details, and support you can
						reach. Delivered across Ghana.
					</p>
				</div>
				<div>
					<p className="font-semibold text-sm">Shop</p>
					<div className="mt-3 flex flex-col gap-2 text-muted-foreground text-sm">
						<Link href="/?sort=featured">Featured products</Link>
						<Link href="/categories/phones">Phones</Link>
						<Link href="/categories/audio">Audio</Link>
						<Link href="/cart">Shopping bag</Link>
					</div>
				</div>
				<div>
					<p className="font-semibold text-sm">Help & account</p>
					<div className="mt-3 flex flex-col gap-2 text-muted-foreground text-sm">
						<Link href="/dashboard">Orders and account</Link>
						<a href="mailto:support@geostoresgh.com">
							Contact support
						</a>
						<Link href="/legal/privacy-policy">Privacy policy</Link>
						<Link href="/legal/terms">Terms</Link>
					</div>
				</div>
			</div>
			<div className="border-t">
				<div className="container flex flex-col gap-2 py-5 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
					<span>© {new Date().getFullYear()} Geostoresgh</span>
					<span>Prices are shown in Ghana cedis.</span>
				</div>
			</div>
		</footer>
	);
}
