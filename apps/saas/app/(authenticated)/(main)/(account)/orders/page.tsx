import { redirect } from "next/navigation";

/**
 * A staff member's own order history is not a thing: they fulfil everyone's.
 */
export default function AccountOrdersPage() {
	redirect("/admin/orders");
}
