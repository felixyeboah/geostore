import { ORPCError } from "@orpc/server";
import { deleteAdminOrganization, StoreOperationError } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const deleteOrganization = adminProcedure
	.route({
		method: "DELETE",
		path: "/admin/organizations/{id}",
		tags: ["Administration"],
		summary: "Delete an organization without active billing links",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input }) => {
		try {
			await deleteAdminOrganization(input.id);
		} catch (error) {
			if (error instanceof StoreOperationError) {
				throw new ORPCError("CONFLICT", { message: error.message });
			}
			throw error;
		}
		return { success: true };
	});
