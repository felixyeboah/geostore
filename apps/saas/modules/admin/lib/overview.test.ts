import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	describeStockVelocity,
	formatCompactCedis,
	formatPercentChange,
	formatRelativeTime,
	parseOverviewRange,
	percentChange,
	productInitials,
	productTileClass,
} from "./overview.ts";

describe("parseOverviewRange", () => {
	it("accepts the supported ranges and falls back to 30", () => {
		assert.equal(parseOverviewRange("7"), 7);
		assert.equal(parseOverviewRange("90"), 90);
		assert.equal(parseOverviewRange(["30"]), 30);
		assert.equal(parseOverviewRange("14"), 30);
		assert.equal(parseOverviewRange(undefined), 30);
	});
});

describe("percentChange", () => {
	it("compares against the previous period", () => {
		assert.equal(percentChange(4_832_000, 4_299_000)?.toFixed(3), "0.124");
		assert.equal(percentChange(94, 96)?.toFixed(3), "-0.021");
	});

	it("has no answer when there is nothing to compare against", () => {
		assert.equal(percentChange(120, 0), null);
	});
});

describe("formatPercentChange", () => {
	it("signs and rounds the change", () => {
		assert.equal(formatPercentChange(0.124), "+12.4%");
		assert.equal(formatPercentChange(-0.018), "−1.8%");
		assert.equal(formatPercentChange(0), "0.0%");
		assert.equal(formatPercentChange(2.5), "+250%");
		assert.equal(formatPercentChange(null), "—");
	});
});

describe("formatRelativeTime", () => {
	const now = new Date("2026-09-18T12:00:00Z");

	it("reads like a person wrote it", () => {
		assert.equal(
			formatRelativeTime(new Date("2026-09-18T11:59:40Z"), now),
			"just now",
		);
		assert.equal(
			formatRelativeTime(new Date("2026-09-18T11:54:00Z"), now),
			"6 min ago",
		);
		assert.equal(
			formatRelativeTime(new Date("2026-09-18T10:30:00Z"), now),
			"1 hour ago",
		);
		assert.equal(
			formatRelativeTime(new Date("2026-09-18T07:00:00Z"), now),
			"5 hours ago",
		);
		assert.equal(
			formatRelativeTime(new Date("2026-09-17T09:00:00Z"), now),
			"yesterday",
		);
		assert.equal(
			formatRelativeTime(new Date("2026-09-15T09:00:00Z"), now),
			"3 days ago",
		);
	});

	it("switches to a date after a week", () => {
		assert.equal(
			formatRelativeTime(new Date("2026-09-01T09:00:00Z"), now),
			"1 Sept",
		);
	});
});

describe("formatCompactCedis", () => {
	it("shortens amounts for a chart axis", () => {
		assert.equal(formatCompactCedis(0), "0");
		assert.equal(formatCompactCedis(90_000), "900");
		assert.equal(formatCompactCedis(180_000), "1.8k");
		assert.equal(formatCompactCedis(360_000), "3.6k");
		assert.equal(formatCompactCedis(1_250_000), "13k");
	});
});

describe("describeStockVelocity", () => {
	it("warns when stock runs out soon", () => {
		assert.equal(
			describeStockVelocity(2, 5),
			"Sells ~5 a day · out in 1 day",
		);
		assert.equal(
			describeStockVelocity(3, 2),
			"Sells ~2 a day · out in 2 days",
		);
	});

	it("stays quiet about far-off or absent sell-through", () => {
		assert.equal(describeStockVelocity(5, 0.2), "Sells ~1 a week");
		assert.equal(describeStockVelocity(40, 1), "Sells ~1 a day");
		assert.equal(describeStockVelocity(4, 0), "No sales in this period");
	});
});

describe("product tiles", () => {
	it("derives a two-letter code", () => {
		assert.equal(productInitials("Bolga Market Basket"), "Bo");
		assert.equal(productInitials("x"), "X");
		assert.equal(productInitials("  "), "?");
	});

	it("gives the same product the same gradient every time", () => {
		assert.equal(productTileClass("prod_1"), productTileClass("prod_1"));
		assert.match(
			productTileClass("prod_1"),
			/^from-\[#[0-9a-f]{6}\] to-\[#[0-9a-f]{6}\]$/,
		);
	});
});
