import { getBaseUrl } from "@repo/utils";

/** Shared auth also initializes in storefront-only deployments. */
export function getAuthBaseUrl(
	saasUrl?: string,
	marketingUrl?: string,
): string {
	// Trust one explicitly configured origin; never infer it from request headers.
	return getBaseUrl(saasUrl || marketingUrl, 3000);
}
