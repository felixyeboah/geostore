import { AdminContainer, AdminShell } from "@admin/components/AdminPage";
import { AdminTopBar } from "@admin/components/AdminTopBar";
import { getAdminNavItems } from "@admin/lib/nav";
import { getSession } from "@auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (session.user?.role !== "admin") {
		redirect("/");
	}

	return (
		<AdminShell className="pb-20">
			<AdminTopBar items={await getAdminNavItems()} />
			<AdminContainer className="pt-10">{children}</AdminContainer>
		</AdminShell>
	);
}
