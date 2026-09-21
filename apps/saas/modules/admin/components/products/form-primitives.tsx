"use client";

import { FormLabel } from "@repo/ui/components/form";
import type { ReactNode } from "react";

/**
 * A field label with its required mark and hint beside it. The mark and hint
 * sit outside the <label> element on purpose: a label whose text is "Name *"
 * cannot be found as "Name", by a test or by a screen reader's form list.
 */
export function Lbl({
	required,
	hint,
	children,
}: {
	required?: boolean;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex h-4 flex-wrap items-center gap-2 leading-none">
			<FormLabel className="font-medium text-[13px] text-foreground">
				{children}
			</FormLabel>
			{required && (
				<span
					aria-hidden="true"
					className="font-semibold text-[13px] text-[var(--ed-accent)] leading-none"
				>
					*
				</span>
			)}
			{hint && (
				<span className="text-[12px] text-muted-foreground/80 leading-none">
					{hint}
				</span>
			)}
		</div>
	);
}

/** One section of the product workspace, anchored for the nav and fix links. */
export function Section({
	id,
	title,
	lede,
	children,
}: {
	id: string;
	title: ReactNode;
	lede?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			className="scroll-mt-16 border-border border-b py-8 last:border-b-0"
		>
			<div className="mb-5">
				<h2 className="font-semibold text-[17px] tracking-[-0.02em]">
					{title}
				</h2>
				{lede && (
					<p className="mt-1 max-w-[62ch] text-[13px] text-muted-foreground leading-[1.55]">
						{lede}
					</p>
				)}
			</div>
			<div className="grid gap-5">{children}</div>
		</section>
	);
}
