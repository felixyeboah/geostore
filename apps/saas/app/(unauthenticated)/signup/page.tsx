import { redirect } from "next/navigation";

/**
 * Public sign-up is closed: staff accounts are created with
 * `pnpm --filter @repo/scripts create:user`. The route stays so existing links
 * and bookmarks land somewhere sensible instead of a 404.
 */
export default function SignupPage() {
	redirect("/login");
}
