import { AdminHeader } from "@admin/components/AdminPage";
import {
	LandingSectionManager,
	type LandingSectionState,
} from "@admin/components/landing/LandingSectionManager";
import { adminButtonClass } from "@admin/components/ui";
import {
	LANDING_SECTIONS,
	parseIdList,
	parseLandingSettings,
	resolveStorefrontChrome,
} from "@repo/commerce";
import {
	ensureLandingSections,
	getLatestLandingPublish,
	getPublishedStoreProductsByIds,
	getStoreBrands,
	getStorefrontDraftSettings,
	getStorefrontSettings,
} from "@repo/database";
import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Landing page",
};

const storefrontUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "";
// The preview is gated by the same shared secret the storefront's revalidate
// endpoint uses; without it the frame falls back to the published page.
const previewSecret = process.env.STOREFRONT_REVALIDATE_SECRET ?? "";
const previewUrl =
	storefrontUrl && previewSecret
		? `${storefrontUrl}/?preview=draft&key=${encodeURIComponent(previewSecret)}`
		: storefrontUrl;

/**
 * Product ids a band's copy points at, whether a single reference or a list.
 * Compared against what the storefront can actually resolve, the leftovers
 * are the dangling references the admin should be warned about.
 */
function referencedProductIds(
	sections: Array<{ copy: Record<string, string>; key: string }>,
): Map<string, string[]> {
	const bySection = new Map<string, string[]>();

	for (const section of sections) {
		const definition = LANDING_SECTIONS.find(
			(entry) => entry.key === section.key,
		);
		if (!definition) {
			continue;
		}

		const ids: string[] = [];
		for (const field of definition.fields) {
			const value = section.copy[field.key];
			if (!value) {
				continue;
			}
			if (field.type === "product") {
				ids.push(value.trim());
			}
			if (field.type === "products") {
				ids.push(...parseIdList(value));
			}
		}
		if (ids.length > 0) {
			bySection.set(section.key, ids);
		}
	}

	return bySection;
}

export default async function AdminLandingPage() {
	// A section shipped since the last visit has no row yet, so it is created
	// here rather than in a migration. That keeps deploying a new section to
	// one file change.
	const [rows, brands, liveChrome, draftChrome, lastPublish] =
		await Promise.all([
			ensureLandingSections(
				LANDING_SECTIONS.map((section) => ({
					key: section.key,
					defaultSortOrder: section.defaultSortOrder,
				})),
			),
			// The brand line offers what the shop actually carries.
			getStoreBrands(),
			getStorefrontSettings(),
			getStorefrontDraftSettings(),
			getLatestLandingPublish(),
		]);

	const byKey = new Map(rows.map((row) => [row.key, row]));

	const toState = (
		section: (typeof LANDING_SECTIONS)[number],
		source: "published" | "draft",
	): LandingSectionState => {
		const row = byKey.get(section.key);
		return {
			key: section.key,
			isVisible:
				source === "draft"
					? (row?.draftIsVisible ?? row?.isVisible ?? true)
					: (row?.isVisible ?? true),
			copy: parseLandingSettings(
				source === "draft"
					? (row?.draftSettings ?? row?.settings)
					: row?.settings,
			),
		};
	};

	const orderFor = (
		section: (typeof LANDING_SECTIONS)[number],
		source: "published" | "draft",
	) => {
		const row = byKey.get(section.key);
		return source === "draft"
			? (row?.draftSortOrder ??
					row?.sortOrder ??
					section.defaultSortOrder)
			: (row?.sortOrder ?? section.defaultSortOrder);
	};

	const published: LandingSectionState[] = [...LANDING_SECTIONS]
		.sort(
			(left, right) =>
				orderFor(left, "published") - orderFor(right, "published"),
		)
		.map((section) => toState(section, "published"));

	const draft: LandingSectionState[] = [...LANDING_SECTIONS]
		.sort(
			(left, right) => orderFor(left, "draft") - orderFor(right, "draft"),
		)
		.map((section) => toState(section, "draft"));

	// References that no longer resolve — withdrawn or deleted products — are
	// flagged rather than silently falling back, so the admin can fix them.
	const referenced = referencedProductIds([
		...draft.map((entry) => ({
			key: entry.key,
			copy: entry.copy,
		})),
		...published.map((entry) => ({
			key: entry.key,
			copy: entry.copy,
		})),
	]);
	const allIds = [...new Set([...referenced.values()].flat())];
	const resolvable = new Set(
		(await getPublishedStoreProductsByIds(allIds)).map(
			(product) => product.id,
		),
	);
	const dangling: Record<string, number> = {};
	for (const [key, ids] of referenced) {
		const missing = ids.filter((id) => !resolvable.has(id));
		if (missing.length > 0) {
			dangling[key] = missing.length;
		}
	}

	return (
		<div>
			<AdminHeader
				eyebrow="Storefront"
				title="Landing page"
				description="Every band of the shop’s front page, in the order a customer meets them, beside the page itself. Changes stage as a draft — nothing reaches shoppers until you publish."
				actions={
					storefrontUrl ? (
						<a
							href={storefrontUrl}
							target="_blank"
							rel="noreferrer"
							className={adminButtonClass("quiet")}
						>
							View the page
							<ArrowUpRightIcon className="size-3.5" />
						</a>
					) : null
				}
			/>

			<div className="mt-9">
				<LandingSectionManager
					definitions={LANDING_SECTIONS}
					initial={draft}
					published={published}
					dangling={dangling}
					chromeLive={resolveStorefrontChrome(liveChrome)}
					chromeDraft={resolveStorefrontChrome(draftChrome)}
					lastPublish={
						lastPublish
							? {
									userName: lastPublish.userName,
									publishedAt:
										lastPublish.publishedAt.toISOString(),
									sections: lastPublish.sections,
								}
							: null
					}
					storefrontUrl={storefrontUrl}
					previewUrl={previewUrl}
					previewIsDraft={Boolean(storefrontUrl && previewSecret)}
					brands={brands}
				/>
			</div>
		</div>
	);
}
