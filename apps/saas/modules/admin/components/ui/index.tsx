import { cn } from "@repo/ui";

export {
	AdminSelect,
	type AdminSelectOption,
	type AdminSelectProps,
} from "./AdminSelect";

import type * as React from "react";

/**
 * The admin's form controls, in the editorial language: 2px corners, hairline
 * borders, ink text, and the accent reserved for the one action a screen is
 * for.
 *
 * These replace the mix of `@repo/ui` pill buttons, raw `<input>` elements and
 * ad-hoc class strings that had accumulated across the admin. Everything takes
 * a ref so react-hook-form can drive it, and everything forwards native props
 * so nothing has to be re-implemented to add an `aria-` attribute.
 */

type ButtonVariant = "primary" | "quiet" | "danger" | "ghost";
type ControlSize = "sm" | "md" | "lg";

const BUTTON_BASE =
	"inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
	primary:
		"bg-[var(--ed-accent)] font-semibold text-white hover:bg-[#5a1fbd]",
	quiet: "border border-border bg-transparent text-foreground hover:border-foreground",
	danger: "border border-border bg-transparent text-destructive hover:border-destructive",
	ghost: "bg-transparent text-muted-foreground hover:text-foreground",
};

const BUTTON_SIZES: Record<ControlSize, string> = {
	sm: "h-8 px-2.5 text-[12.5px]",
	md: "h-10 px-4 text-[13.5px]",
	lg: "h-12 px-[26px] text-[14.5px]",
};

export interface AdminButtonProps extends React.ComponentProps<"button"> {
	variant?: ButtonVariant;
	size?: ControlSize;
}

export function AdminButton({
	variant = "quiet",
	size = "md",
	className,
	type = "button",
	...props
}: AdminButtonProps) {
	return (
		<button
			type={type}
			className={cn(
				BUTTON_BASE,
				BUTTON_VARIANTS[variant],
				BUTTON_SIZES[size],
				className,
			)}
			{...props}
		/>
	);
}

/**
 * The same shape as a button, for links that act like one. Tailwind's
 * preflight strips `text-transform` from `button` but not `a`, so the two are
 * kept separate rather than papered over with `asChild`.
 */
export function adminButtonClass(
	variant: ButtonVariant = "quiet",
	size: ControlSize = "md",
	className?: string,
): string {
	return cn(
		BUTTON_BASE,
		BUTTON_VARIANTS[variant],
		BUTTON_SIZES[size],
		className,
	);
}

const CONTROL_BASE =
	"w-full rounded-[2px] border border-border bg-transparent text-foreground shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

const CONTROL_SIZES: Record<ControlSize, string> = {
	sm: "h-9 px-2.5 text-[12.5px]",
	md: "h-11 px-3.5 text-[14px]",
	lg: "h-12 px-3.5 text-[15px]",
};

export interface AdminInputProps extends React.ComponentProps<"input"> {
	inputSize?: ControlSize;
}

export function AdminInput({
	className,
	inputSize = "md",
	...props
}: AdminInputProps) {
	return (
		<input
			className={cn(CONTROL_BASE, CONTROL_SIZES[inputSize], className)}
			{...props}
		/>
	);
}

export function AdminTextarea({
	className,
	rows = 3,
	...props
}: React.ComponentProps<"textarea">) {
	return (
		<textarea
			rows={rows}
			className={cn(
				CONTROL_BASE,
				"px-3.5 py-3 text-[14px] leading-[1.6]",
				className,
			)}
			{...props}
		/>
	);
}

export function AdminCheckbox({
	className,
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			type="checkbox"
			className={cn(
				"size-4 cursor-pointer rounded-[2px] accent-[var(--ed-accent)] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Label, control and the line underneath it. Keeping the three together is
 * what stops a form drifting into three different label treatments.
 */
export function AdminField({
	label,
	htmlFor,
	hint,
	error,
	className,
	children,
}: {
	label: string;
	htmlFor?: string;
	hint?: React.ReactNode;
	error?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("min-w-0", className)}>
			<label
				className="eyebrow block text-muted-foreground"
				htmlFor={htmlFor}
			>
				{label}
			</label>
			<div className="mt-2.5">{children}</div>
			{error ? (
				<p className="mt-2 text-[12px] text-destructive">{error}</p>
			) : hint ? (
				<p className="mt-2 text-[12px] text-muted-foreground">{hint}</p>
			) : null}
		</div>
	);
}
