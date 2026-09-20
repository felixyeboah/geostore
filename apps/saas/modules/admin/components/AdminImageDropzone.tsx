"use client";

import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { ImagePlusIcon, LoaderCircleIcon } from "lucide-react";
import { type HTMLAttributes, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPTED = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
} as const;

const MAX_BYTES = 5 * 1024 * 1024;

type UploadableType = "image/jpeg" | "image/png" | "image/webp";

/**
 * The admin's image drop target.
 *
 * One component for every image the back office accepts, so the accepted
 * types, the size cap and the way a rejection is reported cannot drift between
 * product photography and a department banner.
 *
 * Uploads go through the products bucket: it is the admin-only image store,
 * and a department banner is the same kind of asset under the same access
 * rules.
 */
export function AdminImageDropzone({
	multiple = false,
	onUploaded,
	title,
	hint,
	className,
}: {
	multiple?: boolean;
	onUploaded: (urls: string[]) => void;
	title?: string;
	hint?: string;
	className?: string;
}) {
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

			onUploaded(uploaded);
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
		multiple,
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

	return (
		<div
			{...(getRootProps() as HTMLAttributes<HTMLDivElement>)}
			className={cn(
				"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[2px] border border-border border-dashed px-4 py-9 text-center transition-colors",
				isDragActive
					? "border-[var(--ed-accent)] bg-muted"
					: "hover:border-foreground",
				isUploading && "cursor-wait opacity-70",
				className,
			)}
		>
			<input
				{...getInputProps()}
				aria-label={multiple ? "Upload images" : "Upload an image"}
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
						: (title ??
							(multiple
								? "Drag images here, or click to choose"
								: "Drag an image here, or click to choose"))}
			</span>
			<span className="text-[12px] text-muted-foreground">
				{hint ?? "JPG, PNG or WebP, up to 5 MB each."}
			</span>
		</div>
	);
}
