import type { MarketingConfig } from "./types";

export const config = {
	appName: "Geostoresgh",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	saasUrl: process.env.NEXT_PUBLIC_SAAS_URL as string | undefined,
} as const satisfies MarketingConfig;
