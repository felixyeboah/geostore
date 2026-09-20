import { AnalyticsScript } from "@analytics";
import { CartDrawer } from "@commerce/components/CartDrawer";
import { CartProvider } from "@commerce/components/CartProvider";
import { config } from "@config";
import { cn } from "@repo/ui";
import { Toaster } from "@repo/ui/components/toast";
import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Footer } from "@shared/components/Footer";
import { NavBar } from "@shared/components/NavBar";
import { getBaseUrl } from "@shared/lib/base-url";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_TAGLINE } from "@shared/lib/seo";
import { getStorefrontDeliveryRule } from "@shared/lib/store-settings";
import {
	getStorefrontChrome,
	isDraftPreview,
} from "@shared/lib/storefront-chrome";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";

import "./globals.css";

const sansFont = Figtree({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	// Without this, every relative Open Graph image resolves against
	// localhost and link previews come back blank in production.
	metadataBase: new URL(getBaseUrl()),
	title: {
		absolute: `${config.appName} · ${SITE_TAGLINE}`,
		default: `${config.appName} · ${SITE_TAGLINE}`,
		template: `%s | ${config.appName}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: config.appName,
	referrer: "origin-when-cross-origin",
	formatDetection: { telephone: true, address: false, email: false },
	openGraph: {
		type: "website",
		siteName: config.appName,
		locale: "en_GH",
		url: getBaseUrl(),
		title: `${config.appName} · ${SITE_TAGLINE}`,
		description: SITE_DESCRIPTION,
		images: [{ url: OG_IMAGE, alt: config.appName }],
	},
	twitter: {
		card: "summary_large_image",
		title: `${config.appName} · ${SITE_TAGLINE}`,
		description: SITE_DESCRIPTION,
		images: [OG_IMAGE],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export default async function RootLayout({ children }: PropsWithChildren) {
	const cookieStore = await cookies();
	const consentCookie = cookieStore.get("consent");
	const [chrome, draftPreview, deliveryRule] = await Promise.all([
		getStorefrontChrome(),
		isDraftPreview(),
		getStorefrontDeliveryRule(),
	]);

	return (
		<html lang="en" suppressHydrationWarning className={sansFont.variable}>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				<ConsentProvider
					initialConsent={consentCookie?.value === "true"}
				>
					<ClientProviders>
						<CartProvider deliveryRule={deliveryRule}>
							<NavBar chrome={chrome} />
							<main className="min-h-screen">{children}</main>
							<Footer chrome={chrome} />
							{draftPreview && (
								<p className="fixed bottom-3 left-3 z-[60] rounded-[2px] bg-foreground px-2.5 py-1 font-medium text-[11px] text-background">
									Draft preview — unpublished changes
								</p>
							)}
							<ConsentBanner />
							<CartDrawer />
							<Toaster
								position="bottom-center"
								toastOptions={{
									unstyled: true,
									classNames: { toast: "w-full" },
								}}
							/>
						</CartProvider>
						<AnalyticsScript />
					</ClientProviders>
				</ConsentProvider>
			</body>
		</html>
	);
}
