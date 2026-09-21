import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	loadOrderListParams,
	loadTaxonomyListParams,
	ORDER_STATUSES,
	PAYMENT_STATUSES,
} from "./list-params.ts";

describe("order list URL validation", () => {
	it("discards invalid status filters before they reach Prisma", () => {
		const params = loadOrderListParams(
			new URLSearchParams("status=INVALID&payment=paid"),
		);
		assert.equal(params.status, null);
		assert.equal(params.payment, null);
	});

	it("preserves every supported order and payment status", () => {
		for (const status of ORDER_STATUSES) {
			for (const payment of PAYMENT_STATUSES) {
				const params = loadOrderListParams({ status, payment });
				assert.equal(params.status, status);
				assert.equal(params.payment, payment);
			}
		}
	});

	it("keeps paging, search and sorting when dropping malformed filters", () => {
		const params = loadOrderListParams({
			status: "__proto__",
			payment: "",
			q: "example",
			page: "2",
			sort: "total",
			dir: "asc",
		});
		assert.deepEqual(params, {
			status: null,
			payment: null,
			q: "example",
			page: 2,
			sort: "total",
			dir: "asc",
		});
	});
});

describe("taxonomy list URL validation", () => {
	it("discards unsupported visibility and preserves search and page", () => {
		assert.deepEqual(
			loadTaxonomyListParams({
				status: "__proto__",
				q: "phones",
				page: "2",
			}),
			{ status: null, q: "phones", page: 2 },
		);
	});
	it("preserves each visibility filter", () => {
		for (const status of ["visible", "hidden"]) {
			assert.equal(loadTaxonomyListParams({ status }).status, status);
		}
	});
});
