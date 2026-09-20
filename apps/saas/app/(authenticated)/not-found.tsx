import { adminButtonClass } from "@admin/components/ui";
import { ErrorScreen } from "@shared/components/ErrorScreen";
import { storefront } from "@shared/lib/storefront";
import { getTranslations } from "@shared/lib/translations";
import Link from "next/link";

export default async function NotFoundPage() {
	const t = await getTranslations("notFound");

	return (
		<ErrorScreen
			eyebrow={`${t("code")} · ${t("title")}`}
			title="This page isn't here."
			description={t("description")}
			actions={
				<>
					<Link
						href="/admin/overview"
						className={adminButtonClass("primary")}
					>
						{t("backToOverview")}
					</Link>
					<a
						href={storefront.shop}
						className={adminButtonClass("ghost")}
					>
						{t("viewStorefront")}
					</a>
				</>
			}
		/>
	);
}
