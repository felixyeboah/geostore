/** Run with pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/admin-user-filters.integration.test.ts */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { db } from "../prisma/client";
import { getAdminUserList } from "../prisma/queries/users";

test("verified users with an unset ban flag belong to the Active filter", async () => {
	const prefix = `user-filter-${randomUUID()}`;
	try {
		await db.user.createMany({
			data: [null, false, true].map((banned, index) => ({
				id: `${prefix}-${index}`,
				name: prefix,
				email: `${prefix}-${index}@example.test`,
				emailVerified: true,
				banned,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
		});
		const active = await getAdminUserList({ q: prefix, status: "active" });
		assert.deepEqual(active.users.map((user) => user.id).sort(), [
			`${prefix}-0`,
			`${prefix}-1`,
		]);
		assert.equal(active.total, 2);
		const banned = await getAdminUserList({ q: prefix, status: "banned" });
		assert.deepEqual(
			banned.users.map((user) => user.id),
			[`${prefix}-2`],
		);
	} finally {
		await db.user.deleteMany({ where: { id: { startsWith: prefix } } });
		await db.$disconnect();
	}
});
