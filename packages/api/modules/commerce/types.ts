import { isAllowedImageUrl } from "@repo/utils";
import { z } from "zod";

export const productFormSchema = z.object({
	name: z.string().trim().min(2, "Enter a product name."),
	slug: z
		.string()
		.trim()
		.min(2, "Enter a product URL slug.")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Use lowercase words separated by hyphens.",
		),
	shortDescription: z
		.string()
		.trim()
		.min(10, "Add a short description.")
		.max(180),
	description: z
		.string()
		.trim()
		.min(30, "Add a more complete product description."),
	brand: z.string().trim().min(2, "Enter the brand."),
	sku: z.string().trim().min(3, "Enter a SKU."),
	status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
	priceInPesewas: z.number().int().min(1, "Enter a price greater than zero."),
	compareAtInPesewas: z.number().int().positive().optional(),
	stockQuantity: z.number().int().min(0),
	lowStockThreshold: z.number().int().min(0),
	isFeatured: z.boolean(),
	categoryId: z.string().min(1, "Choose a category."),
	imageUrls: z
		.array(
			z
				.string()
				.url("Use a complete image URL.")
				.refine(isAllowedImageUrl, {
					message:
						"That image host is not allowed. Upload the image instead, or use an approved host.",
				}),
		)
		.min(1, "Add at least one product image."),
	specifications: z.record(z.string(), z.string()),
	variants: z.array(
		z.object({
			id: z.string().optional(),
			// Optional: when it is blank the option values ("Black · 256 GB")
			// become the name — that is what buyers read, so the values are the
			// label anyway.
			name: z.string().trim(),
			sku: z.string().trim().min(3),
			priceInPesewas: z.number().int().min(1),
			stockQuantity: z.number().int().min(0),
			attributes: z.record(z.string(), z.string()),
			isActive: z.boolean(),
		}),
	),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
