import { storefront } from "@shared/lib/storefront";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";

/**
 * The split that every auth screen sits in: a photograph carrying a statement
 * on one side, the form on the other. Shoppers arrive here from the storefront,
 * so it is dressed in the same editorial surface rather than the admin theme.
 */
export function AuthSplit({ children }: PropsWithChildren) {
	return (
		<div className="editorial grid min-h-screen bg-background lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.95fr_1.05fr]">
			<aside className="relative hidden overflow-hidden bg-[#1a1a1a] lg:block">
				<Image
					src="/images/auth-kitchen.jpg"
					alt=""
					fill
					priority
					sizes="50vw"
					className="object-cover opacity-90"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
					<p className="eyebrow text-white/70">Geostoresgh</p>
					<p className="mt-5 max-w-[16ch] font-semibold text-[clamp(30px,2.8vw,44px)] leading-[1.05] tracking-[-0.042em]">
						Tech for every part of your life.
					</p>
					<p className="mt-5 max-w-[42ch] text-[14.5px] text-white/70 leading-[1.6]">
						Manage orders, stock and the catalogue behind the
						storefront.
					</p>
				</div>
			</aside>

			<div className="flex flex-col px-6 sm:px-10 lg:px-14">
				<header className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-4 py-8">
					<Link href={storefront.home} className="block">
						<span className="inline-flex h-10 items-center">
							<img
								alt="Geostoresgh"
								className="h-full w-auto object-contain"
								decoding="async"
								src="/images/geostoresgh-logo-landscape.png"
							/>
						</span>
					</Link>
					<Link
						href={storefront.shop}
						className="group inline-flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
						Back to the shop
					</Link>
				</header>

				<main className="flex flex-1 items-center py-6">
					<div className="mx-auto w-full max-w-[440px]">
						{children}
					</div>
				</main>

				<footer className="mx-auto w-full max-w-[440px] pb-8">
					<p className="text-[12px] text-muted-foreground">
						© {new Date().getFullYear()} GeoStoresGH.
					</p>
				</footer>
			</div>
		</div>
	);
}
