import { config } from "@config";
import Image from "next/image";

const storeHref = config.saasUrl || "/";

const spotlightBrands = [
	{
		name: "Apple",
		description: "Phones, AirPods, watches, and everyday Apple essentials.",
		src: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Samsung",
		description: "Galaxy phones, TVs, tablets, and reliable upgrade picks.",
		src: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Audio",
		description: "JBL, Sony, earbuds, speakers, and sound gear for every day.",
		src: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80",
	},
];

export function FeaturesSection() {
	return (
		<section id="features" className="scroll-my-20 py-14 lg:py-20">
			<div className="container">
				<div className="mb-10 max-w-3xl">
					<p className="font-semibold text-primary text-sm uppercase">
						Brand spotlight
					</p>
					<h2 className="mt-3 font-brand font-semibold text-3xl text-foreground md:text-5xl">
						Start with the brands you already trust.
					</h2>
				</div>
				<div className="grid gap-6 lg:grid-cols-3">
					{spotlightBrands.map((brand, index) => (
						<a
							key={brand.name}
							href={storeHref}
							className="group relative block min-h-[28rem] overflow-hidden rounded-lg bg-zinc-950 text-white outline-1 -outline-offset-1 outline-black/10 hover:no-underline"
						>
							<Image
								src={brand.src}
								alt=""
								fill
								sizes="(min-width: 1024px) 33vw, 100vw"
								className="object-cover opacity-75 transition duration-500 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
							<div className="absolute inset-x-0 bottom-0 p-6">
								<p className="text-white/65 text-sm uppercase">
									{index === 0 ? "Top request" : "Popular pick"}
								</p>
								<h3 className="mt-2 font-brand font-semibold text-4xl">
									{brand.name}
								</h3>
								<p className="mt-3 max-w-sm text-white/75">
									{brand.description}
								</p>
								<span className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 font-semibold text-sm text-zinc-950">
									Shop brand
								</span>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
