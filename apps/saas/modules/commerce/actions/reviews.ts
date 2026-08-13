"use server";

import { getSession } from "@auth/lib/server";
import { createStoreReview } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
	orderItemId: z.string().min(1),
	rating: z.number().int().min(1).max(5),
	title: z.string().trim().min(3).max(80),
	body: z.string().trim().min(15).max(800),
});

export async function saveReviewAction(input: z.infer<typeof reviewSchema>) {
	const session = await getSession();

	if (!session) {
		return {
			success: false,
			message: "Sign in to leave a verified review.",
		};
	}

	try {
		const review = reviewSchema.parse(input);
		await createStoreReview({ ...review, userId: session.user.id });
		revalidatePath("/orders");
		revalidatePath("/");
		return { success: true, message: "Review submitted." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t save your review.",
		};
	}
}
