import { z } from "zod";

/**
 * Shared by the collection form and the server action that saves it, so the
 * message an admin sees while typing is the one the server would give.
 */
export const collectionFormSchema = z.object({
	name: z.string().trim().min(2, "Give the collection a name."),
	slug: z
		.string()
		.trim()
		.min(2, "Give the collection a URL slug.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Use lowercase words separated by hyphens.",
		),
	description: z.string().trim().optional(),
	imageUrl: z
		.string()
		.trim()
		.url("Enter a complete image URL.")
		.optional()
		.or(z.literal("")),
	isActive: z.boolean(),
	onLanding: z.boolean(),
	sortOrder: z.number().int(),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
