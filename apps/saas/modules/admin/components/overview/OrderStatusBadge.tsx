import {
	ORDER_STATUS_LABELS,
	ORDER_STATUS_TONES,
	type OrderStatusKey,
	type StatusTone,
} from "@admin/lib/overview";
import { cn } from "@repo/ui";

const DOT_TONES: Record<StatusTone, string> = {
	neutral: "bg-muted-foreground/60",
	info: "bg-indigo-500",
	warning: "bg-amber-500",
	success: "bg-success",
	danger: "bg-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatusKey }) {
	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-card px-2 py-0.5 font-medium text-xs">
			<span
				aria-hidden="true"
				className={cn(
					"size-1.5 rounded-full",
					DOT_TONES[ORDER_STATUS_TONES[status]],
				)}
			/>
			{ORDER_STATUS_LABELS[status]}
		</span>
	);
}
