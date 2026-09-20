"use server";

import { revalidateStorefrontMenu } from "@admin/lib/revalidate-storefront";
import { getSession } from "@auth/lib/server";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import {
	createStoreCategory,
	createStoreProduct,
	deleteStoreCategory,
	deleteStoreProduct,
	getAdminStoreOrder,
	getAdminStoreProductById,
	getPrismaErrorCode,
	getRecipientName,
	getStoreCategoryById,
	getStorePagesForOrder,
	isStoreOperationError,
	markCashOnDeliveryPaid,
	recordStoreOrderStatusNote,
	reorderStoreCategories,
	StoreOperationError,
	setStoreCategoryActive,
	updateStoreCategory,
	updateStoreOrderStatus,
	updateStoreProduct,
	updateStoreProductStatus,
	updateStoreProductStock,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { refundStorePayment } from "@repo/payments";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface AdminActionResult {
	success: boolean;
	message: string;
	id?: string;
	/** The request was accepted but the order will not change until a webhook lands. */
	pending?: boolean;
}

async function requireAdmin() {
	const session = await getSession();

	if (!session || session.user.role !== "admin") {
		throw new StoreOperationError(
			"You do not have permission to perform this action.",
		);
	}

	return session;
}

/**
 * Prisma and Zod messages carry server file paths, constraint names, and raw
 * JSON issue arrays. Those belong in the server log, not in an admin's toast.
 */
function toAdminErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof z.ZodError) {
		return error.issues[0]?.message ?? fallback;
	}

	// Messages we authored for an admin to read.
	if (isStoreOperationError(error)) {
		return error.message;
	}

	const prismaCode = getPrismaErrorCode(error);

	if (prismaCode === "P2002") {
		return "That URL slug or SKU is already used by another item.";
	}

	if (prismaCode === "P2025") {
		return "That item no longer exists. Refresh and try again.";
	}

	logger.error(error);
	return fallback;
}

/**
 * `/`, `/products/[slug]` and `/categories/[slug]` all build as `ƒ` (dynamic),
 * so the server re-queries on every request and these calls are not what keeps
 * the *server* honest. They matter for the client Router Cache: after a
 * soft navigation Next serves a shopper the RSC payload it already holds, so a
 * product withdrawn or repriced while they browse would otherwise stay on
 * screen — and still be addable to the bag — until a hard reload.
 */
async function revalidateStorefrontForProduct(product: {
	slug: string;
	category?: { slug: string } | null;
	categorySlug?: string | null;
}) {
	revalidatePath("/");
	revalidatePath(`/products/${product.slug}`);

	const categorySlug = product.category?.slug ?? product.categorySlug;
	if (categorySlug) {
		revalidatePath(`/categories/${categorySlug}`);
	}

	revalidatePath("/admin/products");
	revalidatePath("/admin/overview");

	// Counts, brand pills and the featured tile in the shop menu all come from
	// live products, and that endpoint is cached in the other app.
	await revalidateStorefrontMenu();
}

export async function saveStoreProductAction(
	values: ProductFormValues,
	productId?: string,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const input = productFormSchema.parse(values);
		// Captured before the write: renaming the slug or moving the product to
		// another category would otherwise leave the previous URLs cached and
		// serving stale data indefinitely.
		const previous = productId
			? await getAdminStoreProductById(productId)
			: null;
		const product = productId
			? await updateStoreProduct(productId, input)
			: await createStoreProduct(input);

		if (previous) {
			await revalidateStorefrontForProduct(previous);
		}
		await revalidateStorefrontForProduct(product);

		return {
			success: true,
			message: productId ? "Product updated." : "Product created.",
			id: product.id,
		};
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t save the product.",
			),
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
		const product = await updateStoreProductStatus(productId, parsedStatus);
		await revalidateStorefrontForProduct(product);
		return { success: true, message: "Product status updated." };
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t update the product status.",
			),
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

		await revalidateStorefrontForProduct(product);
		return { success: true, message: "Stock updated." };
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(error, "We couldn’t update stock."),
		};
	}
}

export async function deleteStoreProductAction(
	productId: string,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const result = await deleteStoreProduct(productId);

		if (result.status === "not-found") {
			return {
				success: false,
				message: "That product no longer exists.",
			};
		}

		if (result.status === "has-orders") {
			// Order history has to stay intact, so this is a refusal rather
			// than a cascade. Archiving takes it off the storefront and is
			// what the admin almost always means.
			return {
				success: false,
				message: `It appears on ${result.orderCount} ${
					result.orderCount === 1 ? "order" : "orders"
				}, so deleting it would rewrite order history. Archive it instead to take it off the storefront.`,
			};
		}

		await revalidateStorefrontForProduct({
			slug: result.product.slug,
			categorySlug: result.product.categorySlug,
		});

		return {
			success: true,
			message: `${result.product.name} deleted.`,
		};
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t delete the product.",
			),
		};
	}
}

