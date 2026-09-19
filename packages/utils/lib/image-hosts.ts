/**
 * Hosts `next/image` is allowed to load from. `next/image` *throws* on an
 * unconfigured host, and that throw happens during render — one bad image URL
 * on one product takes down the storefront, the category grids, and the admin
 * catalogue with a 500. So this list is the single source of truth: the Next
 * config builds its `remotePatterns` from it, and the product form validates
 * against it before a bad URL can ever reach the database.
 */
export const ALLOWED_IMAGE_HOSTS = [
	"images.unsplash.com",
	"lh3.googleusercontent.com",
	"avatars.githubusercontent.com",
] as const;

/** True when localhost origins should be treated as valid image sources. */
function allowsLocalhostImages(): boolean {
	return process.env.NODE_ENV !== "production";
}

function hostnameOf(endpoint: string | undefined): string | null {
	if (!endpoint) {
		return null;
	}

	try {
		return new URL(endpoint).hostname;
	} catch {
		return null;
	}
}

/**
 * Origins that serve uploaded product images.
 *
 * Both entries matter and they are frequently different hosts. `S3_ENDPOINT` is
 * the API origin the signed upload is issued against; `NEXT_PUBLIC_STORAGE_URL`
 * is the public origin baked into the stored `fileUrl` (see
 * `create-product-image-upload-url`), which in front of R2 or a CDN is a custom
 * domain that never touches the S3 API host.
 *
 * This previously read a `NEXT_PUBLIC_S3_URL` that is defined nowhere in the
 * repo, so whenever the public origin differed from the API origin, every
 * uploaded image failed validation and was missing from `remotePatterns`.
 */
export function getUploadImageHosts(): string[] {
	const hosts = [
		hostnameOf(process.env.NEXT_PUBLIC_STORAGE_URL),
		hostnameOf(process.env.S3_ENDPOINT),
	].filter((host): host is string => host !== null);

	return [...new Set(hosts)];
}

export function isAllowedImageUrl(value: string): boolean {
	let url: URL;

	try {
		url = new URL(value);
	} catch {
		return false;
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return false;
	}

	// Local dev serves uploads from the MinIO container on localhost. In
	// production a localhost image URL is never legitimate, and accepting one
	// turns the image field into an SSRF primitive: `next/image` fetches the URL
	// server-side, so an admin-supplied `http://127.0.0.1:<port>/...` would have
	// the server read its own loopback services and return the body as an image.
	if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
		return allowsLocalhostImages();
	}

	if (getUploadImageHosts().includes(url.hostname)) {
		return true;
	}

	return (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(url.hostname);
}
