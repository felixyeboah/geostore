"use client";

import {
	updateStoreProductStatusAction,
	updateStoreProductStockAction,
} from "@admin/actions/commerce";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductRowActionsProps {
	productId: string;
	status: "DRAFT" | "ACTIVE" | "ARCHIVED";
	stockQuantity: number;
}

export function ProductRowActions({
	productId,
	status,
	stockQuantity,
}: ProductRowActionsProps) {
	const router = useRouter();
	const [stock, setStock] = useState(stockQuantity);
	const [isSavingStock, setIsSavingStock] = useState(false);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	async function handleStatusChange(
		nextStatus: ProductRowActionsProps["status"],
	) {
		setIsSavingStatus(true);
		const result = await updateStoreProductStatusAction(
			productId,
			nextStatus,
		);
		setIsSavingStatus(false);
		result.success
			? toastSuccess("Status updated")
			: toastError("Status not updated", result.message);
		router.refresh();
	}

	async function handleStockSave() {
		setIsSavingStock(true);
		const result = await updateStoreProductStockAction(productId, stock);
		setIsSavingStock(false);
		result.success
			? toastSuccess("Stock updated")
			: toastError("Stock not updated", result.message);
		router.refresh();
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<select
				defaultValue={status}
				disabled={isSavingStatus}
				onChange={(event) =>
					handleStatusChange(
						event.target.value as ProductRowActionsProps["status"],
					)
				}
				aria-label="Product status"
				className="h-9 rounded-lg border bg-background px-2 text-xs"
			>
				<option value="DRAFT">Draft</option>
				<option value="ACTIVE">Active</option>
				<option value="ARCHIVED">Archived</option>
			</select>
			<div className="flex items-center gap-1">
				<Input
					type="number"
					min="0"
					value={stock}
					onChange={(event) => setStock(Number(event.target.value))}
					aria-label="Stock quantity"
					className="h-9 w-20"
				/>
				<Button
					type="button"
					size="icon"
					variant="secondary"
					disabled={isSavingStock || stock === stockQuantity}
					onClick={handleStockSave}
					aria-label="Save stock"
				>
					<SaveIcon className="size-3.5" />
				</Button>
			</div>
			<Button asChild size="sm" variant="ghost">
				<Link href={`/admin/products/${productId}`}>Edit</Link>
			</Button>
		</div>
	);
}
