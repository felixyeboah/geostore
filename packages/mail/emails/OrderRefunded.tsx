import { Text } from "@react-email/components";
import React from "react";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function OrderRefunded({
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
				A refund has been issued for Geostoresgh order {orderNumber}.
				The items have been returned to stock.
			</Text>
			<Text>
				Mobile money and card refunds usually appear in a few minutes,
				depending on your provider.
			</Text>
		</Wrapper>
	);
}

OrderRefunded.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "Abena",
	orderNumber: "GST-20260813-A7K2",
};

export default OrderRefunded;
