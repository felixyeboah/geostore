import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import { ShoppingBagIcon } from "lucide-react";
import Image from "next/image";

const storeHref = config.saasUrl || "/";

const popularPicks = [
	{
		name: "iPhone 14 Pro",
		meta: "Apple / Phone",
		price: "GH₵ 9,800",
		badge: "In stock",
		src: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "Galaxy Buds Pro",
		meta: "Samsung / Audio",
		price: "GH₵ 1,450",
		badge: "Best seller",
		src: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "JBL Charge Speaker",
		meta: "JBL / Speaker",
		price: "GH₵ 1,900",
		badge: "Popular",
		src: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "Apple Watch Series",
		meta: "Apple / Wearable",
		price: "GH₵ 3,200",
		badge: "New",
		src: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "Samsung Smart TV",
		meta: "Samsung / TV",
		price: "GH₵ 5,600",
		badge: "Home tech",
		src: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "Sony Headphones",
		meta: "Sony / Audio",
		price: "GH₵ 2,100",
		badge: "Top rated",
		src: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "Fast Wireless Charger",
		meta: "Accessories / Charger",
		price: "GH₵ 320",
		badge: "Everyday pick",
		src: "https://images.unsplash.com/photo-1618577608401-8f9e05c7c8d4?auto=format&fit=crop&w=900&q=80",
	},
	{
		name: "iPad Air",
		meta: "Apple / Tablet",
		price: "GH₵ 6,900",
		badge: "Work setup",
		src: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80",
	},
];

export function PopularPicksSection() {
	return (
		<section id="popular-picks" className="scroll-mt-16 py-14 lg:py-20">
			<div className="container">
				<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
					<div className="max-w-3xl">
						<p className="font-semibold text-primary text-sm uppercase">
							Popular picks
						</p>
						<h2 className="mt-3 font-brand font-semibold text-3xl text-foreground md:text-5xl">
							Ready-to-shop gadgets.
						</h2>
						<p className="mt-4 max-w-2xl text-foreground/60">
							Customer favorites across phones, audio, tablets, TVs, and
							everyday accessories.
						</p>
					</div>
					<Button variant="secondary" asChild>
						<a href={storeHref}>
							Browse store
							<ShoppingBagIcon className="size-4" />
						</a>
					</Button>
				</div>

				<div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
					{popularPicks.map((product) => (
						<a
							key={product.name}
							href={storeHref}
							className="group block hover:no-underline"
						>
							<div className="relative aspect-square overflow-hidden rounded-lg bg-muted outline-1 -outline-offset-1 outline-black/5">
								<Image
									src={product.src}
									alt=""
									fill
									sizes="(min-width: 1024px) 25vw, 50vw"
									className="object-cover transition duration-500 group-hover:scale-105"
								/>
								<span className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 font-medium text-primary text-xs shadow-sm">
									{product.badge}
								</span>
							</div>
							<div className="mt-4">
								<p className="font-semibold text-foreground">
									{product.name}
								</p>
								<p className="mt-1 text-foreground/55 text-sm">
									{product.meta}
								</p>
								<div className="mt-3 flex items-center justify-between gap-3">
									<p className="font-semibold text-primary">
										{product.price}
									</p>
									<span className="font-medium text-foreground/60 text-sm transition group-hover:text-primary">
										View product
									</span>
								</div>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
