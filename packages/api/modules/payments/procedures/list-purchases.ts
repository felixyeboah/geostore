import { ORPCError } from "@orpc/server";
import {
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import {
	getPlanIdByProviderPriceId,
	getPlanPriceByProviderPriceId,
} from "@repo/payments";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listPurchases = protectedProcedure
	.route({
		method: "GET",
		path: "/payments/purchases",
		tags: ["Payments"],
		summary: "Get purchases",
		description:
			"Get all purchases of the current user or the provided organization",
	})
	.input(
		z.object({
			organizationId: z.string().min(1).max(64).optional(),
		}),
	)
	.handler(async ({ input: { organizationId }, context: { user } }) => {
		if (organizationId) {
			// Without this the id is simply trusted, so any signed-in user
			// could read any organisation's purchase history by guessing one.
			const membership = await verifyOrganizationMembership(
				organizationId,
				user.id,
			);

			if (!membership) {
				throw new ORPCError("FORBIDDEN");
			}
		}

		const purchases = organizationId
			? await getPurchasesByOrganizationId(organizationId)
			: await getPurchasesByUserId(user.id);

		return purchases.map((purchase) => ({
			...purchase,
			planId: getPlanIdByProviderPriceId(purchase.priceId),
			planPrice:
				getPlanPriceByProviderPriceId(purchase.priceId)?.price ?? null,
		}));
	});
