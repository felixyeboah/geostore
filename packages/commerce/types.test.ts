import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { conditionLabel } from "./types";

describe("conditionLabel", () => {
	it("labels every condition", () => {
		assert.equal(conditionLabel("NEW"), "New");
		assert.equal(conditionLabel("USED"), "Used");
		assert.equal(conditionLabel("REFURBISHED"), "Refurbished");
	});
});
