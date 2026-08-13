"use server";

import { getSession } from "@auth/lib/server";
import { deleteUserStoreAddress, saveUserStoreAddress } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addressSchema = z.object({
	id: z.string().optional(),
	label: z.string().trim().min(2).max(30),
	recipientName: z.string().trim().min(2).max(80),
	phone: z.string().trim().min(9).max(20),
	line1: z.string().trim().min(5).max(120),
	line2: z.string().trim().max(120).optional(),
	city: z.string().trim().min(2).max(60),
	region: z.string().trim().min(2).max(60),
	postalCode: z.string().trim().max(20).optional(),
	isDefault: z.boolean(),
});

export type AddressActionInput = z.infer<typeof addressSchema>;

async function getUserId() {
	const session = await getSession();
	if (!session) {
		throw new Error("Sign in to manage delivery addresses.");
	}
	return session.user.id;
}

export async function saveAddressAction(input: AddressActionInput) {
	try {
		const userId = await getUserId();
		await saveUserStoreAddress(userId, addressSchema.parse(input));
		revalidatePath("/settings/addresses");
		return { success: true, message: "Address saved." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Could not save address.",
		};
	}
}

export async function deleteAddressAction(id: string) {
	try {
		const userId = await getUserId();
		await deleteUserStoreAddress(userId, z.string().min(1).parse(id));
		revalidatePath("/settings/addresses");
		return { success: true, message: "Address removed." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Could not remove address.",
		};
	}
}
