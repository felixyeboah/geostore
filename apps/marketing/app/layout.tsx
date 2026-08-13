import { AnalyticsScript } from "@analytics";
import { config } from "@config";
import { cn } from "@repo/ui";
import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Footer } from "@shared/components/Footer";
import { NavBar } from "@shared/components/NavBar";
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
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
};

export default async function RootLayout({ children }: PropsWithChildren) {
	const cookieStore = await cookies();
	const consentCookie = cookieStore.get("consent");

	return (
		<html lang="en" suppressHydrationWarning className={sansFont.variable}>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				<ConsentProvider initialConsent={consentCookie?.value === "true"}>
					<ClientProviders>
						<NavBar />
						<main className="min-h-screen">{children}</main>
						<Footer />
						<ConsentBanner />
						<AnalyticsScript />
					</ClientProviders>
				</ConsentProvider>
			</body>
		</html>
	);
}
