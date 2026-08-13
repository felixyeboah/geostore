"use server";

import { getSession } from "@auth/lib/server";
import { createMockStoreOrder } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const placeMockOrderSchema = z.object({
	customer: z.object({
		name: z.string().trim().min(2),
		email: z.string().trim().email(),
		phone: z.string().trim().min(10),
	}),
	address: z.object({
		line1: z.string().trim().min(5),
		line2: z.string().trim().optional(),
		city: z.string().trim().min(2),
		region: z.string().trim().min(2),
	}),
	items: z
		.array(
			z.object({
				productId: z.string().min(1),
				quantity: z.number().int().min(1),
			}),
		)
		.min(1),
	customerNote: z.string().trim().max(300).optional(),
});

export interface PlaceMockOrderResult {
	success: boolean;
	message?: string;
	order?: {
		id: string;
		orderNumber: string;
		placedAt: string;
	};
}

export async function placeMockOrderAction(
	input: z.infer<typeof placeMockOrderSchema>,
): Promise<PlaceMockOrderResult> {
	const parsedInput = placeMockOrderSchema.safeParse(input);

	if (!parsedInput.success) {
		return {
			success: false,
			message: "Check your delivery details and try again.",
		};
	}

	try {
		const session = await getSession();
		const order = await createMockStoreOrder({
			...parsedInput.data,
			userId: session?.user.id,
		});

		revalidatePath("/admin/overview");
		revalidatePath("/admin/orders");
		revalidatePath("/orders");

		return {
			success: true,
			order: {
				id: order.id,
				orderNumber: order.orderNumber,
				placedAt: order.placedAt.toISOString(),
			},
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t place the order. Please try again.",
		};
	}
}
