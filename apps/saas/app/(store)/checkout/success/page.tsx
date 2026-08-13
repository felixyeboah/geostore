import { getSession } from "@auth/lib/server";
import { CheckoutSuccess } from "@commerce/components/CheckoutSuccess";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
	title: "Order confirmed",
	description: "Your Geostoresgh mock order has been confirmed.",
};

export default async function CheckoutSuccessPage() {
	const session = await getSession();
	return (
		<Suspense
			fallback={
				<div className="container py-12">
					<div className="h-[32rem] animate-pulse rounded-2xl bg-muted" />
				</div>
			}
		>
			<CheckoutSuccess isSignedIn={Boolean(session)} />
		</Suspense>
	);
}
