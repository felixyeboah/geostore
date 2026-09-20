import { links } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import { STOREFRONT_CHROME_DEFAULTS, whatsAppLink } from "@repo/commerce";
import { Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

/**
 * The closing "ask us to source it" band.
 *
 * The button opens WhatsApp rather than the contact form: this shop already
 * sells over WhatsApp, and a customer who cannot find what they want will
 * message far sooner than they will fill in a form. The number is editable in
 * the back office under Storefront, so it is read from chrome rather than
 * hardcoded. A number that cannot be dialled falls back to /contact instead of
 * rendering a link that goes nowhere.
 */
export function EnquirySection({ copy, chrome }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.enquiry");

	const number = chrome?.whatsapp ?? STOREFRONT_CHROME_DEFAULTS.whatsapp;
	const href =
		whatsAppLink(number, "Hi GeoStoresGH — I'm looking for ") ??
		links.contact;
	const isWhatsApp = href !== links.contact;

	return (
		<section>
			<Container>
				<div className="flex flex-col gap-10 border-border border-t pt-[74px] pb-20 md:flex-row md:items-start md:justify-between">
					<div>
						<Eyebrow>{c("eyebrow")}</Eyebrow>
						<h2 className="mt-6 font-medium text-[38px] text-foreground leading-[1.1] tracking-[-0.03em] md:text-[48px]">
							{c("title1")}
							<br />
							{c("title2")}
						</h2>
						<p className="mt-7 text-[12.5px] text-muted-foreground">
							{c("subtitle")}
						</p>
					</div>
					<Link
						href={href}
						// A wa.me link leaves the site, so it opens away from
						// the shop rather than navigating the customer out of
						// a session they may be mid-way through.
						{...(isWhatsApp
							? {
									target: "_blank",
									rel: "noreferrer",
								}
							: {})}
						className="inline-flex h-[52px] w-fit items-center gap-6 rounded-[4px] bg-primary px-6 font-medium text-[13.5px] text-white transition-colors hover:bg-primary/90 md:mt-14"
					>
						<MessageCircleIcon
							className="size-[18px]"
							strokeWidth={1.75}
						/>
						{c("cta")}
						<ArrowRightIcon className="size-4" />
					</Link>
				</div>
			</Container>
		</section>
	);
}
