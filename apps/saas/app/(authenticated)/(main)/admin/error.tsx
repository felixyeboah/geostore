"use client";

import { AdminButton } from "@admin/components/ui";
import { logger } from "@repo/logs";
import { CircleAlertIcon } from "lucide-react";
import { useEffect } from "react";

/**
 * The admin's own error boundary. Without it a failed screen falls through to
 * the app's root boundary, whose copy talks to a shopper about their cart —
 * meaningless to someone mid-edit in the back office.
 */
export default function AdminError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	useEffect(() => {
		logger.error("Admin screen failed", { error });
	}, [error]);

	return (
		<div className="flex min-h-[50vh] items-center justify-center py-16">
			<div className="max-w-lg text-center">
				<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
					<CircleAlertIcon className="size-6 text-destructive" />
				</span>
				<h1 className="mt-5 font-brand font-semibold text-3xl tracking-tight">
					That screen hit a problem.
				</h1>
				<p className="mt-3 text-muted-foreground leading-7">
					Usually this is a dropped connection — nothing was saved
					twice, and the storefront itself is untouched. Try again; if
					it keeps happening, the server logs have the detail.
				</p>
				<AdminButton
					variant="primary"
					className="mx-auto mt-7"
					onClick={() => retry()}
				>
					Try again
				</AdminButton>
			</div>
		</div>
	);
}
