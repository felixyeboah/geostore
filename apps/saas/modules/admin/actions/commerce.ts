"use server";

import { getSession } from "@auth/lib/server";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import {
	createStoreProduct,
	updateStoreOrderStatus,
	updateStoreProduct,
	updateStoreProductStatus,
	updateStoreProductStock,
} from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface AdminActionResult {
	success: boolean;
	message: string;
	id?: string;
}

async function requireAdmin() {
	const session = await getSession();

	if (!session || session.user.role !== "admin") {
		throw new Error("You do not have permission to perform this action.");
	}

	return session;
}

export async function saveStoreProductAction(
	values: ProductFormValues,
	productId?: string,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const input = productFormSchema.parse(values);
		const product = productId
			? await updateStoreProduct(productId, input)
			: await createStoreProduct(input);

		revalidatePath("/");
		revalidatePath(`/products/${product.slug}`);
		revalidatePath("/admin/products");
		revalidatePath("/admin/overview");

		return {
			success: true,
			message: productId ? "Product updated." : "Product created.",
			id: product.id,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t save the product.",
		};
	}
}

export async function updateStoreProductStatusAction(
	productId: string,
	status: "DRAFT" | "ACTIVE" | "ARCHIVED",
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const parsedStatus = z
			.enum(["DRAFT", "ACTIVE", "ARCHIVED"])
			.parse(status);
		await updateStoreProductStatus(productId, parsedStatus);
		revalidatePath("/");
		revalidatePath("/admin/products");
		revalidatePath("/admin/overview");
		return { success: true, message: "Product status updated." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t update the product status.",
		};
	}
}

export async function updateStoreProductStockAction(
	productId: string,
	stockQuantity: number,
): Promise<AdminActionResult> {
	try {
		const session = await requireAdmin();
		const parsedQuantity = z.number().int().min(0).parse(stockQuantity);
		const product = await updateStoreProductStock(
			productId,
			parsedQuantity,
			session.user.id,
		);

		revalidatePath("/");
		revalidatePath(`/products/${product.slug}`);
		revalidatePath("/admin/products");
		revalidatePath("/admin/overview");
		return { success: true, message: "Stock updated." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t update stock.",
		};
	}
}

export async function updateStoreOrderStatusAction(
	orderId: string,
	status:
		| "PENDING"
		| "CONFIRMED"
		| "PROCESSING"
		| "READY_FOR_DELIVERY"
		| "OUT_FOR_DELIVERY"
		| "DELIVERED"
		| "CANCELLED"
		| "REFUNDED",
): Promise<AdminActionResult> {
	try {
		const session = await requireAdmin();
		const parsedStatus = z
			.enum([
				"PENDING",
				"CONFIRMED",
				"PROCESSING",
				"READY_FOR_DELIVERY",
				"OUT_FOR_DELIVERY",
				"DELIVERED",
				"CANCELLED",
				"REFUNDED",
			])
			.parse(status);
		await updateStoreOrderStatus(orderId, parsedStatus, session.user.id);
		revalidatePath("/admin/orders");
		revalidatePath("/admin/overview");
		revalidatePath("/orders");
		return { success: true, message: "Order status updated." };
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "We couldn’t update the order.",
		};
	}
}
