/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled', 'lastActiveOrganizationId'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: CategoryScalarFieldEnum.schema.ts

export const CategoryScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'description', 'imageUrl', 'isActive', 'sortOrder', 'parentId', 'createdAt', 'updatedAt'])

export type CategoryScalarFieldEnum = z.infer<typeof CategoryScalarFieldEnumSchema>;

// File: CollectionScalarFieldEnum.schema.ts

export const CollectionScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'description', 'imageUrl', 'isActive', 'onLanding', 'sortOrder', 'createdAt', 'updatedAt'])

export type CollectionScalarFieldEnum = z.infer<typeof CollectionScalarFieldEnumSchema>;

// File: ProductCollectionScalarFieldEnum.schema.ts

export const ProductCollectionScalarFieldEnumSchema = z.enum(['productId', 'collectionId', 'sortOrder', 'createdAt'])

export type ProductCollectionScalarFieldEnum = z.infer<typeof ProductCollectionScalarFieldEnumSchema>;

// File: ProductScalarFieldEnum.schema.ts

export const ProductScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'shortDescription', 'description', 'brand', 'sku', 'status', 'priceInPesewas', 'compareAtInPesewas', 'stockQuantity', 'lowStockThreshold', 'isFeatured', 'unitsSold', 'specifications', 'categoryId', 'publishedAt', 'createdAt', 'updatedAt'])

export type ProductScalarFieldEnum = z.infer<typeof ProductScalarFieldEnumSchema>;

// File: ProductImageScalarFieldEnum.schema.ts

export const ProductImageScalarFieldEnumSchema = z.enum(['id', 'productId', 'url', 'alt', 'sortOrder', 'createdAt'])

export type ProductImageScalarFieldEnum = z.infer<typeof ProductImageScalarFieldEnumSchema>;

// File: ProductVariantScalarFieldEnum.schema.ts

export const ProductVariantScalarFieldEnumSchema = z.enum(['id', 'productId', 'name', 'sku', 'attributes', 'priceInPesewas', 'compareAtInPesewas', 'stockQuantity', 'isActive', 'createdAt', 'updatedAt'])

export type ProductVariantScalarFieldEnum = z.infer<typeof ProductVariantScalarFieldEnumSchema>;

// File: AddressScalarFieldEnum.schema.ts

export const AddressScalarFieldEnumSchema = z.enum(['id', 'userId', 'label', 'recipientName', 'phone', 'line1', 'line2', 'city', 'region', 'postalCode', 'countryCode', 'isDefault', 'createdAt', 'updatedAt'])

export type AddressScalarFieldEnum = z.infer<typeof AddressScalarFieldEnumSchema>;

// File: OrderScalarFieldEnum.schema.ts

export const OrderScalarFieldEnumSchema = z.enum(['id', 'orderNumber', 'idempotencyKey', 'userId', 'status', 'paymentStatus', 'paymentMethod', 'currency', 'subtotalInPesewas', 'deliveryInPesewas', 'discountInPesewas', 'totalInPesewas', 'customerEmail', 'customerPhone', 'shippingAddress', 'customerNote', 'placedAt', 'updatedAt'])

export type OrderScalarFieldEnum = z.infer<typeof OrderScalarFieldEnumSchema>;

// File: OrderItemScalarFieldEnum.schema.ts

export const OrderItemScalarFieldEnumSchema = z.enum(['id', 'orderId', 'productId', 'variantId', 'productName', 'variantName', 'sku', 'imageUrl', 'unitPriceInPesewas', 'quantity', 'lineTotalInPesewas'])

export type OrderItemScalarFieldEnum = z.infer<typeof OrderItemScalarFieldEnumSchema>;

// File: ReviewScalarFieldEnum.schema.ts

export const ReviewScalarFieldEnumSchema = z.enum(['id', 'productId', 'userId', 'authorName', 'authorEmail', 'orderItemId', 'rating', 'title', 'body', 'isApproved', 'createdAt', 'updatedAt'])

export type ReviewScalarFieldEnum = z.infer<typeof ReviewScalarFieldEnumSchema>;

// File: StoreTransactionScalarFieldEnum.schema.ts

export const StoreTransactionScalarFieldEnumSchema = z.enum(['id', 'orderId', 'reference', 'provider', 'paymentMethod', 'status', 'amountInPesewas', 'currency', 'providerPaymentId', 'providerPayload', 'processedAt', 'createdAt', 'updatedAt'])

export type StoreTransactionScalarFieldEnum = z.infer<typeof StoreTransactionScalarFieldEnumSchema>;

// File: WebhookEventScalarFieldEnum.schema.ts

