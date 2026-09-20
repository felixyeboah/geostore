import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * A block of the overview.
 *
 * These used to be raised cards. The editorial language has no cards: a block
 * is separated by a hairline and by space, and the type does the work. Keeping
 * the old names means every list that was built on them is restyled at once.
 */
export function SectionCard({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return <section className={cn("min-w-0", className)}>{children}</section>;
}

export function SectionHead({
	title,
	description,
	action,
}: {
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	/** Kept for the old call sites; the hairline is always drawn now. */
	divided?: boolean;
}) {
	return (
		<header className="flex items-baseline justify-between gap-4 border-border border-b pb-3">
			<div className="min-w-0">
				<h2 className="eyebrow text-muted-foreground">{title}</h2>
				{description && (
					<p className="mt-2 text-[12.5px] text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action}
		</header>
	);
}

export function EmptyRow({ children }: PropsWithChildren) {
	return (
		<p className="py-10 text-[13px] text-muted-foreground">{children}</p>
	);
}
