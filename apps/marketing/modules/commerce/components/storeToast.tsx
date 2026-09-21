"use client";

import Image from "next/image";
import { toast as sonnerToast } from "sonner";

interface StoreToastOptions {
	title: string;
	/** Second line: usually the product name. */
	description?: string;
	imageUrl?: string;
	action?: { label: string; onClick: () => void };
	error?: boolean;
}

/**
 * The bag toast from design/landing-v5/02-editorial.html: an ink slab pinned
 * bottom-centre with the product thumbnail, what happened, and one action.
 * Sonner handles stacking, timing and dismissal; the markup is ours.
 */
export function storeToast({
	title,
	description,
	imageUrl,
	action,
	error,
}: StoreToastOptions) {
	return sonnerToast.custom(
		(id) => (
			<div
				className={`flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.45)] ${
					error
						? "bg-destructive text-destructive-foreground"
						: "bg-[#111110] text-[#fbf8f7]"
				}`}
			>
				{imageUrl && (
					<Image
						src={imageUrl}
						alt=""
						width={40}
						height={40}
						className="size-10 shrink-0 rounded-[2px] bg-white object-contain"
					/>
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold text-[13.5px]">
						{title}
					</p>
					{description && (
						<p className="truncate text-[12.5px] opacity-70">
							{description}
						</p>
					)}
				</div>
				{action && (
					<button
						type="button"
						onClick={() => {
							action.onClick();
							sonnerToast.dismiss(id);
						}}
						className="shrink-0 rounded-[2px] bg-white/[0.12] px-2.5 py-1.5 font-semibold text-[13px] transition-colors hover:bg-white/20"
					>
						{action.label}
					</button>
				)}
			</div>
		),
		{ duration: 3200 },
	);
}
