import { adminButtonClass } from "@admin/components/ui";
import { ErrorScreen } from "@shared/components/ErrorScreen";
import { storefront } from "@shared/lib/storefront";

/**
 * The catch-all for addresses nothing claims. This host is the back office,
 * so whoever lands here is usually a shopper with a mistyped storefront link —
 * the way out points at the shop, not deeper into the admin.
 */
export default function NotFoundPage() {
	return (
		<ErrorScreen
			homeHref={storefront.shop}
			eyebrow="404 · Page not found"
			title="We couldn't find that page."
			description="The product or page may have moved, been archived, or never existed."
			actions={
				<a
					href={storefront.shop}
					className={adminButtonClass("primary")}
				>
					Browse the store
				</a>
			}
		/>
	);
}
