import { getOrganizationList, getSession } from "@auth/lib/server";
import { OrderHistory } from "@commerce/components/OrderHistory";
import { getCustomerOrderHistory } from "@commerce/lib/customer-orders";
import { OrganizationsGrid } from "@organizations/components/OrganizationsGrid";
import { config } from "@repo/auth/config";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { storefront } from "@shared/lib/storefront";
import { ArrowRightIcon, SettingsIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const [organizations, orders] = await Promise.all([
		getOrganizationList(),
		getCustomerOrderHistory(session.user.id),
	]);

	if (
		config.organizations.enable &&
		config.organizations.requireOrganization
	) {
		const organization =
			organizations.find(
				(org) => org.id === session?.session.activeOrganizationId,
			) || organizations[0];

		if (!organization) {
			redirect("/new-organization");
		}

		redirect(`/${organization.slug}`);
	}

	return (
		<div className="">
			<PageHeader
				title={`Welcome back, ${session.user.name.split(" ")[0]}`}
				subtitle="See your recent orders and keep your account details up to date."
			/>

			<div>
				{config.organizations.enable && <OrganizationsGrid />}

				<div className="grid gap-4 sm:grid-cols-2">
					<Card className="p-5">
						<ShoppingBagIcon className="size-5 text-primary" />
						<h2 className="mt-5 font-semibold">
							Continue shopping
						</h2>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							Browse current products or return to a bag you
							started on this device.
						</p>
						<Button asChild size="sm" className="mt-4">
							<Link href={storefront.shop}>
								Open the store{" "}
								<ArrowRightIcon className="size-4" />
							</Link>
						</Button>
					</Card>
					<Card className="p-5">
						<SettingsIcon className="size-5 text-primary" />
						<h2 className="mt-5 font-semibold">Account details</h2>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							Update your name, email, password, sessions, and
							security settings.
						</p>
						<Button
							asChild
							size="sm"
							variant="secondary"
							className="mt-4"
						>
							<Link href="/settings/general">
								Manage profile{" "}
								<ArrowRightIcon className="size-4" />
							</Link>
						</Button>
					</Card>
				</div>

				<div className="mt-10">
					<div className="mb-5 flex items-end justify-between gap-4">
						<div>
							<p className="font-semibold text-primary text-sm">
								Recent activity
							</p>
							<h2 className="mt-1 font-semibold text-2xl">
								Your latest order
							</h2>
						</div>
						<Link
							href="/orders"
							className="font-semibold text-primary text-sm"
						>
							View history
						</Link>
					</div>
					<OrderHistory initialOrders={orders} limit={1} />
				</div>
			</div>
		</div>
	);
}
