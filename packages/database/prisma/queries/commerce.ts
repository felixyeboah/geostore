import { randomUUID } from "node:crypto";
import { db } from "../client";
import type {
	OrderStatus,
	Prisma,
	ProductStatus,
	StorePaymentStatus,
} from "../generated/client";

export interface StoreProductFilters {
	query?: string;
	categorySlug?: string;
	brand?: string;
	status?: ProductStatus;
}

export interface SaveStoreProductInput {
	name: string;
	slug: string;
	shortDescription?: string;
	description: string;
	brand: string;
	sku: string;
	status: ProductStatus;
	priceInPesewas: number;
	compareAtInPesewas?: number;
	stockQuantity: number;
	lowStockThreshold: number;
	isFeatured: boolean;
	specifications?: Prisma.InputJsonValue;
	categoryId: string;
	imageUrls: string[];
}

export interface CreateMockStoreOrderInput {
	userId?: string;
	customer: {
		name: string;
		email: string;
		phone: string;
	};
	address: {
		line1: string;
		line2?: string;
		city: string;
		region: string;
	};
	items: Array<{ productId: string; quantity: number }>;
	customerNote?: string;
}

export async function getStoreCategories(options?: {
	includeInactive?: boolean;
}) {
	return db.category.findMany({
		where: options?.includeInactive ? undefined : { isActive: true },
		orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		include: {
			_count: { select: { products: true } },
		},
	});
}