export const WebhookEventScalarFieldEnumSchema = z.enum(['id', 'type', 'processedAt', 'payload'])

export type WebhookEventScalarFieldEnum = z.infer<typeof WebhookEventScalarFieldEnumSchema>;

// File: OrderStatusEventScalarFieldEnum.schema.ts

export const OrderStatusEventScalarFieldEnumSchema = z.enum(['id', 'orderId', 'status', 'note', 'actorId', 'createdAt'])

export type OrderStatusEventScalarFieldEnum = z.infer<typeof OrderStatusEventScalarFieldEnumSchema>;

// File: InventoryEventScalarFieldEnum.schema.ts

export const InventoryEventScalarFieldEnumSchema = z.enum(['id', 'productId', 'variantId', 'orderItemId', 'type', 'quantity', 'reason', 'actorId', 'createdAt'])

export type InventoryEventScalarFieldEnum = z.infer<typeof InventoryEventScalarFieldEnumSchema>;

// File: RateLimitScalarFieldEnum.schema.ts

export const RateLimitScalarFieldEnumSchema = z.enum(['id', 'key', 'count', 'lastRequest'])

export type RateLimitScalarFieldEnum = z.infer<typeof RateLimitScalarFieldEnumSchema>;

// File: LandingSectionScalarFieldEnum.schema.ts

export const LandingSectionScalarFieldEnumSchema = z.enum(['id', 'key', 'isVisible', 'sortOrder', 'settings', 'draftIsVisible', 'draftSortOrder', 'draftSettings', 'updatedBy', 'createdAt', 'updatedAt'])

export type LandingSectionScalarFieldEnum = z.infer<typeof LandingSectionScalarFieldEnumSchema>;

// File: LandingSectionRevisionScalarFieldEnum.schema.ts

export const LandingSectionRevisionScalarFieldEnumSchema = z.enum(['id', 'sectionKey', 'isVisible', 'sortOrder', 'settings', 'userId', 'userName', 'createdAt'])

export type LandingSectionRevisionScalarFieldEnum = z.infer<typeof LandingSectionRevisionScalarFieldEnumSchema>;

// File: StorefrontSettingScalarFieldEnum.schema.ts

export const StorefrontSettingScalarFieldEnumSchema = z.enum(['key', 'value', 'draftValue', 'updatedBy', 'createdAt', 'updatedAt'])

export type StorefrontSettingScalarFieldEnum = z.infer<typeof StorefrontSettingScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: ProductStatus.schema.ts

export const ProductStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

// File: OrderStatus.schema.ts

export const OrderStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'])

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// File: StorePaymentStatus.schema.ts

export const StorePaymentStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])

export type StorePaymentStatus = z.infer<typeof StorePaymentStatusSchema>;

// File: StorePaymentMethod.schema.ts

export const StorePaymentMethodSchema = z.enum(['MOCK', 'ONLINE', 'CARD', 'MOBILE_MONEY', 'CASH_ON_DELIVERY'])

export type StorePaymentMethod = z.infer<typeof StorePaymentMethodSchema>;

// File: InventoryEventType.schema.ts

export const InventoryEventTypeSchema = z.enum(['RESTOCK', 'ADJUSTMENT', 'SALE', 'RETURN'])

export type InventoryEventType = z.infer<typeof InventoryEventTypeSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  lastActiveOrganizationId: z.string().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  priceId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: Category.schema.ts

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int(),
  parentId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CategoryType = z.infer<typeof CategorySchema>;


// File: Collection.schema.ts

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  isActive: z.boolean().default(true),
  onLanding: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CollectionType = z.infer<typeof CollectionSchema>;


// File: ProductCollection.schema.ts

