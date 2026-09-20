import {
	COMPUTING_DEVICES,
	IMAGES,
	links,
	productHref,
} from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import {
	ArrowLink,
	Container,
	Eyebrow,
	SectionHeader,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ComputingSection({ copy, productLists }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.computing");

	const bandImage = copy?.image?.trim() || IMAGES.surfaceLaptop;

	const chosen = productLists?.productIds;
	const devices = chosen?.length
		? chosen.map((product) => ({
				key: product.id,
				brand: product.brand,
				name: product.name,
				href: productHref(product.slug),
			}))
		: COMPUTING_DEVICES.map((device) => ({
				key: device.name,
				brand: device.brand,
				name: device.name,
				href: links.category("laptops"),
			}));

	return (
		<section className="pt-16 lg:pt-[88px]">
			<Container>
				<SectionHeader
					eyebrow={c("eyebrow")}
					title={c("title")}
					link={{
						href: links.category("laptops"),
						label: c("link"),
					}}
				/>

				<div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[716fr_494fr]">
					<div className="relative min-h-[420px] overflow-hidden rounded-[4px] bg-[#5e4e98] p-8 text-white lg:min-h-[505px]">
						<Eyebrow className="text-[10px] text-white/90">
							{t("home.computing.card.eyebrow")}
						</Eyebrow>
						<p className="mt-7 font-medium text-[28px] leading-[1.15] tracking-[-0.02em] md:text-[34px]">
							{t("home.computing.card.title1")}
							<br />
							{t("home.computing.card.title2")}
						</p>
						<div className="mt-6">
							<ArrowLink
								href={links.category("laptops")}
								className="text-[11.5px] text-white"
							>
								{t("home.computing.card.link")}
							</ArrowLink>
						</div>
						<Image
							src={bandImage}
							alt=""
							width={425}
							height={309}
							sizes="(min-width: 1024px) 470px, 80vw"
							className="absolute right-[9%] bottom-[2%] w-[65%] object-contain"
						/>
					</div>

					<div className="flex flex-col">
						<Eyebrow className="pt-1 text-[10px] text-foreground/80 lg:pt-5">
							{c("listEyebrow")}
						</Eyebrow>
						<ul className="mt-4">
							{devices.map((device, index) => (
								<li
									key={device.key}
									className="border-border border-b"
								>
									<Link
										href={device.href}
										className="group flex items-start gap-5 py-7"
									>
										<span className="mt-[26px] w-4 shrink-0 text-[10px] text-primary">
											{String(index + 1).padStart(2, "0")}
										</span>
										<span className="flex-1">
											<span className="block text-[10px] text-muted-foreground">
												{device.brand}
											</span>
											<span className="mt-1 block font-medium text-[22px] text-foreground leading-tight">
												{device.name}
											</span>
											<span className="mt-2.5 block text-[10px] text-muted-foreground">
												{c("explore")}
											</span>
										</span>
										<ArrowRightIcon className="mt-[26px] size-4 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5" />
									</Link>
								</li>
							))}
						</ul>
						<Link
							href={links.category("office")}
							className="group mt-6 flex items-center justify-between rounded-[4px] bg-[#eeebe8] px-5 py-6 lg:mt-auto"
						>
							<span>
								<span className="block font-medium text-[15px] text-foreground">
									{t("home.computing.workspace.title")}
								</span>
								<span className="mt-2 block text-[10px] text-muted-foreground">
									{t("home.computing.workspace.subtitle")}
								</span>
							</span>
							<ArrowRightIcon className="size-4 text-foreground transition-transform group-hover:translate-x-0.5" />
						</Link>
					</div>
				</div>
			</Container>
		</section>
	);
}
