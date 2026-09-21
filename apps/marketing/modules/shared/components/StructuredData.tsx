import { PHONE_NUMBER } from "@commerce/lib/store-links";
import { config } from "@config";
import type { StoreProduct } from "@repo/commerce";
import { conditionLabel } from "@repo/commerce";
import { OG_IMAGE, SITE_DESCRIPTION, siteUrl } from "@shared/lib/seo";

/**
 * Schema.org data, as JSON-LD.
 *
 * This is what lets a search engine show a price, a stock state and a star
 * rating beside a result instead of a bare blue link. The markup on the page
 * cannot express any of that, so for a shop it is the difference between
 * being listed and being shopped.
 */
export function StructuredData({ data }: { data: object | object[] }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has
			// no other insertion point, and every value here is our own data.
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}

/** The shop itself: used once, on the landing page. */
export function organisationSchema(overrides?: { telephone?: string }) {
	return {
		"@context": "https://schema.org",
		"@type": "OnlineStore",
		name: config.appName,
		url: siteUrl("/"),
		logo: siteUrl(OG_IMAGE),
		image: siteUrl(OG_IMAGE),
		description: SITE_DESCRIPTION,
		telephone: overrides?.telephone ?? PHONE_NUMBER,
		areaServed: { "@type": "Country", name: "Ghana" },
		address: {
			"@type": "PostalAddress",
			addressLocality: "Accra",
			addressCountry: "GH",
		},
		currenciesAccepted: "GHS",
		paymentAccepted: "Mobile money, Card, Cash on delivery",
	};
}

/** Lets a search engine offer a search box straight into the catalogue. */
export function websiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: config.appName,
		url: siteUrl("/"),
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: siteUrl("/shop?q={search_term_string}"),
			},
			"query-input": "required name=search_term_string",
		},
	};
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: trail.map((step, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: step.name,
			item: siteUrl(step.path),
		})),
	};
}

/**
 * A product, with its offer.
 *
 * `availability` and `price` are the two fields a result actually shows, so
 * they are derived from live stock rather than hard-coded. A product with no
 * reviews omits `aggregateRating` entirely: sending a rating of zero is worse
 * than sending none, because it renders as zero stars.
 */
export function productSchema(product: StoreProduct) {
	const price = (product.priceInPesewas / 100).toFixed(2);
	const url = siteUrl(`/products/${product.slug}`);

	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		description: product.shortDescription || product.description,
		sku: product.sku,
		image: product.images.length > 0 ? product.images : [product.imageUrl],
		brand: { "@type": "Brand", name: product.brand },
		offers: {
			"@type": "Offer",
			url,
			priceCurrency: "GHS",
			price,
			availability:
				product.stockQuantity > 0
					? "https://schema.org/InStock"
					: "https://schema.org/OutOfStock",
			itemCondition: `https://schema.org/${conditionLabel(product.condition)}Condition`,
			seller: { "@type": "Organization", name: config.appName },
		},
		...(product.reviewCount > 0 && product.rating > 0
			? {
					aggregateRating: {
						"@type": "AggregateRating",
						ratingValue: product.rating,
						reviewCount: product.reviewCount,
					},
				}
			: {}),
	};
}

/** A department or filtered catalogue, as an ordered list of products. */
export function itemListSchema(
	products: StoreProduct[],
	{ name, path }: { name: string; path: string },
) {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name,
		url: siteUrl(path),
		numberOfItems: products.length,
		itemListElement: products.slice(0, 30).map((product, index) => ({
			"@type": "ListItem",
			position: index + 1,
			url: siteUrl(`/products/${product.slug}`),
			name: product.name,
		})),
	};
}
