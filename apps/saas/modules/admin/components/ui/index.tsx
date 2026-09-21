import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";

export {
	AdminCombobox,
	type AdminComboboxProps,
} from "./AdminCombobox";
export {
	AdminSelect,
	type AdminSelectOption,
	type AdminSelectProps,
} from "./AdminSelect";

import type * as React from "react";
import {
	CONTROL_BASE,
	CONTROL_SIZES,
	type ControlSize,
} from "./control-styles";

/**
 * The admin's form controls, in the editorial language: 2px corners, hairline
 * borders, ink text, and the accent reserved for the one action a screen is
 * for.
 *
 * Each one is the shadcn primitive from `@repo/ui` dressed for the admin, so
 * behaviour (focus rings, disabled states, `loading` on buttons, the Radix
 * switch) comes from the shared library and only the look is decided here.
 * Everything forwards native props so nothing has to be re-implemented to add
 * an `aria-` attribute.
 */

type ButtonVariant = "primary" | "quiet" | "danger" | "ghost";

const BUTTON_BASE =
	"inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium tracking-[-0.01em] transition-colors focus-visible:ring-foreground [&>svg]:mr-0";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
	primary:
		"bg-[var(--ed-accent)] font-semibold text-white hover:bg-[#5a1fbd] hover:text-white",
	quiet: "border border-border bg-transparent text-foreground hover:border-foreground hover:bg-transparent",
	danger: "border border-border bg-transparent text-destructive hover:border-destructive hover:bg-transparent hover:text-destructive",
	ghost: "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground",
};

const BUTTON_SIZES: Record<ControlSize, string> = {
	sm: "h-8 px-2.5 text-[12.5px]",
	md: "h-10 px-4 text-[13.5px]",
	lg: "h-12 px-[26px] text-[14.5px]",
};

export interface AdminButtonProps
	extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {
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
		<Button
			type={type}
			variant="ghost"
			size="md"
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
		"inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		BUTTON_VARIANTS[variant],
		BUTTON_SIZES[size],
		className,
	);
}

export interface AdminInputProps extends React.ComponentProps<"input"> {
	inputSize?: ControlSize;
}

export function AdminInput({
	className,
	inputSize = "md",
	...props
}: AdminInputProps) {
	return (
		<Input
			className={cn(
				CONTROL_BASE,
				CONTROL_SIZES[inputSize],
				"py-0 text-[length:inherit]",
				className,
			)}
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
		<Textarea
			rows={rows}
			className={cn(
				CONTROL_BASE,
				"min-h-0 px-3.5 py-3 text-[14px] leading-[1.6] md:text-[14px]",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Still a native checkbox: the tables use it for row selection with
 * `onChange` event semantics, and the accent-colour tick matches the rest of
 * the admin. Use `AdminSwitch` for on/off settings in forms.
 */
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

/** The Radix switch in ink: on is near-black, off is the hairline grey. */
export function AdminSwitch({
	className,
	...props
}: React.ComponentProps<typeof Switch>) {
	return (
		<Switch
			className={cn(
				"h-5 w-[34px] focus-visible:ring-foreground data-[state=checked]:bg-foreground data-[state=unchecked]:bg-border",
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
