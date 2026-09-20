"use client";

import { getAdminOrderDetailAction } from "@admin/actions/commerce";
import {
	OrderDetail,
	OrderDetailActions,
	OrderDetailHeader,
} from "@admin/components/orders/OrderDetail";
import type { AdminOrderDetail } from "@admin/lib/order-detail";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { useEffect, useRef, useState } from "react";

/**
 * The order at a glance, without leaving the list. Clicking a row opens this
 * sheet; the order number in its header links out to the full page when the
 * job needs more room than a panel.
 *
 * The table row only carries what a list needs, so the detail is fetched when
 * the sheet opens rather than loaded speculatively for every row on the page.
 */
export function OrderSheet({
	orderId,
	orderNumber,
	onClose,
}: {
	orderId: string | null;
	orderNumber: string | null;
	onClose: () => void;
}) {
	const [order, setOrder] = useState<AdminOrderDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const requestId = useRef(0);

	function load(id: string, { quiet = false } = {}) {
		const request = ++requestId.current;
		if (!quiet) {
			setIsLoading(true);
		}
		setError(null);
		getAdminOrderDetailAction(id)
			.then((result) => {
				if (request !== requestId.current) {
					return;
				}
				if (result.success && result.order) {
					setOrder(result.order);
				} else {
					setError(result.message || "We couldn’t load that order.");
				}
			})
			.catch(() => {
				if (request === requestId.current) {
					setError(
						"The order never reached us — check your connection and try again.",
					);
				}
			})
			.finally(() => {
				if (request === requestId.current) {
					setIsLoading(false);
				}
			});
	}

	useEffect(() => {
		if (!orderId) {
			setOrder(null);
			setError(null);
			return;
		}
		load(orderId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId]);

	return (
		<Sheet
			open={Boolean(orderId)}
			onOpenChange={(next) => {
				if (!next) {
					onClose();
				}
			}}
		>
			{/* `editorial` again — the panel is portalled to <body>, outside the
				admin layout's token scope. */}
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-lg"
			>
				<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
					<SheetTitle className="font-mono font-semibold text-[15px] text-foreground tracking-tight">
						{order?.orderNumber ?? orderNumber ?? "Order"}
					</SheetTitle>
					<SheetDescription className="sr-only">
						Order details
					</SheetDescription>
					{order && <OrderDetailHeader order={order} showFullLink />}
				</SheetHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
					{isLoading && (
						<p className="py-10 text-center text-[13px] text-muted-foreground">
							Loading order…
						</p>
					)}
					{error && !isLoading && (
						<div className="py-10 text-center">
							<p className="text-[13.5px] text-muted-foreground">
								{error}
							</p>
						</div>
					)}
					{order && !isLoading && <OrderDetail order={order} />}
				</div>

				{order && !isLoading && (
					<div className="flex shrink-0 items-center justify-between gap-4 border-border border-t px-6 py-4">
						<OrderDetailActions
							order={order}
							onChanged={() => load(order.id, { quiet: true })}
						/>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
