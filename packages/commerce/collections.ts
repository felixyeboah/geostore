import type { StoreCollection } from "./types";

/**
 * Smart collections are not rows. They are rules applied to the whole
 * catalogue at read time, so nobody has to remember to add a product to
 * "New in" or take one out of "Best sellers".
 *
 * Manual collections live in the database, because they are editorial
 * judgement rather than a rule.
 */
export const SMART_COLLECTIONS: StoreCollection[] = [
	{
		name: "Best sellers",
		slug: "best-sellers",
		description:
			"Ranked by units actually paid for, not by what we would like to move.",
		onLanding: false,
		kind: "smart",
		rule: "best-selling",
		limit: 12,
	},
	{
		name: "New in",
		slug: "new-in",
		description: "The most recent additions to the shop floor.",
		onLanding: false,
		kind: "smart",
		rule: "newest",
		limit: 12,
	},
];

export function getSmartCollection(slug: string): StoreCollection | undefined {
	return SMART_COLLECTIONS.find((collection) => collection.slug === slug);
}
