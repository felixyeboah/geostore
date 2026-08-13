import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		products: process.env.NEXT_PUBLIC_PRODUCTS_BUCKET_NAME ?? "products",
	},
} as const satisfies StorageConfig;
