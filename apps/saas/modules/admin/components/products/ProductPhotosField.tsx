"use client";

import { AdminImageDropzone } from "@admin/components/AdminImageDropzone";
import { AdminTextarea } from "@admin/components/ui";
import { cn } from "@repo/ui";
import { StarIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

interface ProductPhotosFieldProps {
	value: string[];
	onChange: (urls: string[]) => void;
	/**
	 * The first image doubles as the product cover. Colour galleries pass
	 * `false` — their first shot just leads that colour's strip.
	 */
	coverable?: boolean;
	/** Small tiles in a wrapping row, for the per-colour strips. */
	compact?: boolean;
	/** What the dropzone says when empty. */
	dropLabel?: string;
	className?: string;
}

/**
 * Product photography, dropped rather than pasted.
 *
 * The photos are the grid itself — each one a tile with its own remove and
 * make-cover actions — and the dropzone is the last tile in the row, so
 * adding a fourth photo happens where the fourth photo will appear. Pasting
 * URLs is still possible (the catalogue is seeded from hosted images and bulk
 * edits go through it) but lives behind a link, because it is the exception.
 */
export function ProductPhotosField({
	value,
	onChange,
	coverable = true,
	compact = false,
	dropLabel,
	className,
}: ProductPhotosFieldProps) {
	const urlFieldId = useId();
	const [showUrls, setShowUrls] = useState(false);

	function removeAt(index: number) {
		onChange(value.filter((_, itemIndex) => itemIndex !== index));
	}

	function makeCover(index: number) {
		const next = [...value];
		const [promoted] = next.splice(index, 1);
		onChange([promoted, ...next]);
	}

	return (
		<div className={cn("grid gap-3", className)}>
			<ul
				className={cn(
					compact
						? "flex flex-wrap gap-2"
						: "grid grid-cols-3 gap-2.5 sm:grid-cols-5",
				)}
			>
				{value.map((url, index) => (
					<li
						key={url}
						className={cn(
							"group relative overflow-hidden rounded-[2px] border border-border bg-muted",
							compact ? "size-16" : "aspect-square",
						)}
					>
						{/*
						 * A plain <img>: a pasted URL has not been checked
						 * against the allowed hosts yet, and next/image
						 * throws while rendering an unconfigured one.
						 */}
						<img
							src={url}
							alt=""
							className="size-full object-cover"
						/>
						{coverable && index === 0 && (
							<span className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5 font-medium text-[10px] text-background uppercase tracking-[0.08em]">
								Cover
							</span>
						)}
						<div
							className={cn(
								"absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5",
								"opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100",
							)}
						>
							{coverable && index > 0 && (
								<button
									type="button"
									onClick={() => makeCover(index)}
									aria-label={`Make image ${index + 1} the cover`}
									title="Make cover"
									className="inline-flex size-6 items-center justify-center rounded-[2px] bg-white/90 text-foreground hover:bg-white"
								>
									<StarIcon className="size-3.5" />
								</button>
							)}
							<button
								type="button"
								onClick={() => removeAt(index)}
								aria-label={`Remove image ${index + 1}`}
								title="Remove"
								className="inline-flex size-6 items-center justify-center rounded-[2px] bg-white/90 text-destructive hover:bg-white"
							>
								<XIcon className="size-3.5" />
							</button>
						</div>
					</li>
				))}
				<li className={compact ? "h-16" : "aspect-square"}>
					<AdminImageDropzone
						multiple
						onUploaded={(urls) => onChange([...value, ...urls])}
						title={
							dropLabel ??
							(value.length ? "Add more" : "Add photos")
						}
						hint=""
						className={cn(
							"h-full gap-1 px-2 py-2",
							compact
								? "min-w-24 [&>span:last-child]:hidden [&>span]:text-[12px]"
								: "[&>span:last-child]:hidden [&>span]:text-[12.5px]",
						)}
					/>
				</li>
			</ul>

			<div className="text-[12px] text-muted-foreground">
				{!compact && (
					<>
						JPG, PNG or WebP up to 5 MB each.
						{coverable &&
							" The first photo is the cover — hover one to make it the cover or remove it."}{" "}
					</>
				)}
				<button
					type="button"
					onClick={() => setShowUrls((open) => !open)}
					className="underline underline-offset-[3px] hover:text-foreground"
				>
					{showUrls ? "Hide image URLs" : "Paste image URLs instead"}
				</button>
			</div>

			{showUrls && (
				<div>
					<label
						htmlFor={urlFieldId}
						className="eyebrow text-muted-foreground"
					>
						Product image URLs
					</label>
					<AdminTextarea
						id={urlFieldId}
						rows={3}
						className="mt-2"
						value={value.join("\n")}
						onChange={(event) =>
							onChange(
								event.target.value
									.split("\n")
									.map((line) => line.trim())
									.filter(Boolean),
							)
						}
						placeholder="https://...&#10;https://..."
					/>
					<p className="mt-2 text-[12px] text-muted-foreground">
						One complete URL per line, in the order customers should
						see them. Uploaded files appear here too.
					</p>
				</div>
			)}
		</div>
	);
}
