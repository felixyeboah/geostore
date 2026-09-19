import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

export function SectionCard({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<section
			className={cn(
				"min-w-0 rounded-xl border bg-card shadow-sm",
				className,
			)}
		>
			{children}
		</section>
	);
}

export function SectionHead({
	title,
	description,
	action,
	divided = true,
}: {
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	divided?: boolean;
}) {
	return (
		<header
			className={cn(
				"flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5",
				divided && "border-b",
			)}
		>
			<div className="min-w-0">
				<h2 className="font-semibold text-sm">{title}</h2>
				{description && (
					<p className="mt-0.5 text-muted-foreground text-xs">
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
		<p className="px-5 py-8 text-center text-muted-foreground text-sm">
			{children}
		</p>
	);
}
