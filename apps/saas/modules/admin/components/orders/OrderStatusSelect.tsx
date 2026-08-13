"use client";

import { updateStoreOrderStatusAction } from "@admin/actions/commerce";
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
}

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);

	async function handleChange(nextStatus: OrderStatus) {
		setIsSaving(true);
		const result = await updateStoreOrderStatusAction(orderId, nextStatus);
		setIsSaving(false);
		result.success
			? toastSuccess("Order status updated")
			: toastError("Order not updated", result.message);
		router.refresh();
	}

	return (
		<select
			defaultValue={status}
			disabled={isSaving}
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
	);
}
