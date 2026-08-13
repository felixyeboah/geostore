"use client";

import { Button } from "@repo/ui/components/button";
import { CircleAlertIcon } from "lucide-react";

export default function AppError({ reset }: { reset: () => void }) {
	return (
		<main className="container flex min-h-[70vh] items-center justify-center py-16">
			<div className="max-w-lg text-center">
				<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
					<CircleAlertIcon className="size-6 text-destructive" />
				</span>
				<h1 className="mt-5 font-brand font-semibold text-4xl tracking-tight">
					Something didn’t load.
				</h1>
				<p className="mt-3 text-muted-foreground leading-7">
					Your cart is kept on this device. Try the page again, or
					return to the store if the problem continues.
				</p>
				<Button className="mt-7" onClick={reset}>
					Try again
				</Button>
			</div>
		</main>
	);
}
