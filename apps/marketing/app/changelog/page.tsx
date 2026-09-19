import { ChangelogSection } from "@changelog/components/ChangelogSection";
import {
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { getTranslations } from "@shared/lib/translations";

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
