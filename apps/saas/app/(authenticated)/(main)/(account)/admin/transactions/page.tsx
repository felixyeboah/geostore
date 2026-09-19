import { formatMoney } from "@repo/commerce";
import { getAdminStoreOrders } from "@repo/database";
import { Badge } from "@repo/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { ReceiptTextIcon } from "lucide-react";

export default async function AdminTransactionsPage() {
	const orders = await getAdminStoreOrders();
	const transactions = orders.flatMap((order) =>
		order.transactions.map((transaction) => ({
			...transaction,
			orderNumber: order.orderNumber,
			customerEmail: order.customerEmail,
		})),
	);

	return (
		<div>
			<div>
				<p className="font-semibold text-primary text-sm">Payments</p>
				<h1 className="mt-1 font-semibold text-2xl">Transactions</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					A reconciliable record of mock and future provider payments.
				</p>
			</div>
			{transactions.length === 0 ? (
				<div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl bg-muted/55 p-6 text-center">
					<ReceiptTextIcon className="size-7 text-muted-foreground" />
					<h2 className="mt-4 font-semibold text-xl">
						No transactions yet
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Paid checkouts and refunds will appear here.
					</p>
				</div>
			) : (
				<div className="mt-6 overflow-hidden rounded-2xl border bg-card">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Reference</TableHead>
									<TableHead>Order</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">
										Amount
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((transaction) => (
									<TableRow key={transaction.id}>
										<TableCell>
											<p className="max-w-56 truncate font-mono text-xs">
												{transaction.reference}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												{new Intl.DateTimeFormat(
													"en-GH",
													{
														dateStyle: "medium",
														timeStyle: "short",
													},
												).format(transaction.createdAt)}
											</p>
										</TableCell>
										<TableCell className="font-medium text-sm tabular-nums">
											{transaction.orderNumber}
										</TableCell>
										<TableCell className="text-sm">
											{transaction.customerEmail}
										</TableCell>
										<TableCell className="text-sm capitalize">
											{transaction.provider}
										</TableCell>
										<TableCell>
											<Badge
												status={
													transaction.status ===
													"PAID"
														? "success"
														: "warning"
												}
											>
												{transaction.status.toLocaleLowerCase()}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-semibold tabular-nums">
											{formatMoney(
												transaction.amountInPesewas,
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}
