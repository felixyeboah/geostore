import type { AdminNavItem } from "@admin/components/AdminNav";
import { config } from "@repo/auth/config";
import { countOrdersAwaitingDispatch } from "@repo/database";
import { getTranslations } from "@shared/lib/translations";
import {
	Building2Icon,
	ChartNoAxesCombinedIcon,
	LayersIcon,
	LayoutDashboardIcon,
	LayoutTemplateIcon,
	PackageIcon,
	ReceiptTextIcon,
	ShoppingBagIcon,
	TagsIcon,
	UsersIcon,
} from "lucide-react";

/**
 * The back office's sections.
 *
 * Shared because the account settings wear the same chrome. Only staff can
 * sign in at all, so there is no second, customer-shaped navigation: one bar
 * covers everything behind the login.
 */
export async function getAdminNavItems(): Promise<AdminNavItem[]> {
	const t = await getTranslations("admin");
	const ordersAwaitingDispatch = await countOrdersAwaitingDispatch();

	return [
		{
			title: t("menu.overview"),
			href: "/admin/overview",
			icon: <LayoutDashboardIcon />,
		},
		{
			title: t("menu.orders"),
			href: "/admin/orders",
			icon: <ShoppingBagIcon />,
			count: ordersAwaitingDispatch,
		},
		{
			title: t("menu.products"),
			href: "/admin/products",
			icon: <PackageIcon />,
		},
		{
			title: t("menu.categories"),
			href: "/admin/categories",
			icon: <TagsIcon />,
		},
		{
			title: t("menu.collections"),
			href: "/admin/collections",
			icon: <LayersIcon />,
		},
		{
			title: "Landing page",
			href: "/admin/landing",
			icon: <LayoutTemplateIcon />,
		},
		{
			title: t("menu.analytics"),
			href: "/admin/analytics",
			icon: <ChartNoAxesCombinedIcon />,
		},
		{
			title: t("menu.transactions"),
			href: "/admin/transactions",
			icon: <ReceiptTextIcon />,
		},
		{
			title: t("menu.users"),
			href: "/admin/users",
			icon: <UsersIcon />,
		},
		...(config.organizations.enable
			? [
					{
						title: t("menu.organizations"),
						href: "/admin/organizations",
						icon: <Building2Icon />,
					},
				]
			: []),
	];
}
