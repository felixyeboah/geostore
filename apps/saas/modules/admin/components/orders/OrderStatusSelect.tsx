"use client";

import {
	markCashReceivedAction,
	updateStoreOrderStatusAction,
} from "@admin/actions/commerce";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ORDER_STATUSES = [
	"PENDING",
	"CONFIRMED",
	"PROCESSING",
	"READY_FOR_DELIVERY",
	"OUT_FOR_DELIVERY",
	"DELIVERED",
	"CANCELLED",
	"REFUNDED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

interface OrderStatusSelectProps {
	orderId: string;
	status: OrderStatus;
	paymentStatus: string;
	paymentMethod: string;
}

export function OrderStatusSelect({
	orderId,
	status,
	paymentStatus,
	paymentMethod,
}: OrderStatusSelectProps) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	// The <select> is uncontrolled, so a rejected or merely-requested change
	// would otherwise leave it displaying a status the order never reached.
	// Bumping this key remounts it back to the server-rendered value.
	const [resetKey, setResetKey] = useState(0);

	const isClosed = status === "CANCELLED" || status === "REFUNDED";

	async function handleChange(nextStatus: OrderStatus) {
		if (nextStatus === "REFUNDED" && paymentStatus !== "PAID") {
			toastError(
				"Order not updated",
				"Only paid orders can be refunded.",
			);
			setResetKey((key) => key + 1);
			return;
		}
		setIsSaving(true);
		const result = await updateStoreOrderStatusAction(orderId, nextStatus);
		setIsSaving(false);

		if (!result.success) {
			toastError("Order not updated", result.message);
		} else if (result.pending) {
			// The refund is only requested; the order moves when Reevit confirms.
			toastSuccess("Refund requested", result.message);
		} else {
			toastSuccess("Order status updated");
		}

		setResetKey((key) => key + 1);
		router.refresh();
	}

	async function handleCashReceived() {
		setIsSaving(true);
		const result = await markCashReceivedAction(orderId);
		setIsSaving(false);
		result.success
			? toastSuccess("Cash received")
			: toastError("Payment not updated", result.message);
		router.refresh();
	}

	return (
		<div className="flex flex-col items-end gap-2">
			<select
				key={`${status}-${resetKey}`}
				defaultValue={status}
				disabled={isSaving || isClosed}
				onChange={(event) =>
					handleChange(event.target.value as OrderStatus)
				}
				aria-label="Order status"
				className="h-9 rounded-lg border bg-background px-2 text-xs"
			>
				{ORDER_STATUSES.map((value) => (
					<option key={value} value={value}>
						{value.toLocaleLowerCase().replaceAll("_", " ")}
					</option>
				))}
			</select>
			{paymentMethod === "CASH_ON_DELIVERY" &&
			paymentStatus !== "PAID" &&
			!isClosed ? (
				<button
					type="button"
					disabled={isSaving}
					onClick={handleCashReceived}
					className="text-primary text-xs"
				>
					Mark cash received
				</button>
			) : null}
		</div>
	);
}
