import { ChangelogSection } from "@changelog/components/ChangelogSection";
import {
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { pageMetadata } from "@shared/lib/seo";
import { getTranslations } from "@shared/lib/translations";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "changelog" });
	return pageMetadata({
		title: t("title"),
		description: t("description"),
		path: "/changelog",
	});
}

export default async function ChangelogPage() {
	const t = await getTranslations({ namespace: "changelog" });

	return (
		<EditorialShell>
			<EditorialContainer className="py-16 lg:py-24">
				<EditorialHeader
					eyebrow="Product"
					title={t("title")}
					subtitle={t("description")}
				/>
				<div className="mt-14">
					<ChangelogSection />
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
