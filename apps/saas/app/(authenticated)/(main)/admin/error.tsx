"use client";

import { AdminButton, adminButtonClass } from "@admin/components/ui";
import { logger } from "@repo/logs";
import { ErrorScreen } from "@shared/components/ErrorScreen";
import Link from "next/link";
import { useEffect } from "react";

/**
 * The admin's own error boundary. Without it a failed screen falls through to
 * the app's root boundary, whose copy talks to a shopper about their cart —
 * meaningless to someone mid-edit in the back office.
 *
 * The screen is drawn over the whole viewport, nav included: a screen that
 * threw is a dead end, not a page with a wound in the middle, so the only
 * doors offered are "try again" and "back to overview".
 */
export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		logger.error("Admin screen failed", { error });
	}, [error]);

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<ErrorScreen
				eyebrow="Error · Something went wrong"
				title="That screen hit a problem."
				description="Usually this is a dropped connection — nothing was saved twice, and the storefront itself is untouched. Try again; if it keeps happening, pass the detail below to whoever runs the deploy."
				actions={
					<>
						<AdminButton variant="primary" onClick={() => reset()}>
							Try again
						</AdminButton>
						<Link
							href="/admin/overview"
							className={adminButtonClass("ghost")}
						>
							Back to overview
						</Link>
					</>
				}
				detail={
					<>
						{error.digest && <div>digest — {error.digest}</div>}
						<div>{error.message}</div>
					</>
				}
			/>
		</div>
	);
}
