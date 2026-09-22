import type { z } from "zod";
import { db } from "../client";
import type { OrganizationSchema } from "../zod";
import { StoreOperationError } from "./errors";

export async function getOrganizations({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return db.organization
		.findMany({
			where: query
				? {
						OR: [
							{
								name: {
									contains: query,
								},
							},
						],
					}
				: undefined,
			include: {
				_count: {
					select: {
						members: true,
					},
				},
			},
			orderBy: [{ createdAt: "desc" }, { id: "asc" }],
			take: limit,
			skip: offset,
		})
		.then((res) =>
			res.map((org) => ({
				...org,
				membersCount: org._count.members,
			})),
		);
}

export async function countAllOrganizations({ query }: { query?: string }) {
	return db.organization.count({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
							},
						},
					],
				}
			: undefined,
	});
}

export async function getOrganizationById(id: string) {
	return db.organization.findUnique({
		where: { id },
		include: {
			members: true,
			invitations: true,
		},
	});
}

export async function getInvitationById(id: string) {
	return db.invitation.findUnique({
		where: { id },
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationBySlug(slug: string) {
	return db.organization.findUnique({
		where: { slug },
	});
}

export async function getOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	return db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId,
			},
		},
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationWithPurchasesAndMembersCount(
	organizationId: string,
) {
	const organization = await db.organization.findUnique({
		where: {
			id: organizationId,
		},
		include: {
			purchases: true,
			_count: {
				select: {
					members: true,
				},
			},
		},
	});

	return organization
		? {
				...organization,
				membersCount: organization._count.members,
			}
		: null;
}

export async function getPendingInvitationByEmail(email: string) {
	return db.invitation.findFirst({
		where: {
			email,
			status: "pending",
		},
	});
}

export async function updateOrganization(
	organization: Partial<z.infer<typeof OrganizationSchema>> & { id: string },
) {
	return db.organization.update({
		where: {
			id: organization.id,
		},
		data: organization,
	});
}

export async function deleteAdminOrganization(id: string) {
	return db.$transaction(async (tx) => {
		const subscriptions = await tx.purchase.count({
			where: { organizationId: id, subscriptionId: { not: null } },
		});
		if (subscriptions > 0) {
			throw new StoreOperationError(
				"Cancel and remove linked subscriptions before deleting this organization.",
			);
		}
		return tx.organization.deleteMany({ where: { id } });
	});
}
