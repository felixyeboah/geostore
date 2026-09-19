import { links } from "@home/data/landing";
import { Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

export function EnquirySection() {
	const t = useTranslations();

	return (
		<section>
			<Container>
				<div className="flex flex-col gap-10 border-border border-t pt-[74px] pb-20 md:flex-row md:items-start md:justify-between">
					<div>
						<Eyebrow>{t("home.enquiry.eyebrow")}</Eyebrow>
						<h2 className="mt-6 font-medium text-[38px] text-foreground leading-[1.1] tracking-[-0.03em] md:text-[48px]">
							{t("home.enquiry.title1")}
							<br />
							{t("home.enquiry.title2")}
						</h2>
						<p className="mt-7 text-[12.5px] text-muted-foreground">
							{t("home.enquiry.subtitle")}
						</p>
					</div>
					<Link
						href={links.contact}
						className="inline-flex h-[52px] w-fit items-center gap-6 rounded-[4px] bg-primary px-6 font-medium text-[13.5px] text-white transition-colors hover:bg-primary/90 md:mt-14"
					>
						<MessageCircleIcon
							className="size-[18px]"
							strokeWidth={1.75}
						/>
						{t("home.enquiry.cta")}
						<ArrowRightIcon className="size-4" />
					</Link>
				</div>
			</Container>
		</section>
	);
}
