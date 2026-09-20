/**
 * Returns the base URL for the current app. Pass the env value directly so Next.js
 * can replace it at build time (e.g. process.env.NEXT_PUBLIC_SAAS_URL).
 *
 * @param envValue - The env value to use when defined (e.g. process.env.NEXT_PUBLIC_SAAS_URL)
 * @param defaultPort - Port for localhost fallback when no env is set (default: 3000)
 */
export function getBaseUrl(envValue?: string, defaultPort = 3000): string {
	if (envValue) {
		return envValue;
	}

	// This value becomes Better Auth's `baseURL` and `trustedOrigins`, the Hono
	// CORS origin, and the host in every order-confirmation email. Silently
	// degrading to localhost in production loosens the origin allowlist instead
	// of failing, so it fails.
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"A public base URL is required in production. Set NEXT_PUBLIC_SAAS_URL (and NEXT_PUBLIC_MARKETING_URL / NEXT_PUBLIC_DOCS_URL as appropriate).",
		);
	}

	return `http://localhost:${process.env.PORT ?? defaultPort}`;
}
