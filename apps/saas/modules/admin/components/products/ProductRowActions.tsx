"use client";

import {
	updateStoreProductStatusAction,
	updateStoreProductStockAction,
} from "@admin/actions/commerce";
import {
	AdminButton,
	AdminInput,
	AdminSelect,
	adminButtonClass,
} from "@admin/components/ui";
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
			<AdminSelect
				size="sm"
				defaultValue={status}
				disabled={isSavingStatus}
				onValueChange={(next) =>
					handleStatusChange(next as ProductRowActionsProps["status"])
				}
				aria-label="Product status"
				className="w-auto min-w-[116px]"
				options={[
					{ value: "DRAFT", label: "Draft" },
					{ value: "ACTIVE", label: "Active" },
					{ value: "ARCHIVED", label: "Archived" },
				]}
			/>
			<div className="flex items-center gap-1.5">
				<AdminInput
					type="number"
					min="0"
					inputSize="sm"
					value={stock}
					onChange={(event) => setStock(Number(event.target.value))}
					aria-label="Stock quantity"
					className="w-[72px] text-right"
				/>
				<AdminButton
					size="sm"
					disabled={isSavingStock || stock === stockQuantity}
					onClick={handleStockSave}
					aria-label="Save stock"
					className="px-2"
				>
					<SaveIcon className="size-3.5" />
				</AdminButton>
			</div>
			<Link
				href={`/admin/products/${productId}`}
				className={adminButtonClass("ghost", "sm")}
			>
				Edit
			</Link>
		</div>
	);
}
