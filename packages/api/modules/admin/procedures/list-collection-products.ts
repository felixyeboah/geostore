import { ORPCError } from "@orpc/server";
import { getAdminCollectionProductPage } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const listCollectionProducts = adminProcedure
	.route({
		method: "GET",
		path: "/admin/collections/{collectionId}/products",
		tags: ["Administration"],
		summary: "List one page of collection membership",
	})
	.input(
		z.object({
			collectionId: z.string().min(1),
			page: z.number().int().min(1).default(1),
		}),
	)
	.handler(async ({ input }) => {
		const result = await getAdminCollectionProductPage(
			input.collectionId,
			input.page,
		);
		if (!result) {
			throw new ORPCError("NOT_FOUND");
		}
		return result;
	});