export const ProductCollectionSchema = z.object({
  productId: z.string(),
  collectionId: z.string(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
});

export type ProductCollectionType = z.infer<typeof ProductCollectionSchema>;


// File: Product.schema.ts

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullish(),
  description: z.string(),
  brand: z.string(),
  sku: z.string(),
  status: ProductStatusSchema.default("DRAFT"),
  priceInPesewas: z.number().int(),
  compareAtInPesewas: z.number().int().nullish(),
  stockQuantity: z.number().int(),
  lowStockThreshold: z.number().int().default(5),
  isFeatured: z.boolean(),
  unitsSold: z.number().int(),
  specifications: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  categoryId: z.string(),
  publishedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductType = z.infer<typeof ProductSchema>;


// File: ProductImage.schema.ts

export const ProductImageSchema = z.object({
  id: z.string(),
  productId: z.string(),
  url: z.string(),
  alt: z.string(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
});

export type ProductImageType = z.infer<typeof ProductImageSchema>;


// File: ProductVariant.schema.ts

export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  attributes: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  priceInPesewas: z.number().int(),
  compareAtInPesewas: z.number().int().nullish(),
  stockQuantity: z.number().int(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductVariantType = z.infer<typeof ProductVariantSchema>;


// File: Address.schema.ts

export const AddressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string(),
  recipientName: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullish(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string().nullish(),
  countryCode: z.string().default("GH"),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AddressType = z.infer<typeof AddressSchema>;


// File: Order.schema.ts

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  idempotencyKey: z.string().nullish(),
  userId: z.string().nullish(),
  status: OrderStatusSchema.default("PENDING"),
  paymentStatus: StorePaymentStatusSchema.default("PENDING"),
  paymentMethod: StorePaymentMethodSchema,
  currency: z.string().default("GHS"),
  subtotalInPesewas: z.number().int(),
  deliveryInPesewas: z.number().int(),
  discountInPesewas: z.number().int(),
  totalInPesewas: z.number().int(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  shippingAddress: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  customerNote: z.string().nullish(),
  placedAt: z.date(),
  updatedAt: z.date(),
});

export type OrderType = z.infer<typeof OrderSchema>;


// File: OrderItem.schema.ts

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  variantId: z.string().nullish(),
  productName: z.string(),
  variantName: z.string().nullish(),
  sku: z.string(),
  imageUrl: z.string().nullish(),
  unitPriceInPesewas: z.number().int(),
  quantity: z.number().int(),
  lineTotalInPesewas: z.number().int(),
});

export type OrderItemType = z.infer<typeof OrderItemSchema>;


// File: Review.schema.ts

export const ReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string().nullish(),
  authorName: z.string(),
  authorEmail: z.string(),
  orderItemId: z.string(),
  rating: z.number().int(),
  title: z.string().nullish(),
  body: z.string(),
  isApproved: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReviewType = z.infer<typeof ReviewSchema>;


// File: StoreTransaction.schema.ts

export const StoreTransactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  reference: z.string(),
  provider: z.string(),
  paymentMethod: StorePaymentMethodSchema,
  status: StorePaymentStatusSchema.default("PENDING"),
  amountInPesewas: z.number().int(),
  currency: z.string().default("GHS"),
  providerPaymentId: z.string().nullish(),
  providerPayload: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  processedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StoreTransactionType = z.infer<typeof StoreTransactionSchema>;


// File: WebhookEvent.schema.ts

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  processedAt: z.date(),
  payload: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
});

export type WebhookEventType = z.infer<typeof WebhookEventSchema>;


// File: OrderStatusEvent.schema.ts

export const OrderStatusEventSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: OrderStatusSchema,
  note: z.string().nullish(),
  actorId: z.string().nullish(),
  createdAt: z.date(),
});

export type OrderStatusEventType = z.infer<typeof OrderStatusEventSchema>;


// File: InventoryEvent.schema.ts

export const InventoryEventSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullish(),
  orderItemId: z.string().nullish(),
  type: InventoryEventTypeSchema,
  quantity: z.number().int(),
  reason: z.string().nullish(),
  actorId: z.string().nullish(),
  createdAt: z.date(),
});

export type InventoryEventModel = z.infer<typeof InventoryEventSchema>;

// File: RateLimit.schema.ts

export const RateLimitSchema = z.object({
  id: z.string(),
  key: z.string(),
  count: z.number().int(),
  lastRequest: z.bigint(),
});

export type RateLimitType = z.infer<typeof RateLimitSchema>;


// File: LandingSection.schema.ts

export const LandingSectionSchema = z.object({
  id: z.string(),
  key: z.string(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int(),
  settings: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  draftIsVisible: z.boolean().nullish(),
  draftSortOrder: z.number().int().nullish(),
  draftSettings: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  updatedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LandingSectionType = z.infer<typeof LandingSectionSchema>;


// File: LandingSectionRevision.schema.ts

export const LandingSectionRevisionSchema = z.object({
  id: z.string(),
  sectionKey: z.string(),
  isVisible: z.boolean(),
  sortOrder: z.number().int(),
  settings: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  userId: z.string(),
  userName: z.string().nullish(),
  createdAt: z.date(),
});

export type LandingSectionRevisionType = z.infer<typeof LandingSectionRevisionSchema>;


// File: StorefrontSetting.schema.ts

export const StorefrontSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  draftValue: z.string().nullish(),
  updatedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StorefrontSettingType = z.infer<typeof StorefrontSettingSchema>;

