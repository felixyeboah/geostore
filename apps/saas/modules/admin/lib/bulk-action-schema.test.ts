import assert from "node:assert/strict";
import { test } from "node:test";
import { bulkActionIdsSchema } from "./bulk-action-schema";

test("bulk updates reject malformed, empty and oversized selections", () => {
	for (const value of [
		null,
		undefined,
		"product-id",
		{},
		[],
		[" "],
		[1],
		Array.from({ length: 101 }, (_, index) => String(index)),
	]) {
		assert.equal(bulkActionIdsSchema.safeParse(value).success, false);
	}
});

test("bulk updates cannot repeat an item or disguise duplicates with whitespace", () => {
	assert.equal(bulkActionIdsSchema.safeParse(["id", " id "]).success, false);
	assert.deepEqual(bulkActionIdsSchema.parse([" first ", "second"]), [
		"first",
		"second",
	]);
});
