import { AdminHeader, AdminSection } from "@admin/components/AdminPage";
import { StoreSettingsForm } from "@admin/components/settings/StoreSettingsForm";
import { resolveStorefrontChrome } from "@repo/commerce";
import { getStorefrontSettings, getStoreSettings } from "@repo/database";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

/**
 * The numbers the shop runs on.
 *
 * Deliberately short. Most of what an admin can change already has a better
 * home — words belong under Storefront, stock on a product, staff under
 * Users — so this screen is only for the store-wide figures that had no home
 * at all and were sitting in source code, the delivery fee among them.
 */
export default async function AdminSettingsPage() {
	const [settings, chromeOverrides] = await Promise.all([
		getStoreSettings(),
		getStorefrontSettings(),
	]);
	const chrome = resolveStorefrontChrome(chromeOverrides);

	return (
		<div className="pt-10 pb-16">
			<AdminHeader
				eyebrow="Settings"
				title="How the shop runs"
				description="The store-wide numbers. Delivery pricing applies to every new order from the moment it is saved, so change it when you mean to."
			/>

			<div className="mt-10">
				<StoreSettingsForm
					settings={settings}
					fallbackWhatsappNumber={chrome.whatsapp}
				/>
			</div>

			<AdminSection
				title="Changed somewhere else"
				description="The rest of what this shop can be told to do lives closer to the thing it affects."
				className="mt-14"
			>
				<ul className="divide-y divide-border border-border border-t">
					<ElsewhereRow
						href="/admin/landing"
						title="Storefront"
						description="Everything the shop says: the announcement strip, the home page sections, the footer."
					/>
					<ElsewhereRow
						href="/admin/products"
						title="Products"
						description="Prices, stock counts and the low-stock level, one product at a time."
					/>
					<ElsewhereRow
						href="/admin/categories"
						title="Departments"
						description="What the shop menu offers and the order it offers it in."
					/>
					<ElsewhereRow
						href="/admin/users"
						title="Users"
						description="Who can sign in here, and what they are allowed to do."
					/>
				</ul>
			</AdminSection>
		</div>
	);
}

function ElsewhereRow({
	href,
	title,
	description,
}: {
	href: string;
	title: string;
	description: string;
}) {
	return (
		<li>
			<Link
				href={href}
				className="group grid gap-x-8 gap-y-1 py-4 transition-colors md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline"
			>
				<span className="font-medium text-[14px] text-foreground group-hover:text-[var(--ed-accent)]">
					{title}
				</span>
				<span className="max-w-[62ch] text-[13px] text-muted-foreground leading-[1.6]">
					{description}
				</span>
			</Link>
		</li>
	);
}
