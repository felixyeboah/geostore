export const OVERVIEW_RANGES = [7, 30, 90] as const;
export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

export function parseOverviewRange(value: unknown): OverviewRange {
	const parsed = Number(Array.isArray(value) ? value[0] : value);
	return (OVERVIEW_RANGES as readonly number[]).includes(parsed)
		? (parsed as OverviewRange)
		: 30;
}

/** Fractional change from `previous` to `current`, or null when there is no baseline. */
export function percentChange(
	current: number,
	previous: number,
): number | null {
	if (previous === 0) {
		return null;
	}
	return (current - previous) / previous;
}

export function formatPercentChange(change: number | null): string {
	if (change === null) {
		return "—";
	}
	const percent = Math.abs(change * 100);
	const digits = percent >= 100 ? 0 : 1;
	// U+2212 minus keeps the sign the same width as the plus in tabular figures.
	const sign = change > 0 ? "+" : change < 0 ? "−" : "";
	return `${sign}${percent.toFixed(digits)}%`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
	const elapsed = now.getTime() - date.getTime();
	if (elapsed < MINUTE) {
		return "just now";
	}
	if (elapsed < HOUR) {
		const minutes = Math.floor(elapsed / MINUTE);
		return `${minutes} min ago`;
	}
	if (elapsed < DAY) {
		const hours = Math.floor(elapsed / HOUR);
		return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
	}
	if (elapsed < 7 * DAY) {
		const days = Math.floor(elapsed / DAY);
		return days === 1 ? "yesterday" : `${days} days ago`;
	}
	return new Intl.DateTimeFormat("en-GH", {
		day: "numeric",
		month: "short",
	}).format(date);
}

/** Axis-friendly cedi amount: 0, 900, 1.8k, 12k. */
export function formatCompactCedis(amountInPesewas: number): string {
	const cedis = amountInPesewas / 100;
	if (cedis < 1000) {
		return Math.round(cedis).toString();
	}
	const thousands = cedis / 1000;
	return `${thousands >= 10 ? Math.round(thousands) : Number(thousands.toFixed(1))}k`;
}

export function formatShortDate(isoDate: string): string {
	return new Intl.DateTimeFormat("en-GH", {
		day: "numeric",
		month: "short",
	}).format(new Date(`${isoDate}T00:00:00Z`));
}

export const ORDER_STATUS_LABELS = {
	PENDING: "Pending",
	CONFIRMED: "Confirmed",
	PROCESSING: "Processing",
	READY_FOR_DELIVERY: "Ready for delivery",
	OUT_FOR_DELIVERY: "Out for delivery",
	DELIVERED: "Delivered",
	CANCELLED: "Cancelled",
	REFUNDED: "Refunded",
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABELS;

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

export const ORDER_STATUS_TONES: Record<OrderStatusKey, StatusTone> = {
	PENDING: "neutral",
	CONFIRMED: "info",
	PROCESSING: "warning",
	READY_FOR_DELIVERY: "info",
	OUT_FOR_DELIVERY: "info",
	DELIVERED: "success",
	CANCELLED: "danger",
	REFUNDED: "danger",
};

export const PAYMENT_METHOD_LABELS = {
	MOCK: "Test payment",
	ONLINE: "Paid online",
	CARD: "Card",
	MOBILE_MONEY: "Mobile money",
	CASH_ON_DELIVERY: "Cash on delivery",
	WHATSAPP: "WhatsApp",
} as const;

export function daysOfStockLeft(
	stockQuantity: number,
	unitsPerDay: number,
): number | null {
	if (unitsPerDay <= 0) {
		return null;
	}
	return Math.ceil(stockQuantity / unitsPerDay);
}

export function describeStockVelocity(
	stockQuantity: number,
	unitsPerDay: number,
): string {
	if (unitsPerDay <= 0) {
		return "No sales in this period";
	}
	const perDay = unitsPerDay >= 1 ? Math.round(unitsPerDay) : unitsPerDay;
	const rate =
		unitsPerDay >= 1
			? `Sells ~${perDay} a day`
			: `Sells ~${Math.max(1, Math.round(unitsPerDay * 7))} a week`;
	const daysLeft = daysOfStockLeft(stockQuantity, unitsPerDay);
	if (daysLeft === null || daysLeft > 14) {
		return rate;
	}
	return `${rate} · out in ${daysLeft === 1 ? "1 day" : `${daysLeft} days`}`;
}

/** Two-letter code for a product when it has no image, e.g. "Bo" for Bolga basket. */
export function productInitials(name: string): string {
	const trimmed = name.trim();
	return trimmed
		? trimmed[0].toUpperCase() + (trimmed[1] ?? "").toLowerCase()
		: "?";
}

export const PRODUCT_TILE_CLASSES = [
	"from-[#a9744f] to-[#c9a179]",
	"from-[#1f6f5c] to-[#41a088]",
	"from-[#8a6d3b] to-[#c4ab7b]",
	"from-[#2d4a8a] to-[#5177c6]",
	"from-[#3f3f46] to-[#6d6d78]",
	"from-[#7a5c2e] to-[#b28f57]",
] as const;

/** Stable gradient for a product's placeholder tile so the same item always looks the same. */
export function productTileClass(key: string): string {
	let hash = 0;
	for (const char of key) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return PRODUCT_TILE_CLASSES[hash % PRODUCT_TILE_CLASSES.length];
}
