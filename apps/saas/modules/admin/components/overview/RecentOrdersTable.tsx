import {
	formatRelativeTime,
	type OrderStatusKey,
	PAYMENT_METHOD_LABELS,
} from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import type { StoreOverview } from "@repo/database";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import Link from "next/link";
import { CustomerAvatar } from "./CustomerAvatar";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ProductThumb } from "./ProductThumb";
import { EmptyRow, SectionCard, SectionHead } from "./SectionCard";

const VISIBLE_ITEM_THUMBS = 3;

export function RecentOrdersTable({
	orders,
	totalOrders,
	now,
}: {
	orders: StoreOverview["recentOrders"];
	totalOrders: number;
	now: Date;
}) {
	return (
		<SectionCard>
			<SectionHead
				title="Recent orders"
				description="Newest customer activity"
				action={
					<Link
						href="/admin/orders"
						className="shrink-0 border-border border-b pb-px text-[12.5px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
					>
						View all {totalOrders.toLocaleString()} →
					</Link>
				}
			/>
			{orders.length === 0 ? (
				<EmptyRow>
					Orders placed through checkout will appear here.
				</EmptyRow>
			) : (
				<div className="overflow-x-auto">
					<Table className="min-w-[760px]">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-10 bg-muted/40 text-[11px] uppercase tracking-wide">
									Order
								</TableHead>
								<TableHead className="h-10 bg-muted/40 text-[11px] uppercase tracking-wide">
									Customer
								</TableHead>
								<TableHead className="h-10 bg-muted/40 text-[11px] uppercase tracking-wide">
									Items
								</TableHead>
								<TableHead className="h-10 bg-muted/40 text-[11px] uppercase tracking-wide">
									Status
								</TableHead>
								<TableHead className="h-10 bg-muted/40 text-[11px] uppercase tracking-wide">
									Payment
								</TableHead>
								<TableHead className="h-10 bg-muted/40 text-right text-[11px] uppercase tracking-wide">
									Total
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => {
								// Guests have no account, so the email is the only name we have.
								const customerName =
									order.user?.name ?? order.customerEmail;
								const customerDetail = order.user
									? order.customerEmail
									: "Guest checkout";
								const hiddenItems =
									order.items.length - VISIBLE_ITEM_THUMBS;
								return (
									<TableRow key={order.id}>
										<TableCell className="py-3">
											<p className="font-semibold text-[13px] tabular-nums">
												{order.orderNumber}
											</p>
											<p className="mt-0.5 text-muted-foreground text-xs">
												{formatRelativeTime(
													order.placedAt,
													now,
												)}
											</p>
										</TableCell>
										<TableCell className="py-3">
											<div className="flex items-center gap-2.5">
												<CustomerAvatar
													name={customerName}
													avatarUrl={
														order.user?.image
													}
													className="size-7"
												/>
												<div className="min-w-0">
													<p className="truncate font-medium text-[13px]">
														{customerName}
													</p>
													<p className="truncate text-muted-foreground text-xs">
														{customerDetail}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="py-3">
											<div className="flex items-center">
												{order.items
													.slice(
														0,
														VISIBLE_ITEM_THUMBS,
													)
													.map((item, index) => (
														<ProductThumb
															key={item.id}
															name={
																item.productName
															}
															imageUrl={
																item.imageUrl
															}
															tileKey={
																item.productId
															}
															size="sm"
															className={
																index > 0
																	? "-ml-1.5 ring-2 ring-card"
																	: "ring-2 ring-card"
															}
														/>
													))}
												{hiddenItems > 0 && (
													<span className="-ml-1.5 grid size-7 place-items-center rounded-md bg-muted font-semibold text-[10px] text-muted-foreground ring-2 ring-card tabular-nums">
														+{hiddenItems}
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="py-3">
											<OrderStatusBadge
												status={
													order.status as OrderStatusKey
												}
											/>
										</TableCell>
										<TableCell className="whitespace-nowrap py-3 text-muted-foreground text-[13px]">
											{
												PAYMENT_METHOD_LABELS[
													order.paymentMethod
												]
											}
										</TableCell>
										<TableCell className="py-3 text-right font-semibold text-[13px] tabular-nums">
											{formatMoney(order.totalInPesewas)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</SectionCard>
	);
}
