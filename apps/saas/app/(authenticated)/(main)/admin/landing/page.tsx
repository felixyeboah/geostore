import { AdminHeader } from "@admin/components/AdminPage";
import {
	LandingSectionManager,
	type LandingSectionState,
} from "@admin/components/landing/LandingSectionManager";
import { adminButtonClass } from "@admin/components/ui";
import { LANDING_SECTIONS, parseLandingSettings } from "@repo/commerce";
import { ensureLandingSections } from "@repo/database";
import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Landing page",
};

const storefrontUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "";

export default async function AdminLandingPage() {
	// A section shipped since the last visit has no row yet, so it is created
	// here rather than in a migration. That keeps deploying a new section to
	// one file change.
	const rows = await ensureLandingSections(
		LANDING_SECTIONS.map((section) => ({
			key: section.key,
			defaultSortOrder: section.defaultSortOrder,
		})),
	);

	const byKey = new Map(rows.map((row) => [row.key, row]));

	const initial: LandingSectionState[] = [...LANDING_SECTIONS]
		.sort((left, right) => {
			const leftOrder =
				byKey.get(left.key)?.sortOrder ?? left.defaultSortOrder;
			const rightOrder =
				byKey.get(right.key)?.sortOrder ?? right.defaultSortOrder;
			return leftOrder - rightOrder;
		})
		.map((section) => {
			const row = byKey.get(section.key);
			return {
				key: section.key,
				isVisible: row?.isVisible ?? true,
				copy: parseLandingSettings(row?.settings),
			};
		});

	return (
		<div>
			<AdminHeader
				eyebrow="Storefront"
				title="Landing page"
				description="Every band of the shop’s front page, in the order a customer meets them, beside the page itself. Change the wording, move a band, or hide one — the preview updates as you go."
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
					initial={initial}
					storefrontUrl={storefrontUrl}
				/>
			</div>
		</div>
	);
}
