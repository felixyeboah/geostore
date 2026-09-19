import { COMPUTING_DEVICES, IMAGES, links } from "@home/data/landing";
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

export function ComputingSection() {
	const t = useTranslations();

	return (
		<section className="pt-16 lg:pt-[88px]">
			<Container>
				<SectionHeader
					eyebrow={t("home.computing.eyebrow")}
					title={t("home.computing.title")}
					link={{
						href: links.category("laptops"),
						label: t("home.computing.link"),
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
							src={IMAGES.surfaceLaptop}
							alt=""
							width={425}
							height={309}
							sizes="(min-width: 1024px) 470px, 80vw"
							className="absolute right-[9%] bottom-[2%] w-[65%] object-contain"
						/>
					</div>

					<div className="flex flex-col">
						<Eyebrow className="pt-1 text-[10px] text-foreground/80 lg:pt-5">
							{t("home.computing.listEyebrow")}
						</Eyebrow>
						<ul className="mt-4">
							{COMPUTING_DEVICES.map((device, index) => (
								<li
									key={device.name}
									className="border-border border-b"
								>
									<Link
										href={links.category("laptops")}
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
												{t("home.computing.explore")}
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
