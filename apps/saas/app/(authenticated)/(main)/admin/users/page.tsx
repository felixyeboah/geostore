import { AdminHeader } from "@admin/components/AdminPage";
import { AddUserButton } from "@admin/components/users/AddUserSheet";
import { UsersTable } from "@admin/components/users/UsersTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
	return (
		<div>
			<AdminHeader
				eyebrow="Access"
				title="Users"
				description="Everyone who can sign in. This shop has no customer accounts, so every account here belongs to someone who works on it."
				actions={<AddUserButton />}
			/>

			<div className="mt-9">
				<UsersTable />
			</div>
		</div>
	);
}
