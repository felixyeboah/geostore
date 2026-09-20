import { ContactForm } from "@home/components/ContactForm";
import {
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { pageMetadata } from "@shared/lib/seo";
import { getTranslations } from "@shared/lib/translations";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "contact" });
	return pageMetadata({
		title: t("title"),
		description: t("description"),
		path: "/contact",
	});
}

export default async function ContactPage() {
	const t = await getTranslations({ namespace: "contact" });
	return (
		<EditorialShell>
			<EditorialContainer className="py-16 lg:py-24">
				<div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-24">
					<EditorialHeader
						eyebrow="Get in touch"
						title={t("title")}
						subtitle={t("description")}
					/>
					<div className="border-foreground border-t pt-10">
						<ContactForm />
					</div>
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
