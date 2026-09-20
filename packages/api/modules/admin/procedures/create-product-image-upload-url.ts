import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

const imageTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const createProductImageUploadUrl = adminProcedure
	.route({
		method: "POST",
		path: "/admin/products/image-upload-url",
		tags: ["Administration", "Products"],
		summary: "Create a product image upload URL",
	})
	.input(z.object({ contentType: imageTypeSchema }))
	.handler(async ({ input, context: { user } }) => {
		const extension = {
			"image/jpeg": "jpg",
			"image/png": "png",
			"image/webp": "webp",
		}[input.contentType];
		const path = `${user.id}/${randomUUID()}.${extension}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "products",
			contentType: input.contentType,
		});
		const storageUrl =
			process.env.NEXT_PUBLIC_STORAGE_URL ?? process.env.S3_ENDPOINT;

		/*
		 * A plain `throw` here reaches the browser as an unexplained 500,
		 * because oRPC deliberately does not leak a handler's message. An
		 * admin dropping a photo onto an environment with no object store
		 * configured deserves to be told that, and told what to do instead —
		 * every image field also accepts a URL.
		 */
		if (!storageUrl || !process.env.S3_ENDPOINT) {
			throw new ORPCError("SERVICE_UNAVAILABLE", {
				message:
					"Image uploads are not configured on this deployment. Paste an image URL instead, or set the S3/R2 credentials.",
			});
		}

		return {
			signedUploadUrl,
			fileUrl: `${storageUrl.replace(/\/$/, "")}/products/${path}`,
		};
	});
