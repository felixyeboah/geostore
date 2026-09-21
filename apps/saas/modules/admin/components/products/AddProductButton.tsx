import { adminButtonClass } from "@admin/components/ui";
import type { ControlSize } from "@admin/components/ui/control-styles";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

/** The way into the add-product page, styled as the list's primary action. */
export function AddProductButton({
	label = "Add product",
	variant = "primary",
	size,
}: {
	label?: string;
	variant?: "primary" | "quiet";
	size?: ControlSize;
}) {
	return (
		<Link
			href="/admin/products/new"
			className={adminButtonClass(variant, size)}
		>
			<PlusIcon className="size-4" />
			{label}
		</Link>
	);
}
