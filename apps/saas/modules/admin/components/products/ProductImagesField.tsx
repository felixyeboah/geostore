"use client";

import { AdminImageDropzone } from "@admin/components/AdminImageDropzone";
import { AdminTextarea } from "@admin/components/ui";
import { cn } from "@repo/ui";
import { StarIcon, XIcon } from "lucide-react";
import { useId } from "react";

interface ProductImagesFieldProps {
	value: string[];
	onChange: (urls: string[]) => void;
	/**
	 * The first image doubles as the product cover. Option-value galleries
	 * pass `false` — their first shot just leads that value's strip.
	 */
	coverable?: boolean;
}

/**
 * Product photography, dropped rather than pasted.
 *
 * The first image is the one the storefront uses everywhere a product appears
 * as a single picture, so it is labelled and promotable rather than merely
 * being first in a list nobody can see. The URL box stays underneath because
 * the catalogue is seeded from hosted URLs and bulk edits still go through it.
 */
export function ProductImagesField({
	value,
	onChange,
	coverable = true,
}: ProductImagesFieldProps) {
	const urlFieldId = useId();

	function removeAt(index: number) {
		onChange(value.filter((_, itemIndex) => itemIndex !== index));
	}

	function makeCover(index: number) {
		const next = [...value];
		const [promoted] = next.splice(index, 1);
		onChange([promoted, ...next]);
	}

	return (
		<div className="grid gap-4">
			<AdminImageDropzone
				multiple
				onUploaded={(urls) => onChange([...value, ...urls])}
				hint={
					coverable
						? "JPG, PNG or WebP, up to 5 MB each. The first image is the one customers see first."
						: "JPG, PNG or WebP, up to 5 MB each."
				}
			/>

			{value.length > 0 && (
				<ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
					{value.map((url, index) => (
						<li
							key={url}
							className="group relative aspect-square overflow-hidden rounded-[2px] border border-border bg-muted"
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
				</ul>
			)}

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
				<p className="mt-2 text-muted-foreground text-xs">
					Uploaded files appear here too. One complete URL per line,
					in the order customers should see them.
				</p>
			</div>
		</div>
	);
}
