export interface MarketingConfig {
	/**
	 * Human-readable product name used in site chrome, SEO metadata, and landing
	 * page copy.
	 */
	appName: string;
	/**
	 * Absolute URL for the docs site. When omitted, documentation calls to action
	 * are not rendered.
	 */
	docsUrl?: string;
	/**
	 * Absolute URL for the SaaS application that marketing pages use for sign-in,
	 * dashboard, and conversion links.
	 */
	saasUrl?: string;
}
