import { z } from "zod";

export const bulkActionIdsSchema = z
	.array(z.string().trim().min(1, "Choose a valid item."))
	.min(1, "Choose at least one item.")
	.max(100, "Update at most 100 items at a time.")
	.refine((ids) => new Set(ids).size === ids.length, {
		message: "An item cannot appear twice in the same update.",
	});
