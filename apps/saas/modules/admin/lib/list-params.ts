import {
	createLoader,
	parseAsInteger,
	parseAsNumberLiteral,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";

/**
 * The query strings the admin tables read and write.
 *
 * Filtering, searching, sorting and paging are all done by the database, so
 * the URL is the only place this state lives: the server page parses it with
 * the loaders below and the table's controls write it back with the very same
 * parsers. That keeps a filtered view linkable, survivable across a reload,
 * and impossible to get out of step between the two halves.
 */

export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export const STOCK_STATES = ["OUT", "LOW", "OK"] as const;
export const PRODUCT_SORTS = ["updated", "name", "price", "stock"] as const;

export const ORDER_STATUSES = [
	"PENDING",
	"CONFIRMED",
	"PROCESSING",
	"READY_FOR_DELIVERY",
	"OUT_FOR_DELIVERY",
	"DELIVERED",
	"CANCELLED",
	"REFUNDED",
] as const;

export const PAYMENT_STATUSES = [
	"PAID",
	"PENDING",
	"FAILED",
	"REFUNDED",
] as const;

export const ORDER_SORTS = ["placed", "total", "customer"] as const;

const SORT_DIRECTIONS = ["asc", "desc"] as const;

export const productListParsers = {
	q: parseAsString.withDefault(""),
	status: parseAsStringLiteral(PRODUCT_STATUSES),
	stock: parseAsStringLiteral(STOCK_STATES),
	dept: parseAsString,
	sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault("updated"),
	dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault("desc"),
	page: parseAsInteger.withDefault(1),
};

export const loadProductListParams = createLoader(productListParsers);

export type ProductListParams = Awaited<
	ReturnType<typeof loadProductListParams>
>;

export const orderListParsers = {
	q: parseAsString.withDefault(""),
	status: parseAsStringLiteral(ORDER_STATUSES),
	payment: parseAsStringLiteral(PAYMENT_STATUSES),
	sort: parseAsStringLiteral(ORDER_SORTS).withDefault("placed"),
	dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault("desc"),
	page: parseAsInteger.withDefault(1),
};

export const loadOrderListParams = createLoader(orderListParsers);

export type OrderListParams = Awaited<ReturnType<typeof loadOrderListParams>>;

export const ANALYTICS_RANGES = [7, 30, 90] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const analyticsParsers = {
	days: parseAsNumberLiteral(ANALYTICS_RANGES).withDefault(30),
};

export const loadAnalyticsParams = createLoader(analyticsParsers);

export const PAYMENT_METHODS = [
	"MOCK",
	"ONLINE",
	"CARD",
	"MOBILE_MONEY",
	"CASH_ON_DELIVERY",
	"WHATSAPP",
] as const;

export const TRANSACTION_SORTS = ["created", "amount"] as const;

export const transactionListParsers = {
	q: parseAsString.withDefault(""),
	status: parseAsStringLiteral(PAYMENT_STATUSES),
	method: parseAsStringLiteral(PAYMENT_METHODS),
	sort: parseAsStringLiteral(TRANSACTION_SORTS).withDefault("created"),
	dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault("desc"),
	page: parseAsInteger.withDefault(1),
};

export const loadTransactionListParams = createLoader(transactionListParsers);

export const USER_ROLES = ["admin", "user"] as const;
export const USER_STATUSES = ["active", "banned", "unverified"] as const;
export const USER_SORTS = ["created", "name"] as const;

export const userListParsers = {
	q: parseAsString.withDefault(""),
	role: parseAsStringLiteral(USER_ROLES),
	status: parseAsStringLiteral(USER_STATUSES),
	sort: parseAsStringLiteral(USER_SORTS).withDefault("created"),
	dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault("desc"),
	page: parseAsInteger.withDefault(1),
};

export const loadUserListParams = createLoader(userListParsers);

export const taxonomyListParsers = {
	q: parseAsString.withDefault(""),
	status: parseAsStringLiteral(["visible", "hidden"] as const),
	page: parseAsInteger.withDefault(1),
};
export const loadTaxonomyListParams = createLoader(taxonomyListParsers);
