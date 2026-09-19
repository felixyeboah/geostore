import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/** Squared hairline field, matching the storefront's checkout inputs. */
export const AUTH_FIELD =
	"h-12 rounded-[2px] border-border bg-transparent px-3.5 text-[14px] shadow-none placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-0";

export const AUTH_LABEL = "eyebrow text-muted-foreground";

/** The accent button the storefront is built to. */
export const AUTH_BUTTON =
	"h-12 w-full rounded-[2px] px-6 font-semibold text-[14.5px] tracking-[-0.01em]";

/** A quieter hairline button, used for social and passkey sign-in. */
export const AUTH_BUTTON_QUIET =
	"h-12 w-full rounded-[2px] border border-border bg-transparent px-5 font-medium text-[14px] text-foreground transition-colors hover:border-foreground hover:bg-transparent";

interface AuthHeaderProps {
	eyebrow: string;
	title: ReactNode;
	subtitle?: ReactNode;
	className?: string;
}

/** The statement above every auth form: eyebrow, title, one line of context. */
export function AuthHeader({
	eyebrow,
	title,
	subtitle,
	className,
}: AuthHeaderProps) {
	return (
		<div className={cn("mb-9", className)}>
			<p className="eyebrow mb-4 text-muted-foreground">{eyebrow}</p>
			<h1 className="max-w-[16ch] font-semibold text-[clamp(28px,3vw,40px)] text-foreground leading-[1.05] tracking-[-0.042em]">
				{title}
			</h1>
			{subtitle && (
				<p className="mt-4 max-w-[44ch] text-[14.5px] text-muted-foreground leading-[1.6]">
					{subtitle}
				</p>
			)}
		</div>
	);
}

/** A hairline rule with a label, used before the social sign-in options. */
export function AuthDivider({ label }: { label: string }) {
	return (
		<div className="my-8 flex items-center gap-4">
			<span className="h-px flex-1 bg-border" />
			<span className="eyebrow shrink-0 text-muted-foreground">
				{label}
			</span>
			<span className="h-px flex-1 bg-border" />
		</div>
	);
}

/** The footer line that sends people to the other auth route. */
export function AuthFootnote({ children }: PropsWithChildren) {
	return (
		<p className="mt-9 border-border border-t pt-6 text-[13.5px] text-muted-foreground">
			{children}
		</p>
	);
}
