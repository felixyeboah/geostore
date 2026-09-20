import { cn } from "@repo/ui";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A dead-end screen — 404 or a thrown error — drawn in the same editorial
 * language as the admin: warm paper, hairlines, mono accents, 2px corners.
 *
 * These screens stand alone on purpose. The page that failed (or never
 * existed) is not a safe place to keep navigating from, so the regular app
 * chrome is replaced by a brand mark, one honest sentence and the way back.
 */
export function ErrorScreen({
	eyebrow,
	title,
	description,
	actions,
	detail,
	homeHref,
	className,
}: {
	/** Small caps line above the title — e.g. "404 · Page not found". */
	eyebrow: string;
	title: string;
	description: ReactNode;
	/** Buttons/links sat under the copy — keep to one primary plus one quiet. */
	actions?: ReactNode;
	/**
	 * Optional technical detail (error digest, message) shown in a bordered
	 * mono block — what staff paste when they report the problem.
	 */
	detail?: ReactNode;
	/** Where the logo points; the admin's front door by default. */
	homeHref?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"editorial flex min-h-screen flex-col bg-background",
				className,
			)}
		>
			<header className="flex items-center justify-between border-border border-b px-6 py-4 sm:px-10">
				<Link href={homeHref ?? "/admin/overview"} className="block">
					{/* The landscape lockup — the square logo stacks its
						wordmark vertically and shrinks to a sliver at bar
						height. */}
					<img
						src="/images/geostoresgh-logo-landscape.png"
						alt="Geostoresgh"
						className="h-9 w-auto"
						decoding="async"
					/>
				</Link>
				<span className="eyebrow text-muted-foreground">{eyebrow}</span>
			</header>

			<main className="flex flex-1 items-center justify-center px-6 py-16">
				<div className="w-full max-w-[540px] text-center">
					<h1 className="font-semibold text-[clamp(30px,4vw,44px)] text-foreground leading-[1.05] tracking-[-0.038em]">
						{title}
					</h1>
					<div className="mx-auto mt-4 max-w-[46ch] text-[14.5px] text-muted-foreground leading-[1.7]">
						{description}
					</div>
					{actions && (
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							{actions}
						</div>
					)}
					{detail && (
						<div className="mx-auto mt-10 max-w-[480px] rounded-[2px] border border-border bg-muted/40 px-4 py-3 text-left font-mono text-[11.5px] text-muted-foreground leading-[1.7] break-all">
							{detail}
						</div>
					)}
				</div>
			</main>

			<footer className="border-border border-t px-6 py-4 text-center text-[11.5px] text-muted-foreground sm:px-10">
				Geostoresgh — back office
			</footer>
		</div>
	);
}
