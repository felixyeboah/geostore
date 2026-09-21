import { ORPCError } from "@orpc/client";
import { getOrganizationById as getOrganizationByIdFn } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const findOrganization = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations/{id}",
		tags: ["Administration"],
		summary: "Find organization by ID",
	})
	.input(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ input: { id }, context: { user } }) => {
		const organization = await getOrganizationByIdFn(id);

		if (!organization) {
			throw new ORPCError("NOT_FOUND");
		}

		return {
			...organization,
			currentMemberRole:
				organization.members.find((member) => member.userId === user.id)
					?.role ?? null,
		};
	});
