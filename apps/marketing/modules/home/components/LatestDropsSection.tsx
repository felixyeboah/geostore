import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import { ArrowRightIcon, ShoppingBagIcon } from "lucide-react";
import Image from "next/image";

const storeHref = config.saasUrl || "/";

const latestDrops = [
	{
		name: "iPhone 15 Pro",
		description: "Titanium build, powerful camera, and all-day performance.",
		price: "From GH₵ 12,900",
		status: "New arrival",
		src: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80",
	},
	{
		name: "Galaxy S24 Ultra",
		description: "A big-screen Android flagship for work, photos, and play.",
		price: "From GH₵ 11,400",
		status: "Top request",
		src: "https://images.unsplash.com/photo-1709744722656-9b850470293f?auto=format&fit=crop&w=1000&q=80",
	},
	{
		name: "AirPods Pro",
		description: "Noise cancelling audio for calls, music, and commute.",
		price: "From GH₵ 2,350",
		status: "Popular",
		src: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1000&q=80",
	},
	{
		name: "Smart TV",
		description: "Movie nights, football, streaming, and console-ready displays.",
		price: "From GH₵ 4,700",
		status: "Home tech",
		src: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
	},
];

export function LatestDropsSection() {
	return (
		<section id="latest-drops" className="scroll-mt-16 border-y py-14 lg:py-20">
			<div className="container">
				<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
					<div className="max-w-3xl">
						<p className="font-semibold text-primary text-sm uppercase">
							Latest drops
						</p>
						<h2 className="mt-3 font-brand font-semibold text-3xl text-foreground md:text-5xl">
							Fresh gadgets now available.
						</h2>
						<p className="mt-4 max-w-2xl text-foreground/60">
							Browse the newest phones, audio gear, wearables, and home tech
							ready for shoppers in Ghana.
						</p>
					</div>
					<Button variant="secondary" asChild>
						<a href={storeHref}>
							Shop all drops
							<ArrowRightIcon className="size-4" />
						</a>
					</Button>
				</div>

				<div className="mt-10 grid gap-6 lg:grid-cols-4">
					{latestDrops.map((item) => (
						<a
							key={item.name}
							href={storeHref}
							className="group block hover:no-underline"
						>
							<div className="relative min-h-[28rem] overflow-hidden rounded-lg bg-zinc-950 p-5 text-white outline-1 -outline-offset-1 outline-black/5">
								<div className="relative z-10">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 font-medium text-primary text-xs">
										<ShoppingBagIcon className="size-3.5" />
										{item.status}
									</span>
									<h3 className="mt-4 font-brand font-semibold text-2xl">
										{item.name}
									</h3>
									<p className="mt-2 max-w-[17rem] text-sm opacity-70">
										{item.description}
									</p>
									<p className="mt-4 font-semibold text-white">
										{item.price}
									</p>
								</div>
								<Image
									src={item.src}
									alt=""
									fill
									sizes="(min-width: 1024px) 25vw, 100vw"
									className="object-cover object-center opacity-85 transition duration-500 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/5 to-black/45" />
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
