import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * The editorial surface used by every storefront and content page:
 * `design/landing-v5/02-editorial.html`. `.editorial` redefines ink, hairline
 * and muted (see globals.css); the width and gutters here are what keep the
 * catalogue, the checkout and the written pages on one grid.
 */
export function EditorialShell({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return <div className={cn("editorial", className)}>{children}</div>;
}

export function EditorialContainer({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-[1560px] px-5 md:px-10",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface EditorialHeaderProps {
	eyebrow: string;
	title: ReactNode;
	subtitle?: ReactNode;
	/** Sits on the statement's baseline at the far right, like the count does. */
	aside?: ReactNode;
	titleClassName?: string;
}

export function EditorialHeader({
	eyebrow,
	title,
	subtitle,
	aside,
	titleClassName,
}: EditorialHeaderProps) {
	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
				<div>
					<p className="eyebrow mb-4 text-muted-foreground">
						{eyebrow}
					</p>
					<h1
						className={cn(
							"max-w-[18ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]",
							titleClassName,
						)}
					>
						{title}
					</h1>
				</div>
				{aside && (
					<p className="eyebrow whitespace-nowrap text-muted-foreground tabular-nums">
						{aside}
					</p>
				)}
			</div>
			{subtitle && (
				<p className="mt-4 max-w-[46ch] text-[15.5px] text-muted-foreground leading-[1.62]">
					{subtitle}
				</p>
			)}
		</div>
	);
}

/** The squared accent button the editorial pages are built to. */
export const EDITORIAL_BUTTON =
	"inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-[2px] bg-[var(--ed-accent)] px-[26px] font-semibold text-[14.5px] text-white tracking-[-0.01em] transition-colors hover:bg-[#5a1fbd]";

/** The quieter counterpart: hairline box, ink text. */
export const EDITORIAL_BUTTON_QUIET =
	"inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-[2px] border border-border bg-transparent px-[26px] font-semibold text-[14.5px] text-foreground tracking-[-0.01em] transition-colors hover:border-foreground";

/** Inline text link with the underline the mockup uses. */
export const EDITORIAL_LINK =
	"text-[var(--ed-accent)] underline decoration-1 underline-offset-[3px] hover:decoration-2";
