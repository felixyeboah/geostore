"use client";

import { AdminButton, adminButtonClass } from "@admin/components/ui";
import { ErrorScreen } from "@shared/components/ErrorScreen";
import { storefront } from "@shared/lib/storefront";

/**
 * The app's last boundary. Anything that reaches it failed outside the admin
 * chrome — or before it could even render — so this screen has to stand on
 * its own: no layout, no nav, nothing else that might be part of the crash.
 */
export default function AppError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<ErrorScreen
			homeHref={storefront.shop}
			eyebrow="Error · Something went wrong"
			title="Something didn't load."
			description="Nothing was saved or sent twice. Try the page again; if it keeps happening, pass the detail below to whoever runs the deploy."
			actions={
				<>
					<AdminButton variant="primary" onClick={() => reset()}>
						Try again
					</AdminButton>
					<a
						href={storefront.shop}
						className={adminButtonClass("ghost")}
					>
						Back to the store
					</a>
				</>
			}
			detail={
				<>
					{error.digest && <div>digest — {error.digest}</div>}
					<div>{error.message}</div>
				</>
			}
		/>
	);
}
