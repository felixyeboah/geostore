import type { ProductFormValues } from "@repo/api/modules/commerce/types";

/** The primary button's target status, distinct from the explicit draft action. */
export function productSaveStatus(
	status: ProductFormValues["status"],
	isExisting: boolean,
): ProductFormValues["status"] {
	return isExisting || status === "ARCHIVED" ? status : "ACTIVE";
}
