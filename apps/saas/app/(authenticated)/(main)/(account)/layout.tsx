import { AdminContainer, AdminShell } from "@admin/components/AdminPage";
import { AdminTopBar } from "@admin/components/AdminTopBar";
import { getAdminNavItems } from "@admin/lib/nav";
import type { PropsWithChildren } from "react";

/**
 * Account settings wear the back office's chrome.
 *
 * They used to sit in a sidebar built for customers — Store, Overview, Orders,
 * Account settings — but customers never sign in here. Only staff do, so a
 * second navigation alongside the admin's own was two bars competing for the
 * same job.
 */
export default async function UserLayout({ children }: PropsWithChildren) {
	return (
		<AdminShell className="pb-20">
			<AdminTopBar items={await getAdminNavItems()} />
			<AdminContainer className="pt-10">{children}</AdminContainer>
		</AdminShell>
	);
}