export async function bulkUpdateStoreProductStatusAction(
	productIds: string[],
	status: "DRAFT" | "ACTIVE" | "ARCHIVED",
): Promise<AdminActionResult & { updated: number; failed: number }> {
	try {
		await requireAdmin();
	} catch {
		return {
			success: false,
			message: "You do not have permission to perform this action.",
			updated: 0,
			failed: productIds.length,
		};
	}

	let updated = 0;
	let firstError: string | undefined;

	for (const productId of productIds) {
		const result = await updateStoreProductStatusAction(productId, status);

		if (result.success) {
			updated += 1;
		} else {
			firstError ??= result.message;
		}
	}

	const failed = productIds.length - updated;

	return {
		success: updated > 0,
		updated,
		failed,
		message: failed
			? `${updated} of ${productIds.length} updated. ${firstError ?? "Some products could not be changed."}`
			: `${updated} ${updated === 1 ? "product" : "products"} updated.`,
	};
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
		const order = await getAdminStoreOrder(orderId);
		if (!order) {
			return { success: false, message: "Order not found." };
		}

		if (parsedStatus === "REFUNDED") {
			if (order.paymentStatus !== "PAID") {
				return {
					success: false,
					message: "Only paid orders can be refunded.",
				};
			}
			if (
				order.paymentMethod !== "CASH_ON_DELIVERY" &&
				order.paymentMethod !== "MOCK"
			) {
				const paymentId = order.transactions[0]?.providerPaymentId;
				if (!paymentId) {
					return {
						success: false,
						message: "No Reevit payment id on this order.",
					};
				}
				await refundStorePayment(
					paymentId,
					order.totalInPesewas,
					"Requested by Geostoresgh admin",
				);
				await recordStoreOrderStatusNote(
					orderId,
					order.status,
					session.user.id,
					"Refund requested from Reevit",
				);
				revalidatePath("/admin/orders");
				revalidatePath("/admin/overview");
				revalidatePath("/orders");
				return {
					success: true,
					pending: true,
					message:
						"Refund requested. Stock updates when Reevit confirms.",
				};
			}
		}

		await updateStoreOrderStatus(orderId, parsedStatus, session.user.id);

		if (parsedStatus === "OUT_FOR_DELIVERY") {
			// The status is already committed above. `sendEmail` renders the
			// template outside its own try block, so a mail failure used to
			// throw past this point and tell the admin "We couldn’t update the
			// order" about a change that had in fact been saved — inviting a
			// retry that writes a second status note.
			try {
				await sendEmail({
					to: order.customerEmail,
					templateId: "orderShipped",
					context: {
						name: getRecipientName(order.shippingAddress),
						orderNumber: order.orderNumber,
					},
				});
			} catch (error) {
				logger.error("Failed to send order shipped email", {
					orderId,
					error,
				});
			}
		}

		if (parsedStatus === "CANCELLED" || parsedStatus === "REFUNDED") {
			// Items went back on the shelf — the cached product and category
			// pages are still advertising the old (lower) stock.
			const pages = await getStorePagesForOrder(orderId);
			revalidatePath("/");
			for (const slug of pages.productSlugs) {
				revalidatePath(`/products/${slug}`);
			}
			for (const slug of pages.categorySlugs) {
				revalidatePath(`/categories/${slug}`);
			}
		}

		revalidatePath("/admin/orders");
		revalidatePath("/admin/overview");
		revalidatePath("/orders");
		return { success: true, message: "Order status updated." };
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t update the order.",
			),
		};
	}
}

export async function markCashReceivedAction(
	orderId: string,
): Promise<AdminActionResult> {
	try {
		const session = await requireAdmin();
		await markCashOnDeliveryPaid(orderId, session.user.id);
		revalidatePath("/admin/orders");
		revalidatePath("/admin/transactions");
		return { success: true, message: "Cash marked as received." };
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t update the payment.",
			),
		};
	}
}

const categorySchema = z.object({
	name: z.string().trim().min(2),
	slug: z
		.string()
		.trim()
		.min(2)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	description: z.string().trim().optional(),
	imageUrl: z.string().trim().url().optional().or(z.literal("")),
	isActive: z.boolean(),
	sortOrder: z.number().int(),
});

