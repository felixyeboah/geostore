import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { getSignedUploadUrl, productImageUrl } from "@repo/storage";
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
		let fileUrl: string;
		try {
			fileUrl = productImageUrl(path, {
				publicBucketUrl: process.env.NEXT_PUBLIC_PRODUCTS_STORAGE_URL,
				publicStorageUrl: process.env.NEXT_PUBLIC_STORAGE_URL,
				endpoint: process.env.S3_ENDPOINT,
				bucketName: process.env.NEXT_PUBLIC_PRODUCTS_BUCKET_NAME,
			});
			if (
				!process.env.S3_ENDPOINT ||
				!process.env.S3_ACCESS_KEY_ID ||
				!process.env.S3_SECRET_ACCESS_KEY
			) {
				throw new Error("Missing storage credentials");
			}
		} catch {
			throw new ORPCError("SERVICE_UNAVAILABLE", {
				message:
					"Image uploads are not configured on this deployment. Configure storage credentials and a public product image URL.",
			});
		}
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "products",
			contentType: input.contentType,
		});

		return {
			signedUploadUrl,
			fileUrl,
		};
	});
