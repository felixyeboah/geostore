import { AdminContainer, AdminShell } from "@admin/components/AdminPage";
import { AdminTopBar } from "@admin/components/AdminTopBar";
import { getSession } from "@auth/lib/server";
import { config } from "@repo/auth/config";
import { countOrdersAwaitingDispatch } from "@repo/database";
import { getTranslations } from "@shared/lib/translations";
import {
	Building2Icon,
	ChartNoAxesCombinedIcon,
	LayoutDashboardIcon,
	LayoutTemplateIcon,
	PackageIcon,
	ReceiptTextIcon,
	ShoppingBagIcon,
	TagsIcon,
	UsersIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (session.user?.role !== "admin") {
		redirect("/");
	}

	const ordersAwaitingDispatch = await countOrdersAwaitingDispatch();

	return (
		<AdminShell className="pb-20">
			<AdminTopBar
				items={[
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
				]}
			/>

			<AdminContainer className="pt-10">{children}</AdminContainer>
		</AdminShell>
	);
}
