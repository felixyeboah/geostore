import { Link, Text } from "@react-email/components";
import React from "react";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { createTranslator } from "../lib/translator";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function MagicLink({
	url,
	locale,
	translations,
}: {
	url: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.magicLink, common: translations.common },
	});

	return (
		<Wrapper>
			<Text>{t("body")}</Text>

			<Text>{t("common.useLink")}</Text>

			<PrimaryButton href={url}>{t("login")} &rarr;</PrimaryButton>

			<Text className="text-muted-foreground text-sm">
				{t("common.openLinkInBrowser")}
				<Link href={url}>{url}</Link>
			</Text>
		</Wrapper>
	);
}

MagicLink.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
};

export default MagicLink;
