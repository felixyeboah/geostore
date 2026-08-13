import { Button } from "@repo/ui/components/button";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
	return (
		<main className="container flex min-h-[70vh] items-center justify-center py-16">
			<div className="max-w-lg text-center">
				<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
					<SearchXIcon className="size-6 text-muted-foreground" />
				</span>
				<h1 className="mt-5 font-brand font-semibold text-4xl tracking-tight">
					We couldn’t find that page.
				</h1>
				<p className="mt-3 text-muted-foreground leading-7">
					The product or page may have moved, been archived, or never
					existed.
				</p>
				<Button asChild className="mt-7">
					<Link href="/">Browse the store</Link>
				</Button>
			</div>
		</main>
	);
}
