import { config } from "@config";
import { getBaseUrl } from "@shared/lib/base-url";
import type { Metadata } from "next";

/**
 * One place for what every page says about itself.
 *
 * Search engines and link previews read the same handful of fields, and the
 * quickest way to get them wrong is to write them out per page. These
 * defaults live in the root layout; a page overrides only what is genuinely
 * different about it.
 */

export const SITE_NAME = config.appName;

export const SITE_DESCRIPTION =
	"Phones, laptops, audio, TVs and home appliances, held in real stock in Accra. Pay with mobile money, card or cash on delivery, with delivery across Ghana.";

/** Written out rather than derived, so the tagline reads as a sentence. */
export const SITE_TAGLINE = "Electronics and appliances, delivered in Ghana";

export const OG_IMAGE = "/images/geostoresgh-logo-landscape.png";

export function siteUrl(path = "/"): string {
	return new URL(path, getBaseUrl()).href;
}

/**
 * Canonical URL for a page.
 *
 * Only the path is ever canonicalised. A filtered catalogue URL such as
 * `/shop?brand=Apple` is the same page as `/shop` as far as a search engine
 * should be concerned, so pointing every variant at the clean path is what
 * stops the catalogue competing with itself for the same terms.
 */
export function canonical(path: string): Metadata["alternates"] {
	return { canonical: siteUrl(path) };
}

interface PageMetaInput {
	title: string;
	description: string;
	path: string;
	/** Absolute URL or a path under /public. */
	image?: string;
	type?: "website" | "article";
	/** Keeps a thin or duplicated page out of the index. */
	noIndex?: boolean;
}

/** Everything a page needs to describe itself, from four or five fields. */
export function pageMetadata({
	title,
	description,
	path,
	image = OG_IMAGE,
	type = "website",
	noIndex = false,
}: PageMetaInput): Metadata {
	const url = siteUrl(path);
	const imageUrl = image.startsWith("http") ? image : siteUrl(image);

	return {
		title,
		description,
		alternates: { canonical: url },
		robots: noIndex ? { index: false, follow: true } : undefined,
		openGraph: {
			type,
			url,
			title,
			description,
			siteName: SITE_NAME,
			locale: "en_GH",
			images: [{ url: imageUrl, alt: title }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [imageUrl],
		},
	};
}
