import { ORPCError } from "@orpc/server";
import { getOrganizationById, updateOrganization } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const updateAdminOrganization = adminProcedure
	.route({
		method: "PATCH",
		path: "/admin/organizations/{id}",
		tags: ["Administration"],
		summary: "Update an organization as a site administrator",
	})
	.input(
		z.object({
			id: z.string().min(1),
			name: z.string().trim().min(1).max(64),
		}),
	)
	.handler(async ({ input }) => {
		if (!(await getOrganizationById(input.id))) {
			throw new ORPCError("NOT_FOUND");
		}
		return updateOrganization({ id: input.id, name: input.name });
	});
