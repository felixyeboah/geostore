import { cn } from "@repo/ui";

interface BrandLogoProps {
	className?: string;
}

/** Landscape lockup of the Geostoresgh logo (mark left, name right). */
export function BrandLogo({ className }: BrandLogoProps) {
	return (
		<span className={cn("inline-flex h-10 items-center", className)}>
			<img
				alt="Geostoresgh"
				className="h-full w-auto object-contain"
				decoding="async"
				src="/images/geostoresgh-logo-landscape.png"
			/>
		</span>
	);
}
