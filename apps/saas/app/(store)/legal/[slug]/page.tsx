import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const LEGAL_PAGES = {
	"privacy-policy": {
		title: "Privacy policy",
		updated: "13 August 2026",
		sections: [
			[
				"What we collect",
				"We collect account, contact, delivery, and order information that you submit. We also record the technical information required to keep sessions secure and understand whether the store is working correctly.",
			],
			[
				"How we use it",
				"We use this information to provide accounts, process and fulfil orders, respond to support requests, prevent misuse, and improve the shopping experience.",
			],
			[
				"Mock checkout",
				"The current checkout records a mock payment transaction for product testing. It does not request card or mobile money credentials and does not transfer real funds.",
			],
			[
				"Your choices",
				"You can update account details and saved addresses from account settings. Contact support to request access, correction, export, or deletion of personal data, subject to records we must retain.",
			],
			[
				"Contact",
				"For privacy questions, email support@geostoresgh.com.",
			],
		],
	},
	terms: {
		title: "Store terms",
		updated: "13 August 2026",
		sections: [
			[
				"Using the store",
				"Provide accurate account and delivery information, use the service lawfully, and do not attempt to disrupt or misuse the platform.",
			],
			[
				"Products and stock",
				"Product availability and pricing may change. An order is accepted when confirmation is issued. We may contact you if an inventory or listing error affects fulfilment.",
			],
			[
				"Mock payments",
				"Checkout is currently a demonstration. A mock transaction marks an order as paid without charging real funds. Real payment terms will be published before live payment processing is enabled.",
			],
			[
				"Delivery and returns",
				"Delivery timing depends on destination and stock. Contact support promptly if an item arrives damaged, faulty, or different from its description. Product-specific warranty details appear on the product page.",
			],
			[
				"Contact",
				"Questions about an order or these terms can be sent to support@geostoresgh.com.",
			],
		],
	},
} as const;

interface LegalPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: LegalPageProps): Promise<Metadata> {
	const { slug } = await params;
	const page = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
	return { title: page?.title ?? "Page not found" };
}

export default async function LegalPage({ params }: LegalPageProps) {
	const { slug } = await params;
	const page = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
	if (!page) {
		notFound();
	}

	return (
		<div className="container max-w-4xl py-10 lg:py-16">
			<nav
				className="text-muted-foreground text-sm"
				aria-label="Breadcrumb"
			>
				<Link href="/" className="hover:text-foreground">
					Store
				</Link>{" "}
				/ <span className="text-foreground">{page.title}</span>
			</nav>
			<header className="mt-8 border-b pb-8">
				<p className="font-semibold text-primary text-sm">Legal</p>
				<h1 className="mt-2 font-brand font-semibold text-5xl tracking-tight">
					{page.title}
				</h1>
				<p className="mt-4 text-muted-foreground text-sm">
					Last updated {page.updated}
				</p>
			</header>
			<div className="divide-y">
				{page.sections.map(([title, body]) => (
					<section
						key={title}
						className="grid gap-3 py-7 sm:grid-cols-[14rem_1fr] sm:gap-8"
					>
						<h2 className="font-semibold text-lg">{title}</h2>
						<p className="text-muted-foreground leading-7">
							{body}
						</p>
					</section>
				))}
			</div>
		</div>
	);
}
