import { redirect } from "next/navigation";

/**
 * The customer account overview. Nobody who can sign in has a use for it:
 * this app is staff-only, so the back office is the landing place.
 */
export default function DashboardPage() {
	redirect("/admin/overview");
}