export async function getPublishedStoreProducts(
	filters: StoreProductFilters = {},
) {
	return db.product.findMany({
		where: {
			status: filters.status ?? "ACTIVE",
			category: filters.categorySlug
				? { slug: filters.categorySlug, isActive: true }
				: { isActive: true },
			brand: filters.brand
				? { equals: filters.brand, mode: "insensitive" }
				: undefined,
			OR: filters.query
				? [
						{
							name: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
						{
							brand: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
						{
							shortDescription: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
					]
				: undefined,
		},
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
			reviews: {
				where: { isApproved: true },
				select: { rating: true },
			},
		},
		orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
	});
}

export async function getPublishedStoreProductBySlug(slug: string) {
	return db.product.findFirst({
		where: { slug, status: "ACTIVE", category: { isActive: true } },
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
			reviews: {
				where: { isApproved: true },
				include: {
					user: { select: { name: true, image: true } },
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

export async function getAdminStoreProducts(filters: StoreProductFilters = {}) {
	return db.product.findMany({
		where: {
			status: filters.status,
			category: filters.categorySlug
				? { slug: filters.categorySlug }
				: undefined,
			OR: filters.query
				? [
						{
							name: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
						{
							sku: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
						{
							brand: {
								contains: filters.query,
								mode: "insensitive",
							},
						},
					]
				: undefined,
		},
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" }, take: 1 },
		},
		orderBy: { updatedAt: "desc" },
	});
}

export async function getAdminStoreProductById(id: string) {
	return db.product.findUnique({
		where: { id },
		include: {
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
		},
	});
}

export async function createStoreProduct(input: SaveStoreProductInput) {
	const { imageUrls, ...product } = input;
	return db.product.create({
		data: {
			...product,
			publishedAt: input.status === "ACTIVE" ? new Date() : null,
			images: {
				create: imageUrls.map((url, sortOrder) => ({
					url,
					alt: input.name,
					sortOrder,
				})),
			},
		},
	});
}

export async function updateStoreProduct(
	id: string,
	input: SaveStoreProductInput,
) {
	const { imageUrls, ...product } = input;
	return db.product.update({
		where: { id },
		data: {
			...product,
			publishedAt: input.status === "ACTIVE" ? new Date() : null,
			images: {
				deleteMany: {},
				create: imageUrls.map((url, sortOrder) => ({
					url,
					alt: input.name,
					sortOrder,
				})),
			},
		},
	});
}

export async function updateStoreProductStatus(
	id: string,
	status: ProductStatus,
) {
	return db.product.update({
		where: { id },
		data: {
			status,
			publishedAt: status === "ACTIVE" ? new Date() : null,
		},
	});
}

export async function updateStoreProductStock(
	id: string,
	stockQuantity: number,
	actorId?: string,
) {
	return db.$transaction(async (transaction) => {
		const currentProduct = await transaction.product.findUniqueOrThrow({
			where: { id },
			select: { stockQuantity: true },
		});
		const product = await transaction.product.update({
			where: { id },
			data: { stockQuantity },
		});
		await transaction.inventoryEvent.create({
			data: {
				productId: id,
				type: "ADJUSTMENT",
				quantity: stockQuantity - currentProduct.stockQuantity,
				reason: "Admin set on-hand quantity",
				actorId,
			},
		});
		return product;
	});
}

export async function createMockStoreOrder(input: CreateMockStoreOrderInput) {
	if (input.items.length === 0) {
		throw new Error("An order requires at least one item.");
	}

	return db.$transaction(async (transaction) => {
		const products = await transaction.product.findMany({
			where: {
				id: { in: input.items.map((item) => item.productId) },
				status: "ACTIVE",
			},
			include: {
				images: { orderBy: { sortOrder: "asc" }, take: 1 },
			},
		});
		const productMap = new Map(
			products.map((product) => [product.id, product]),
		);
		const orderItems = input.items.map((item) => {
			const product = productMap.get(item.productId);

			if (!product) {
				throw new Error(
					"A product in your bag is no longer available.",
				);
			}
			if (!Number.isInteger(item.quantity) || item.quantity < 1) {
				throw new Error(`Choose a valid quantity for ${product.name}.`);
			}
			if (product.stockQuantity < item.quantity) {
				throw new Error(`${product.name} no longer has enough stock.`);
			}

			return {
				productId: product.id,
				productName: product.name,
				sku: product.sku,
				imageUrl: product.images[0]?.url,
				unitPriceInPesewas: product.priceInPesewas,
				quantity: item.quantity,
				lineTotalInPesewas: product.priceInPesewas * item.quantity,
			};
		});
		const subtotalInPesewas = orderItems.reduce(
			(total, item) => total + item.lineTotalInPesewas,
			0,
		);
		const deliveryInPesewas = subtotalInPesewas >= 100_000 ? 0 : 3_500;
		const orderNumber = `GST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

		for (const item of orderItems) {
			const updateResult = await transaction.product.updateMany({
				where: {
					id: item.productId,
					stockQuantity: { gte: item.quantity },
				},
				data: { stockQuantity: { decrement: item.quantity } },
			});

			if (updateResult.count !== 1) {
				throw new Error(
					`${item.productName} no longer has enough stock.`,
				);
			}
		}

		const order = await transaction.order.create({
			data: {
				orderNumber,
				userId: input.userId,
				status: "CONFIRMED",
				paymentStatus: "PAID",
				paymentMethod: "MOCK",
				subtotalInPesewas,
				deliveryInPesewas,
				totalInPesewas: subtotalInPesewas + deliveryInPesewas,
				customerEmail: input.customer.email,
				customerPhone: input.customer.phone,
				shippingAddress: {
					...input.address,
					recipientName: input.customer.name,
				},
				customerNote: input.customerNote,
				items: { create: orderItems },
				transactions: {
					create: {
						reference: `MOCK-${randomUUID().toUpperCase()}`,
						provider: "mock",
						paymentMethod: "MOCK",
						status: "PAID",
						amountInPesewas: subtotalInPesewas + deliveryInPesewas,
						processedAt: new Date(),
					},
				},
				statusEvents: {
					create: { status: "CONFIRMED", actorId: input.userId },
				},
			},
			include: { items: true, transactions: true },
		});

		for (const item of order.items) {
			await transaction.inventoryEvent.create({
				data: {
					productId: item.productId,
					orderItemId: item.id,
					type: "SALE",
					quantity: -item.quantity,
					reason: `Mock order ${orderNumber}`,
					actorId: input.userId,
				},
			});
		}

		return order;
	});
}

export async function getAdminStoreOrders(filters?: {
	status?: OrderStatus;
	paymentStatus?: StorePaymentStatus;
}) {
	return db.order.findMany({
		where: filters,
		include: {
			user: { select: { name: true, email: true } },
			items: true,
			transactions: { orderBy: { createdAt: "desc" } },
		},
		orderBy: { placedAt: "desc" },
	});
}

export async function getStoreOrdersByUserId(userId: string) {
	return db.order.findMany({
		where: { userId },
		include: {
			items: {
				include: { review: true },
			},
			transactions: { orderBy: { createdAt: "desc" } },
			statusEvents: { orderBy: { createdAt: "asc" } },
		},
		orderBy: { placedAt: "desc" },
	});
}

export async function createStoreReview(input: {
	userId: string;
	orderItemId: string;
	rating: number;
	title?: string;
	body: string;
}) {
	const orderItem = await db.orderItem.findFirst({
		where: {
			id: input.orderItemId,
			order: { userId: input.userId, status: "DELIVERED" },
		},
		select: { id: true, productId: true },
	});

	if (!orderItem) {
		throw new Error(
			"Only delivered products from your own orders can be reviewed.",
		);
	}

	return db.review.upsert({
		where: { orderItemId: input.orderItemId },
		create: {
			productId: orderItem.productId,
			userId: input.userId,
			orderItemId: orderItem.id,
			rating: input.rating,
			title: input.title,
			body: input.body,
			isApproved: true,
		},
		update: {
			rating: input.rating,
			title: input.title,
			body: input.body,
		},
	});
}

export async function getUserStoreAddresses(userId: string) {
	return db.address.findMany({
		where: { userId },
		orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
	});
}

export interface SaveUserStoreAddressInput {
	id?: string;
	label: string;
	recipientName: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	region: string;
	postalCode?: string;
	isDefault: boolean;
}

export async function saveUserStoreAddress(
	userId: string,
	input: SaveUserStoreAddressInput,
) {
	return db.$transaction(async (transaction) => {
		const addressCount = await transaction.address.count({
			where: { userId },
		});
		const shouldBeDefault = input.isDefault || addressCount === 0;

		if (shouldBeDefault) {
			await transaction.address.updateMany({
				where: { userId },
				data: { isDefault: false },
			});
		}

		const data = {
			label: input.label,
			recipientName: input.recipientName,
			phone: input.phone,
			line1: input.line1,
			line2: input.line2,
			city: input.city,
			region: input.region,
			postalCode: input.postalCode,
			isDefault: shouldBeDefault,
		};

		if (input.id) {
			const address = await transaction.address.findFirst({
				where: { id: input.id, userId },
				select: { id: true },
			});
			if (!address) {
				throw new Error("Address not found.");
			}
			return transaction.address.update({
				where: { id: input.id },
				data,
			});
		}

		return transaction.address.create({ data: { ...data, userId } });
	});
}

export async function deleteUserStoreAddress(userId: string, id: string) {
	return db.$transaction(async (transaction) => {
		const address = await transaction.address.findFirst({
			where: { id, userId },
		});
		if (!address) {
			throw new Error("Address not found.");
		}

		await transaction.address.delete({ where: { id } });
		if (address.isDefault) {
			const nextAddress = await transaction.address.findFirst({
				where: { userId },
				orderBy: { updatedAt: "desc" },
				select: { id: true },
			});
			if (nextAddress) {
				await transaction.address.update({
					where: { id: nextAddress.id },
					data: { isDefault: true },
				});
			}
		}
	});
}

export async function updateStoreOrderStatus(
	id: string,
	status: OrderStatus,
	actorId: string,
) {
	return db.$transaction(async (transaction) => {
		const order = await transaction.order.update({
			where: { id },
			data: { status },
		});
		await transaction.orderStatusEvent.create({
			data: { orderId: id, status, actorId },
		});
		return order;
	});
}

export async function getStoreAdminMetrics() {
	const [
		products,
		activeProducts,
		lowStockProducts,
		orders,
		revenue,
		customers,
	] = await Promise.all([
		db.product.count(),
		db.product.count({ where: { status: "ACTIVE" } }),
		db.product.findMany({
			where: { status: "ACTIVE", stockQuantity: { lte: 5 } },
			select: { id: true, name: true, stockQuantity: true },
			orderBy: { stockQuantity: "asc" },
		}),
		db.order.count(),
		db.order.aggregate({
			where: { paymentStatus: "PAID" },
			_sum: { totalInPesewas: true },
		}),
		db.user.count(),
	]);

	return {
		products,
		activeProducts,
		lowStockProducts,
		orders,
		revenueInPesewas: revenue._sum.totalInPesewas ?? 0,
		customers,
	};
}

export async function getStoreSalesAnalytics(days = 30) {
	const start = new Date();
	start.setUTCHours(0, 0, 0, 0);
	start.setUTCDate(start.getUTCDate() - (days - 1));

	const [orders, statusGroups] = await Promise.all([
		db.order.findMany({
			where: { placedAt: { gte: start } },
			include: { items: true },
			orderBy: { placedAt: "asc" },
		}),
		db.order.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
	]);

	const daily = Array.from({ length: days }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		return {
			date: date.toISOString().slice(0, 10),
			orders: 0,
			revenueInPesewas: 0,
		};
	});
	const dailyByDate = new Map(daily.map((item) => [item.date, item]));
	const productPerformance = new Map<
		string,
		{ name: string; quantity: number; revenueInPesewas: number }
	>();

	for (const order of orders) {
		const date = order.placedAt.toISOString().slice(0, 10);
		const day = dailyByDate.get(date);
		if (day) {
			day.orders += 1;
			if (order.paymentStatus === "PAID") {
				day.revenueInPesewas += order.totalInPesewas;
			}
		}

		if (order.paymentStatus === "PAID") {
			for (const item of order.items) {
				const current = productPerformance.get(item.productId) ?? {
					name: item.productName,
					quantity: 0,
					revenueInPesewas: 0,
				};
				current.quantity += item.quantity;
				current.revenueInPesewas += item.lineTotalInPesewas;
				productPerformance.set(item.productId, current);
			}
		}
	}

	const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
	const revenueInPesewas = paidOrders.reduce(
		(total, order) => total + order.totalInPesewas,
		0,
	);

	return {
		days,
		daily,
		orderCount: orders.length,
		paidOrderCount: paidOrders.length,
		revenueInPesewas,
		averageOrderValueInPesewas:
			paidOrders.length > 0
				? Math.round(revenueInPesewas / paidOrders.length)
				: 0,
		statusBreakdown: statusGroups.map((group) => ({
			status: group.status,
			count: group._count._all,
		})),
		topProducts: [...productPerformance.values()]
			.sort(
				(left, right) => right.revenueInPesewas - left.revenueInPesewas,
			)
			.slice(0, 5),
	};
}
