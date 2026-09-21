import type { z } from "zod";
import { db } from "../client";
import type { Prisma } from "../generated/client";
import type { UserSchema } from "../zod";

export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return await db.user.findMany({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
							},
						},
						{
							email: {
								contains: query,
							},
						},
					],
				}
			: undefined,
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		take: limit,
		skip: offset,
	});
}

export async function countAllUsers({ query }: { query?: string }) {
	return await db.user.count({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
							},
						},
						{
							email: {
								contains: query,
							},
						},
					],
				}
			: undefined,
	});
}

export async function getUserById(id: string) {
	return await db.user.findUnique({
		where: {
			id,
		},
	});
}

export async function getUserByEmail(email: string) {
	return await db.user.findUnique({
		where: {
			email,
		},
	});
}

export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	return await db.user.create({
		data: {
			email,
			name,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getAccountById(id: string) {
	return await db.account.findUnique({
		where: {
			id,
		},
	});
}

export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	return await db.account.create({
		data: {
			userId,
			accountId,
			providerId,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function updateUser(
	user: Partial<z.infer<typeof UserSchema>> & { id: string },
) {
	return await db.user.update({
		where: {
			id: user.id,
		},
		data: user,
	});
}

export type AdminUserRole = "admin" | "user";

export type AdminUserStatus = "active" | "banned" | "unverified";

export interface AdminUserListQuery {
	q?: string;
	role?: AdminUserRole;
	status?: AdminUserStatus;
	sort?: "created" | "name";
	dir?: "asc" | "desc";
	/** 1-based. */
	page?: number;
	perPage?: number;
}

const ADMIN_USERS_PER_PAGE = 25;

function userSearchWhere(q?: string): Prisma.UserWhereInput {
	const query = q?.trim();

	if (!query) {
		return {};
	}

	return {
		OR: [
			{ name: { contains: query } },
			{ email: { contains: query } },
			{ username: { contains: query } },
		],
	};
}

/**
 * Everyone is `role: "admin"` or has no role at all — Better Auth leaves the
 * column null rather than writing "user" — so "not an admin" has to be
 * expressed as both.
 */
function userRoleWhere(role?: AdminUserRole): Prisma.UserWhereInput {
	if (role === "admin") {
		return { role: "admin" };
	}
	if (role === "user") {
		return { OR: [{ role: null }, { role: { not: "admin" } }] };
	}
	return {};
}

function userStatusWhere(status?: AdminUserStatus): Prisma.UserWhereInput {
	switch (status) {
		case "banned":
			return { banned: true };
		case "unverified":
			return { emailVerified: false };
		case "active":
			return {
				emailVerified: true,
				OR: [{ banned: false }, { banned: null }],
			};
		default:
			return {};
	}
}

/**
 * One page of the people who can sign in.
 *
 * This shop has no customer accounts, so every row here is staff. The list
 * filters, sorts and pages in the database like the other admin lists, and
 * reports the counts its facets need.
 */
export async function getAdminUserList(query: AdminUserListQuery = {}) {
	const perPage = query.perPage ?? ADMIN_USERS_PER_PAGE;
	const search = userSearchWhere(query.q);
	const byRole = userRoleWhere(query.role);
	const byStatus = userStatusWhere(query.status);

	const where: Prisma.UserWhereInput = { AND: [search, byRole, byStatus] };

	const total = await db.user.count({ where });
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

	const [users, admins, others, banned, unverified, active] =
		await Promise.all([
			db.user.findMany({
				where,
				orderBy:
					query.sort === "name"
						? [{ name: query.dir ?? "asc" }, { id: "asc" }]
						: [{ createdAt: query.dir ?? "desc" }, { id: "asc" }],
				skip: (page - 1) * perPage,
				take: perPage,
				include: {
					_count: { select: { sessions: true, orders: true } },
				},
			}),
			db.user.count({
				where: { AND: [search, byStatus, userRoleWhere("admin")] },
			}),
			db.user.count({
				where: { AND: [search, byStatus, userRoleWhere("user")] },
			}),
			db.user.count({
				where: { AND: [search, byRole, userStatusWhere("banned")] },
			}),
			db.user.count({
				where: { AND: [search, byRole, userStatusWhere("unverified")] },
			}),
			db.user.count({
				where: { AND: [search, byRole, userStatusWhere("active")] },
			}),
		]);

	return {
		users,
		total,
		page,
		pageCount,
		perPage,
		facets: {
			role: { admin: admins, user: others },
			status: { active, banned, unverified },
		},
	};
}

export type AdminUserList = Awaited<ReturnType<typeof getAdminUserList>>;
