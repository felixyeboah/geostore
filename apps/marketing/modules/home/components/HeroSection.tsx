"use client";

import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	HeadphonesIcon,
	MonitorIcon,
	SearchIcon,
	SmartphoneIcon,
	WatchIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "@shared/lib/translations";

const PRODUCT_IMAGES = {
	phones:
		"https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=80",
	airpods:
		"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80",
	tvs: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
	watches:
		"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
};

export function HeroSection() {
	const t = useTranslations();

	const popularQueries = [
		{ label: t("home.hero.popularQueries.iphone"), icon: SmartphoneIcon },
		{ label: t("home.hero.popularQueries.airpodsPro"), icon: HeadphonesIcon },
		{ label: t("home.hero.popularQueries.galaxyWatch"), icon: WatchIcon },
		{ label: t("home.hero.popularQueries.smartTv"), icon: MonitorIcon },
	];

	const categories = [
		{
			label: t("home.hero.categories.phones"),
			count: t("home.hero.categoriesCount.phones"),
			src: PRODUCT_IMAGES.phones,
		},
		{
			label: t("home.hero.categories.airpods"),
			count: t("home.hero.categoriesCount.airpods"),
			src: PRODUCT_IMAGES.airpods,
		},
		{
			label: t("home.hero.categories.tvs"),
			count: t("home.hero.categoriesCount.tvs"),
			src: PRODUCT_IMAGES.tvs,
		},
		{
			label: t("home.hero.categories.watches"),
			count: t("home.hero.categoriesCount.watches"),
			src: PRODUCT_IMAGES.watches,
		},
	];

	return (
		<section className="relative overflow-hidden bg-background">
			<div
				aria-hidden="true"
				className="absolute inset-x-0 -top-32 h-[40rem] bg-linear-to-b from-primary/10 via-accent/30 to-transparent"
			/>

			<div className="container relative z-10 py-12 lg:py-20">
				<div className="mx-auto max-w-3xl text-center">
					<h1 className="text-balance font-brand font-semibold text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
						{t.rich("home.hero.title", {
							gradient: (chunks) => (
								<span className="text-brand-gradient">{chunks}</span>
							),
						})}
					</h1>

					<p className="mt-5 mx-auto max-w-[55ch] text-pretty text-foreground/65 text-base sm:text-lg">
						{t("home.hero.subtitle")}
					</p>

					<form
						className="mt-8 mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-card p-2 ring-1 ring-black/5 dark:ring-white/10"
						onSubmit={(event) => event.preventDefault()}
					>
						<div className="flex flex-1 items-center gap-3 pl-4">
							<SearchIcon className="size-5 text-foreground/40" />
							<input
								type="search"
								placeholder={t("home.hero.search.placeholder")}
								aria-label={t("home.hero.search.label")}
								className="w-full bg-transparent py-2 text-foreground text-base placeholder:text-foreground/40 focus:outline-none"
							/>
						</div>
						<Button type="submit" variant="primary" size="lg">
							{t("home.hero.search.submit")}
							<ArrowRightIcon className="ml-1.5 size-4" />
						</Button>
					</form>

					<div className="mt-5 flex flex-wrap items-center justify-center gap-2">
						<span className="text-foreground/50 text-sm">
							{t("home.hero.search.popular")}
						</span>
						{popularQueries.map((chip) => (
							<a
								key={chip.label}
								href={config.saasUrl}
								className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-foreground text-sm font-medium transition hover:bg-primary/10 hover:text-primary"
							>
								<chip.icon className="size-3.5" />
								{chip.label}
							</a>
						))}
					</div>
				</div>

				<div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
					{categories.map((item) => (
						<a
							key={item.label}
							href={config.saasUrl}
							className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-card outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10 transition hover:-translate-y-1"
						>
							<Image
								src={item.src}
								alt=""
								fill
								sizes="(min-width: 1024px) 25vw, 50vw"
								className="object-cover transition duration-700 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
							<div className="absolute inset-x-0 bottom-0 p-4">
								<p className="font-brand font-semibold text-white text-lg tracking-tight">
									{item.label}
								</p>
								<p className="mt-0.5 text-white/70 text-sm tabular-nums">
									{item.count}
								</p>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
