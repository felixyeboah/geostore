interface ProductImageStorage {
	publicBucketUrl?: string;
	publicStorageUrl?: string;
	endpoint?: string;
	bucketName?: string;
}

/** R2 public domains point at a bucket root; S3/MinIO origins include its name. */
export function productImageUrl(
	path: string,
	storage: ProductImageStorage,
): string {
	const bucketUrl = storage.publicBucketUrl;
	const origin = storage.publicStorageUrl ?? storage.endpoint;
	if (
		!bucketUrl &&
		(!origin || origin.includes(".r2.cloudflarestorage.com"))
	) {
		throw new Error("A public product image URL is required");
	}
	const base =
		bucketUrl ??
		`${origin?.replace(/\/$/, "")}/${storage.bucketName ?? "products"}`;
	const url = new URL(base);
	if (
		!["https:", "http:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	) {
		throw new Error("Invalid public product image URL");
	}
	return `${url.href.replace(/\/$/, "")}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
