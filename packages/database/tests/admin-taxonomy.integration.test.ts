import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { db } from "../prisma/client";
import { Prisma } from "../prisma/generated/client";
import {
	getAdminCategoryList,
	getAdminCollectionList,
	moveAdminTaxonomy,
} from "../prisma/queries/admin-taxonomy";

const prefix = `taxonomy-${randomUUID()}`;
const ids = Array.from({ length: 6 }, (_, index) => `${prefix}-${index}`);

before(async () => {
	for (const [index, id] of [...ids].reverse().entries()) {
		const data = {
			id,
			name: prefix,
			slug: id,
			isActive: index % 2 === 0,
			sortOrder: 0,
		};
		await db.category.create({ data });
		await db.collection.create({ data });
	}
});
after(async () => {
	try {
		await db.category.deleteMany({ where: { id: { in: ids } } });
		await db.collection.deleteMany({ where: { id: { in: ids } } });
	} finally {
		await db.$disconnect();
	}
});

for (const [name, query] of [
	["departments", getAdminCategoryList],
	["collections", getAdminCollectionList],
] as const) {
	test(`${name}: database search, stable disjoint pages and bounded metadata`, async () => {
		const pages = await Promise.all(
			[1, 2, 3].map((page) =>
				query({ q: prefix.toUpperCase(), page, perPage: 2 }),
			),
		);
		assert.deepEqual(
			pages.flatMap((page) => page.rows.map((row) => row.id)),
			ids,
		);
		for (const page of pages) {
			assert.equal(page.total, 6);
			assert.equal(page.pageCount, 3);
			assert.equal(page.canReorder, false);
			assert.ok(page.rows.every((row) => !("products" in row)));
		}
		const last = await query({ q: prefix, page: 999, perPage: 2 });
		assert.equal(last.page, 3);
		assert.deepEqual(
			last.rows.map((row) => row.id),
			ids.slice(4),
		);
	});
	test(`${name}: visibility is combined with search before pagination`, async () => {
		for (const status of ["visible", "hidden"] as const) {
			const result = await query({ q: prefix, status, perPage: 2 });
			assert.equal(result.total, 3);
			assert.equal(result.rows.length, 2);
			assert.ok(
				result.rows.every(
					(row) => row.isActive === (status === "visible"),
				),
			);
		}
		const missing = await query({ q: `${prefix}-absent`, page: -50 });
		assert.equal(missing.total, 0);
		assert.equal(missing.page, 1);
		assert.equal(missing.pageCount, 1);
		assert.deepEqual(missing.rows, []);
	});
	test(`${name}: invalid pagination is normalized`, async () => {
		const result = await query({
			q: prefix,
			page: Number.NaN,
			perPage: -1,
		});
		assert.equal(result.page, 1);
		assert.equal(result.rows.length, 1);
	});
}

for (const kind of ["category", "collection"] as const) {
	test(`${kind}: global adjacent moves cross page boundaries and preserve every other position`, async () => {
		const options = {
			orderBy: [
				{ sortOrder: "asc" as const },
				{ name: "asc" as const },
				{ id: "asc" as const },
			],
			select: { id: true, sortOrder: true, updatedAt: true },
		};
		const original =
			kind === "category"
				? await db.category.findMany(options)
				: await db.collection.findMany(options);
		const table =
			kind === "category"
				? Prisma.sql`"store_category"`
				: Prisma.sql`"store_collection"`;
		const read =
			kind === "category" ? getAdminCategoryList : getAdminCollectionList;
		try {
			const index = original.findIndex(
				(row, position) =>
					ids.includes(row.id) && position > 0 && position % 2 === 0,
			);
			assert.ok(index > 0);
			const moving = original[index].id;
			const expected = original.map((row) => row.id);
			[expected[index - 1], expected[index]] = [
				expected[index],
				expected[index - 1],
			];
			await moveAdminTaxonomy({ kind, id: moving, direction: -1 });
			const beforePage = await read({ page: index / 2, perPage: 2 });
			assert.equal(beforePage.canReorder, true);
			assert.equal(beforePage.rows[1].id, moving);
			const all =
				kind === "category"
					? await db.category.findMany(options)
					: await db.collection.findMany(options);
			assert.deepEqual(
				all.map((row) => row.id),
				expected,
			);
			await moveAdminTaxonomy({ kind, id: all[0].id, direction: -1 });
			await moveAdminTaxonomy({
				kind,
				id: all[all.length - 1].id,
				direction: 1,
			});
			await assert.rejects(
				moveAdminTaxonomy({
					kind,
					id: `${prefix}-missing`,
					direction: 1,
				}),
				/no longer exists/,
			);
			const afterEdges =
				kind === "category"
					? await db.category.findMany(options)
					: await db.collection.findMany(options);
			assert.deepEqual(
				afterEdges.map((row) => row.id),
				expected,
			);
		} finally {
			await db.$executeRaw(
				Prisma.sql`UPDATE ${table} SET "sortOrder" = CASE "id" ${Prisma.join(
					original.map(
						(row) =>
							Prisma.sql`WHEN ${row.id} THEN ${row.sortOrder}`,
					),
					" ",
				)} END, "updatedAt" = CASE "id" ${Prisma.join(
					original.map(
						(row) =>
							Prisma.sql`WHEN ${row.id} THEN ${row.updatedAt}`,
					),
					" ",
				)} END WHERE "id" IN (${Prisma.join(original.map((row) => row.id))})`,
			);
		}
	});
}
