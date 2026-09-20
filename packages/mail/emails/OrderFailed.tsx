import { Text } from "@react-email/components";
import React from "react";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function OrderFailed({
	name,
	orderNumber,
}: {
	name: string;
	orderNumber: string;
} & BaseMailProps) {
	return (
		<Wrapper>
			<Text>Hi {name},</Text>
			<Text>
				We could not complete payment for Geostoresgh order{" "}
				{orderNumber}. Nothing has been charged and the reserved items
				have been returned to stock.
			</Text>
			<Text>You can try checkout again whenever you’re ready.</Text>
		</Wrapper>
	);
}

OrderFailed.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "Abena",
	orderNumber: "GST-20260813-A7K2",
};

export default OrderFailed;