export async function saveStoreCategoryAction(
	values: z.infer<typeof categorySchema>,
	categoryId?: string,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const input = categorySchema.parse(values);
		const previous = categoryId
			? await getStoreCategoryById(categoryId)
			: null;
		const saved = categoryId
			? await updateStoreCategory(categoryId, {
					...input,
					// An emptied field must actually clear the stored banner.
					// `undefined` would tell Prisma "leave unchanged".
					imageUrl: input.imageUrl ? input.imageUrl : null,
				})
			: await createStoreCategory({
					...input,
					imageUrl: input.imageUrl || undefined,
				});
		revalidatePath("/");
		if (previous && previous.slug !== saved.slug) {
			revalidatePath(`/categories/${previous.slug}`);
		}
		revalidatePath(`/categories/${saved.slug}`);
		revalidatePath("/admin/categories");
		revalidatePath("/admin/products");
		revalidatePath("/admin/overview");
		await revalidateStorefrontMenu();
		return {
			success: true,
			message: categoryId ? "Department updated." : "Department created.",
			id: saved.id,
		};
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t save the category.",
			),
		};
	}
}

/**
 * Moves several orders to the same status in one go.
 *
 * Each order goes through `updateStoreOrderStatus` individually rather than a
 * single `updateMany`, because that function also writes the status event and
 * sends the customer their email. A bulk update that skipped those would leave
 * the order history lying about what happened.
 *
 * One failure does not stop the rest: a bulk action on twenty orders where the
 * third is already cancelled should still move the other nineteen. The result
 * says how many moved and names the first thing that went wrong.
 */
/** The storefront surfaces a department in the nav, on `/shop` and on its own page. */
async function revalidateStorefrontForCategory(slug: string) {
	revalidatePath("/");
	revalidatePath("/shop");
	revalidatePath(`/categories/${slug}`);
	revalidatePath("/admin/categories");
	revalidatePath("/admin/products");
	await revalidateStorefrontMenu();
}

export async function deleteStoreCategoryAction(
	categoryId: string,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const result = await deleteStoreCategory(categoryId);

		if (result.status === "not-found") {
			return {
				success: false,
				message: "That department no longer exists.",
			};
		}

		if (result.status === "has-products") {
			// Every product must belong to a department, so this is a refusal
			// rather than a cascade that would orphan the catalogue.
			return {
				success: false,
				message: `It still holds ${result.productCount} ${
					result.productCount === 1 ? "product" : "products"
				}. Move them to another department first, or hide this one instead.`,
			};
		}

		await revalidateStorefrontForCategory(result.category.slug);

		return {
			success: true,
			message: `${result.category.name} deleted.`,
		};
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t delete the department.",
			),
		};
	}
}

export async function setStoreCategoryActiveAction(
	categoryId: string,
	isActive: boolean,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const saved = await setStoreCategoryActive(
			categoryId,
			z.boolean().parse(isActive),
		);
		await revalidateStorefrontForCategory(saved.slug);
		return {
			success: true,
			message: isActive
				? `${saved.name} is visible to customers.`
				: `${saved.name} is hidden from customers.`,
		};
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t change that department’s visibility.",
			),
		};
	}
}

export async function reorderStoreCategoriesAction(
	categoryIds: string[],
): Promise<AdminActionResult> {
	try {
		await requireAdmin();
		const ids = z.array(z.string().min(1)).min(1).parse(categoryIds);
		await reorderStoreCategories(ids);
		revalidatePath("/");
		revalidatePath("/shop");
		revalidatePath("/admin/categories");
		await revalidateStorefrontMenu();
		return { success: true, message: "Order saved." };
	} catch (error) {
		return {
			success: false,
			message: toAdminErrorMessage(
				error,
				"We couldn’t save the new order.",
			),
		};
	}
}

export async function bulkUpdateStoreOrderStatusAction(
	orderIds: string[],
	status: Parameters<typeof updateStoreOrderStatusAction>[1],
): Promise<AdminActionResult & { updated: number; failed: number }> {
	try {
		await requireAdmin();
	} catch {
		return {
			success: false,
			message: "You do not have permission to perform this action.",
			updated: 0,
			failed: orderIds.length,
		};
	}

	let updated = 0;
	let firstError: string | undefined;

	for (const orderId of orderIds) {
		const result = await updateStoreOrderStatusAction(orderId, status);

		if (result.success) {
			updated += 1;
		} else {
			firstError ??= result.message;
		}
	}

	const failed = orderIds.length - updated;

	return {
		success: updated > 0,
		updated,
		failed,
		message: failed
			? `${updated} of ${orderIds.length} updated. ${firstError ?? "Some orders could not be changed."}`
			: `${updated} ${updated === 1 ? "order" : "orders"} updated.`,
	};
}
