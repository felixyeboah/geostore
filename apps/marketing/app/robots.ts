import { siteUrl } from "@shared/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			/*
			 * None of these belong in an index. The cart and checkout are
			 * per-visitor and change under the crawler's feet, the API routes
			 * return JSON, and the order confirmation is reachable only with
			 * a token that should never be shared.
			 */
			disallow: ["/api/", "/cart", "/checkout", "/checkout/", "/orders/"],
		},
		sitemap: siteUrl("/sitemap.xml"),
		host: siteUrl("/").replace(/\/$/, ""),
	};
}
