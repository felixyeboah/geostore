import { Button } from "@repo/ui/components/button";
import { AppWrapper } from "@shared/components/AppWrapper";
import { getTranslations } from "@shared/lib/translations";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default async function NotFoundPage() {
	const t = await getTranslations("notFound");

	return (
		<AppWrapper>
			<div className="flex h-full flex-col items-center justify-center">
				<h1 className="font-bold text-5xl">{t("code")}</h1>
				<p className="mt-2 text-2xl">{t("title")}</p>

				<Button asChild className="mt-4">
					<Link href="/dashboard">
						<ArrowLeftIcon className="mr-2 size-4" />{" "}
						{t("goToDashboard")}
					</Link>
				</Button>
			</div>
		</AppWrapper>
	);
}
