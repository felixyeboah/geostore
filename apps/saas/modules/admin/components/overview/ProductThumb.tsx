import { productInitials, productTileClass } from "@admin/lib/overview";
import { cn } from "@repo/ui";
import Image from "next/image";

const SIZES = {
	sm: { box: "size-7 rounded-[2px] text-[10px]", px: "28px" },
	md: { box: "size-9 rounded-[2px] text-xs", px: "36px" },
} as const;

export function ProductThumb({
	name,
	imageUrl,
	imageAlt,
	tileKey,
	size = "md",
	className,
}: {
	name: string;
	imageUrl: string | null;
	imageAlt?: string;
	/** Anything stable per product (its id) so the fallback colour never shuffles. */
	tileKey: string;
	size?: keyof typeof SIZES;
	className?: string;
}) {
	const dimensions = SIZES[size];

	if (imageUrl) {
		return (
			<span
				className={cn(
					"relative block shrink-0 overflow-hidden border bg-muted",
					dimensions.box,
					className,
				)}
			>
				<Image
					src={imageUrl}
					alt={imageAlt ?? ""}
					fill
					sizes={dimensions.px}
					className="object-cover"
				/>
			</span>
		);
	}

	return (
		<span
			aria-hidden="true"
			className={cn(
				"grid shrink-0 place-items-center bg-gradient-to-br font-semibold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] [text-shadow:0_1px_1px_rgba(0,0,0,0.18)]",
				productTileClass(tileKey),
				dimensions.box,
				className,
			)}
		>
			{productInitials(name)}
		</span>
	);
}
