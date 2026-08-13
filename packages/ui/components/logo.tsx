import { cn } from "../lib";

interface LogoProps {
	className?: string;
	withLabel?: boolean;
}

export function Logo({ className }: LogoProps) {
	return (
		<span className={cn("inline-flex h-10 items-center", className)}>
			<img
				alt="Geostoresgh"
				className="h-full w-auto object-contain"
				decoding="async"
				src="/images/geostoresgh-logo.png"
			/>
		</span>
	);
}
