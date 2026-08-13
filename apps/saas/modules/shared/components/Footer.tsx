import { cn } from "@repo/ui";

export function Footer() {
	return (
		<footer
			className={cn(
				"container max-w-6xl py-6 text-center text-foreground/60 text-xs",
			)}
		>
			<span>
				© {new Date().getFullYear()} Geostoresgh. gadgets &amp; more
			</span>
		</footer>
	);
}
