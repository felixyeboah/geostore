import { PaymentMarksRow } from "@commerce/components/PaymentMarks";
import { links } from "@home/data/landing";
import {
	STOREFRONT_CHROME_DEFAULTS,
	type StorefrontChrome,
} from "@repo/commerce";
import { BrandLogo } from "@shared/components/BrandLogo";
import { useTranslations } from "@shared/lib/translations";
import { ArrowUpIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

export function Footer({
	chrome = STOREFRONT_CHROME_DEFAULTS,
}: {
	/** Resolved in the layout — an override where an editor saved one. */
	chrome?: StorefrontChrome;
}) {
	const t = useTranslations();

	const columns = [
		{
			title: t("common.footer.explore"),
			items: [
				{
					label: t("home.categories.items.phones"),
					href: links.category("phones"),
				},
				{
					label: t("home.categories.items.laptops"),
					href: links.category("laptops"),
				},
				{
					label: t("home.categories.items.gaming"),
					href: links.category("gaming"),
				},
				{
					label: t("home.categories.items.appliances"),
					href: links.category("appliances"),
				},
			],
		},
		{
			title: t("common.footer.discover"),
			items: [
				{
					label: t("home.categories.items.monitors"),
					href: links.category("monitors"),
				},
				{
					label: t("home.categories.items.accessories"),
					href: links.category("accessories"),
				},
				{
					label: t("home.categories.items.office"),
					href: links.category("office"),
				},
				{ label: t("common.footer.allProducts"), href: links.shop },
			],
		},
	];

	return (
		<footer className="bg-[#efede9] text-foreground">
			<div className="mx-auto w-full max-w-[1360px] px-6 pt-14 pb-8 lg:px-12">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
					<div>
						<BrandLogo className="h-12" />
						<p className="mt-6 text-[11.5px] text-foreground/80 leading-[1.7]">
							{chrome.footerTagline1}
							<br />
							{chrome.footerTagline2}
						</p>
						<p className="mt-7 font-medium text-[9.5px] text-foreground/70">
							{chrome.footerMeta}
						</p>
						<p className="mt-2 text-[9.5px] text-foreground/60">
							{chrome.footerTagline}
						</p>
					</div>

					{columns.map((column) => (
						<div key={column.title}>
							<p className="font-medium text-[12px]">
								{column.title}
							</p>
							<ul className="mt-4 space-y-3.5">
								{column.items.map((item) => (
									<li key={item.label}>
										<Link
											href={item.href}
											className="text-[12px] text-foreground/70 transition-colors hover:text-foreground"
										>
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}

					<div>
						<p className="font-medium text-[12px]">
							{t("common.footer.connect")}
						</p>
						<ul className="mt-4 space-y-3.5">
							<li>
								<Link
									href={links.contact}
									className="inline-flex items-center gap-2 font-medium text-[12px] text-primary transition-colors hover:text-primary/80"
								>
									<MessageCircleIcon
										className="size-4"
										strokeWidth={1.75}
									/>
									{t("common.footer.contact")}
								</Link>
							</li>
							<li>
								<Link
									href={links.about}
									className="text-[12px] text-foreground/70 transition-colors hover:text-foreground"
								>
									{t("common.footer.about")}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 flex flex-col gap-3 border-border border-t pt-7 sm:flex-row sm:items-center sm:gap-6">
					<p className="eyebrow shrink-0 text-muted-foreground">
						{t("common.footer.paymentsTitle")}
					</p>
					<PaymentMarksRow />
				</div>

				<div className="mt-8 flex flex-col gap-3 border-border border-t pt-7 text-[10px] text-muted-foreground md:flex-row md:items-center md:justify-between">
					<p>
						{t("common.footer.copyright", {
							year: new Date().getFullYear(),
						})}
					</p>
					<p>{chrome.footerPayments}</p>
					<a href="#top" className="inline-flex items-center gap-1">
						{t("common.footer.backToTop")}
						<ArrowUpIcon className="size-2.5" />
					</a>
				</div>
			</div>
		</footer>
	);
}
