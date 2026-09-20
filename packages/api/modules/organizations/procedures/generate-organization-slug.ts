import { ORPCError } from "@orpc/client";
import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const generateOrganizationSlug = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/generate-slug",
		tags: ["Organizations"],
		summary: "Generate organization slug",
		description: "Generate a unique slug from an organization name",
	})
	.input(
		z.object({
			// This route does up to three database lookups per call, so the
			// input is bounded. It is also protected now: slug probing let an
			// anonymous caller enumerate which organisations exist.
			name: z.string().trim().min(1).max(64),
		}),
	)
	.handler(async ({ input: { name } }) => {
		const baseSlug = slugify(name, {
			lowercase: true,
		});

		let slug = baseSlug;
		let hasAvailableSlug = false;

		for (let i = 0; i < 3; i++) {
			const existing = await getOrganizationBySlug(slug);

			if (!existing) {
				hasAvailableSlug = true;
				break;
			}

			slug = `${baseSlug}-${nanoid(5)}`;
		}

		if (!hasAvailableSlug) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		return { slug };
	});
