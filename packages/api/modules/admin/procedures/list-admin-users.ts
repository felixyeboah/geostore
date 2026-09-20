import { getAdminUserList } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

/**
 * The people who can sign in, for the admin's user list.
 *
 * Filtering, sorting and paging happen in the database, like every other admin
 * list, and the facet counts come back with the page so the filter bar can say
 * how many rows each choice would show.
 */
export const listAdminUsers = adminProcedure
	.route({
		method: "GET",
		path: "/admin/users/list",
		tags: ["Administration"],
		summary: "List users with filters and facet counts",
	})
	.input(
		z.object({
			query: z.string().optional(),
			role: z.enum(["admin", "user"]).optional(),
			status: z.enum(["active", "banned", "unverified"]).optional(),
			sort: z.enum(["created", "name"]).default("created"),
			dir: z.enum(["asc", "desc"]).default("desc"),
			page: z.number().min(1).default(1),
		}),
	)
	.handler(async ({ input }) => {
		const list = await getAdminUserList({
			q: input.query,
			role: input.role,
			status: input.status,
			sort: input.sort,
			dir: input.dir,
			page: input.page,
		});

		return {
			users: list.users.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
				role: user.role,
				banned: user.banned ?? false,
				banReason: user.banReason,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt.toISOString(),
				sessionCount: user._count.sessions,
				orderCount: user._count.orders,
			})),
			total: list.total,
			page: list.page,
			pageCount: list.pageCount,
			facets: list.facets,
		};
	});
