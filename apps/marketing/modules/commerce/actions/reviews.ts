"use server";

import { toStoreErrorMessage } from "@repo/commerce/action-errors";
import { createGuestStoreReview } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
	productId: z.string().min(1),
	productSlug: z.string().min(1),
	orderNumber: z.string().trim().min(3).max(40),
	email: z.email(),
	rating: z.number().int().min(1).max(5),
	title: z.string().trim().max(80).optional(),
	body: z.string().trim().min(15).max(800),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

/**
 * A review from a customer who has no account, because this shop has none.
 *
 * Entitlement is proved by the order rather than a session: the order number
 * and the email it was placed with must match a DELIVERED order containing
 * this product. That check lives in the database layer, which is the only
 * place that can be trusted with it.
 */
export async function saveReviewAction(input: unknown) {
	const parsed = reviewSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message:
				parsed.error.issues[0]?.message ??
				"Please check the form and try again.",
		};
	}

	const review = parsed.data;

	try {
		await createGuestStoreReview({
			productId: review.productId,
			orderNumber: review.orderNumber,
			email: review.email,
			rating: review.rating,
			title: review.title,
			body: review.body,
		});
	} catch (error) {
		return {
			success: false,
			message: toStoreErrorMessage(
				error,
				"We couldn’t save your review.",
			),
		};
	}

	// The product page shows the rating and the review list, and both are
	// rendered on the server.
	revalidatePath(`/products/${review.productSlug}`);

	return { success: true, message: "Thank you — your review is published." };
}
