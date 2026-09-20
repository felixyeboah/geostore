import type { SaasConfig } from "./types";

export const config = {
	appName: "Geostoresgh",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL as string | undefined,
	enabledThemes: ["light", "dark"],
	defaultTheme: "light",
	useSidebarLayout: true,
	// Only staff can sign in, so the back office is the destination.
	redirectAfterSignIn: "/admin/overview",
	redirectAfterLogout: "/login",
} as const satisfies SaasConfig;
