"use server";

import type { AdminActionResult } from "@admin/actions/commerce";
import { revalidateStorefrontMenu } from "@admin/lib/revalidate-storefront";
import { getSession } from "@auth/lib/server";
import { moveAdminTaxonomy, StoreOperationError } from "@repo/database";
import { logger } from "@repo/logs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const moveSchema = z.object({
	kind: z.enum(["category", "collection"]),
	id: z.string().min(1),
	direction: z.union([z.literal(-1), z.literal(1)]),
});

export async function moveTaxonomyAction(
	input: z.infer<typeof moveSchema>,
): Promise<AdminActionResult> {
	try {
		const session = await getSession();
		if (session?.user.role !== "admin") {
			return {
				success: false,
				message: "You do not have permission to reorder the catalogue.",
			};
		}
		const parsed = moveSchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false,
				message: "Choose a valid catalogue item and direction.",
			};
		}
		await moveAdminTaxonomy(parsed.data);
		revalidatePath("/admin/categories");
		revalidatePath("/admin/collections");
		revalidatePath("/");
		revalidatePath("/shop");
		await revalidateStorefrontMenu();
		return { success: true, message: "Order saved." };
	} catch (error) {
		logger.error(error);
		return {
			success: false,
			message:
				error instanceof StoreOperationError
					? error.message
					: "The order could not be saved. Please try again.",
		};
	}
}
