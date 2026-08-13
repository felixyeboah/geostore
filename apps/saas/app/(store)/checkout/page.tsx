import { getSession } from "@auth/lib/server";
import { CheckoutForm } from "@commerce/components/CheckoutForm";
import { getUserStoreAddresses } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Checkout",
	description:
		"Confirm your delivery details and place a mock Geostoresgh order.",
};

export default async function CheckoutPage() {
	const session = await getSession();
	const address = session
		? (await getUserStoreAddresses(session.user.id))[0]
		: undefined;

	return (
		<CheckoutForm
			prefill={{
				name: address?.recipientName ?? session?.user.name,
				email: session?.user.email,
				phone: address?.phone,
				line1: address?.line1,
				line2: address?.line2 ?? undefined,
				city: address?.city,
				region: address?.region,
			}}
		/>
	);
}
