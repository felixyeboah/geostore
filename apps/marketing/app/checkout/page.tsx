import { getSession } from "@auth/lib/server";
import { CheckoutForm } from "@commerce/components/CheckoutForm";
import { getUserStoreAddresses } from "@repo/database";
import { getStorePaymentProvider } from "@repo/payments";
import { getStorefrontCheckout } from "@shared/lib/store-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Checkout",
	description:
		"Confirm your delivery details and pay with mobile money, card, or cash on delivery.",
};

export default async function CheckoutPage() {
	const [session, checkout] = await Promise.all([
		getSession(),
		getStorefrontCheckout(),
	]);
	const address = session
		? (await getUserStoreAddresses(session.user.id))[0]
		: undefined;

	// With online payment off the provider is never reached — and may not be
	// configured at all — so it is only resolved when it can actually be used.
	return (
		<CheckoutForm
			checkout={checkout}
			paymentProvider={
				checkout.onlinePaymentsEnabled
					? getStorePaymentProvider()
					: "mock"
			}
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
