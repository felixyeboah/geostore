import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * The admin's page vocabulary, in the same editorial language as the
 * storefront: near-black ink, hairline rules, 2px corners, small caps for
 * labels and no cards.
 *
 * Admin pages are denser than shop pages, so the type scale is a step down
 * from `EditorialHeader` in apps/marketing, but the tokens are identical —
 * `.editorial` is already defined in apps/saas/app/globals.css.
 */
export function AdminShell({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div className={cn("editorial min-h-full", className)}>{children}</div>
	);
}

export function AdminContainer({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div className={cn("mx-auto w-full max-w-[1240px] px-6", className)}>
			{children}
		</div>
	);
}

interface AdminHeaderProps {
	eyebrow?: string;
	title: ReactNode;
	description?: ReactNode;
	/** Buttons, sat on the title's baseline at the far right. */
	actions?: ReactNode;
}

export function AdminHeader({
	eyebrow,
	title,
	description,
	actions,
}: AdminHeaderProps) {
	return (
		<div className="border-foreground border-b pb-6">
			<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
				<div className="min-w-0">
					{eyebrow && (
						<p className="eyebrow mb-3.5 text-muted-foreground">
							{eyebrow}
						</p>
					)}
					<h1 className="font-semibold text-[clamp(26px,2.6vw,34px)] text-foreground leading-[1.05] tracking-[-0.038em]">
						{title}
					</h1>
				</div>
				{actions && (
					<div className="flex shrink-0 flex-wrap items-center gap-2.5">
						{actions}
					</div>
				)}
			</div>
			{description && (
				<p className="mt-3.5 max-w-[62ch] text-[14px] text-muted-foreground leading-[1.6]">
					{description}
				</p>
			)}
		</div>
	);
}

/** A titled block within a page, separated by a hairline rather than a card. */
export function AdminSection({
	title,
	description,
	actions,
	className,
	children,
}: PropsWithChildren<{
	title?: string;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
}>) {
	return (
		<section className={cn("border-border border-t pt-7", className)}>
			{(title || actions) && (
				<div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
					<div>
						{title && (
							<h2 className="eyebrow text-muted-foreground">
								{title}
							</h2>
						)}
						{description && (
							<p className="mt-2.5 max-w-[62ch] text-[13.5px] text-muted-foreground leading-[1.6]">
								{description}
							</p>
						)}
					</div>
					{actions && (
						<div className="flex items-center gap-2.5">
							{actions}
						</div>
					)}
				</div>
			)}
			{children}
		</section>
	);
}

/** Shown in place of a table or list when there is genuinely nothing yet. */
export function AdminEmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: ReactNode;
	action?: ReactNode;
}) {
	return (
		<div className="border-border border-t py-16 text-center">
			<p className="font-medium text-[15px] text-foreground">{title}</p>
			{description && (
				<p className="mx-auto mt-2.5 max-w-[44ch] text-[13.5px] text-muted-foreground leading-[1.6]">
					{description}
				</p>
			)}
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}

/* --- table vocabulary --------------------------------------------------- */

/*
 * Buttons and form controls moved to `@admin/components/ui` as real
 * components. These stay as class strings because a `<table>` cannot be
 * assembled from wrapper components without fighting the element rules.
 */

/** Column head: small caps over a hairline, as on the storefront. */
export const ADMIN_TH =
	"eyebrow whitespace-nowrap border-border border-b px-3 py-3 text-left font-semibold text-muted-foreground first:pl-0 last:pr-0";

export const ADMIN_TD =
	"border-border border-b px-3 py-3.5 align-middle text-[13.5px] text-foreground first:pl-0 last:pr-0";

export const ADMIN_TABLE = "w-full border-collapse text-left";
