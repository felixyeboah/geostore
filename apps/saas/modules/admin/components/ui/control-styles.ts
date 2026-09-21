/**
 * The shared chrome for admin text controls. `AdminCombobox` needs the same
 * classes as `AdminInput`, and importing it from `./index` would make the two
 * files import each other.
 */
export type ControlSize = "sm" | "md" | "lg";

export const CONTROL_BASE =
	"w-full rounded-[2px] border border-border bg-transparent text-foreground shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

export const CONTROL_SIZES: Record<ControlSize, string> = {
	sm: "h-9 px-2.5 text-[12.5px]",
	md: "h-11 px-3.5 text-[14px]",
	lg: "h-12 px-3.5 text-[15px]",
};
