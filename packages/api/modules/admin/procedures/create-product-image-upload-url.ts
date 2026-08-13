import { randomUUID } from "node:crypto";
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
		if (!storageUrl) {
			throw new Error("Public storage URL is not configured.");
		}

		return {
			signedUploadUrl,
			fileUrl: `${storageUrl.replace(/\/$/, "")}/products/${path}`,
		};
	});
