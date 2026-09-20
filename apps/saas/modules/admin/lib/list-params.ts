import {
	createLoader,
	parseAsInteger,
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
	status: parseAsString,
	payment: parseAsString,
	sort: parseAsStringLiteral(ORDER_SORTS).withDefault("placed"),
	dir: parseAsStringLiteral(SORT_DIRECTIONS).withDefault("desc"),
	page: parseAsInteger.withDefault(1),
};

export const loadOrderListParams = createLoader(orderListParsers);

export type OrderListParams = Awaited<ReturnType<typeof loadOrderListParams>>;
