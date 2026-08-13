import { config } from "@config";
import { Logo } from "@repo/ui";
import { useTranslations } from "@shared/lib/translations";
import Link from "next/link";

export function Footer() {
	const t = useTranslations();

	return (
		<footer className="border-t py-8 text-foreground/60 text-sm">
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div>
					<Logo className="opacity-70 grayscale" />
					<p className="mt-3 text-sm opacity-70">
						© {new Date().getFullYear()} {config.appName}.{" "}
						{t("common.footer.builtWith")}.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<Link href="/blog" className="block">
						{t("common.footer.blog")}
					</Link>

					<a href="#features" className="block">
						{t("common.footer.features")}
					</a>

					<a href="/#latest-drops" className="block">
						{t("common.footer.latestDrops")}
					</a>
				</div>

				<div className="flex flex-col gap-2">
					<Link href="/legal/privacy-policy" className="block">
						{t("common.footer.privacyPolicy")}
					</Link>

					<Link href="/legal/terms" className="block">
						{t("common.footer.termsAndConditions")}
					</Link>
				</div>
			</div>
		</footer>
	);
}
