import { Link, Text } from "@react-email/components";
import React from "react";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function OrderConfirmation({
	name,
	orderNumber,
	totalLabel,
	isPayOnDelivery,
	orderUrl,
}: {
	name: string;
	orderNumber: string;
	totalLabel: string;
	/** Cash on delivery is confirmed but not yet paid — don't call it "paid". */
	isPayOnDelivery?: boolean;
	/** Tokenised link so a guest can reach an order they have no account for. */
	orderUrl?: string;
} & BaseMailProps) {
	return (
		<Wrapper>
			<Text>Hi {name},</Text>
			<Text>
				We’ve confirmed your Geostoresgh order {orderNumber}.{" "}
				{isPayOnDelivery
					? `Pay ${totalLabel} in cash when it arrives.`
					: `Total paid: ${totalLabel}.`}
			</Text>
			{orderUrl ? (
				<Text>
					You can view this order here:{" "}
					<Link href={orderUrl}>{orderUrl}</Link>
				</Text>
			) : null}
			<Text>
				We’ll email you again when the order is out for delivery.
			</Text>
		</Wrapper>
	);
}

OrderConfirmation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "Abena",
	orderNumber: "GST-20260813-A7K2",
	totalLabel: "GH₵ 1,450",
};

export default OrderConfirmation;
