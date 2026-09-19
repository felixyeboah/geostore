import { redirect } from "next/navigation";

/**
 * The sidebar links to `/admin`, but the section's landing screen is the
 * overview. Without this the link falls through to the catch-all and 404s.
 */
export default function AdminIndexPage() {
	redirect("/admin/overview");
}
