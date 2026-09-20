"use client";

import { AdminTextarea } from "@admin/components/ui";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { ImagePlusIcon, LoaderCircleIcon, StarIcon, XIcon } from "lucide-react";
import { type HTMLAttributes, useId, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPTED = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
} as const;

const MAX_BYTES = 5 * 1024 * 1024;

type UploadableType = "image/jpeg" | "image/png" | "image/webp";

interface ProductImagesFieldProps {
	value: string[];
	onChange: (urls: string[]) => void;
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
}: ProductImagesFieldProps) {
	const urlFieldId = useId();
	const [isUploading, setIsUploading] = useState(false);
	const uploadUrlMutation = useMutation(
		orpc.admin.products.imageUploadUrl.mutationOptions(),
	);

	async function upload(files: File[]) {
		if (!files.length) {
			return;
		}

		setIsUploading(true);
		try {
			const uploaded: string[] = [];
			for (const file of files) {
				const target = await uploadUrlMutation.mutateAsync({
					contentType: file.type as UploadableType,
				});
				const response = await fetch(target.signedUploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				if (!response.ok) {
					throw new Error("The image upload failed.");
				}
				uploaded.push(target.fileUrl);
			}

			onChange([...value, ...uploaded]);
			toastSuccess(
				`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`,
			);
		} catch (error) {
			toastError(
				"Image upload failed",
				error instanceof Error ? error.message : undefined,
			);
		} finally {
			setIsUploading(false);
		}
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: ACCEPTED,
		maxSize: MAX_BYTES,
		multiple: true,
		disabled: isUploading,
		onDrop: (accepted, rejected) => {
			if (rejected.length) {
				// One message covers the batch: listing every file turns a
				// mis-drop of twenty photos into twenty toasts.
				const tooLarge = rejected.some((item) =>
					item.errors.some(
						(error) => error.code === "file-too-large",
					),
				);
				toastError(
					`${rejected.length} file${rejected.length === 1 ? "" : "s"} skipped`,
					tooLarge
						? "Each image must be 5 MB or smaller."
						: "Use JPG, PNG, or WebP images.",
				);
			}
			void upload(accepted);
		},
	});

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
			<div
				{...(getRootProps() as HTMLAttributes<HTMLDivElement>)}
				className={cn(
					"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[2px] border border-border border-dashed px-4 py-9 text-center transition-colors",
					isDragActive
						? "border-[var(--ed-accent)] bg-muted"
						: "hover:border-foreground",
					isUploading && "cursor-wait opacity-70",
				)}
			>
				<input
					{...getInputProps()}
					aria-label="Upload product images"
				/>
				{isUploading ? (
					<LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
				) : (
					<ImagePlusIcon className="size-5 text-muted-foreground" />
				)}
				<span className="font-medium text-[13.5px] text-foreground">
					{isUploading
						? "Uploading…"
						: isDragActive
							? "Drop to upload"
							: "Drag images here, or click to choose"}
				</span>
				<span className="text-[12px] text-muted-foreground">
					JPG, PNG or WebP, up to 5 MB each. The first image is the
					one customers see first.
				</span>
			</div>

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
							{index === 0 && (
								<span className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5 font-medium text-[10px] text-background uppercase tracking-[0.08em]">
									Cover
								</span>
							)}
							<div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
								{index > 0 && (
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
