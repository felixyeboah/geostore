import { Text } from "@react-email/components";
import React from "react";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function OrderShipped({
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
				Your Geostoresgh order {orderNumber} is out for delivery. Please
				keep your phone nearby so the rider can reach you.
			</Text>
		</Wrapper>
	);
}

OrderShipped.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "Abena",
	orderNumber: "GST-20260813-A7K2",
};

export default OrderShipped;
