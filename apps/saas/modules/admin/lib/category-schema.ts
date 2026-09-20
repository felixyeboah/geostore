import { z } from "zod";

/**
 * Shared by the department form and the server action that saves it, so the
 * message an admin sees while typing is the same one the server would give.
 */
export const categoryFormSchema = z.object({
	name: z.string().trim().min(2, "Give the department a name."),
	slug: z
		.string()
		.trim()
		.min(2, "Give the department a URL slug.")
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
	sortOrder: z.number().int(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/** The slug suggested while typing a name, before anyone edits it by hand. */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
