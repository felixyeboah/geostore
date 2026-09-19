# Geostoresgh Launch-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Geostoresgh from a working mock-checkout demo to a launch-ready Ghana store: real Reevit payments (mobile money + card), webhook-reconciled orders, transactional emails, restocking refunds/cancels, sellable variants, store-only UX, and honest legal/marketing.

**Architecture:** Keep the existing commerce domain (`store_*` tables, admin, storefront). Replace the “create paid mock order in one server action” path with a two-phase checkout: reserve stock and create a `PENDING` order, create a Reevit payment intent in pesewas/`GHS`/`GH`, then mark the order paid only from a signature-verified webhook. SaaS subscription providers (Stripe/Lemon/Polar) stay unused and hidden. Organizations stay in the schema but are turned off for shoppers.

**Tech Stack:** Next.js App Router (`apps/saas`), Prisma/Postgres, `@reevit/cli` + `@reevit/node` + `@reevit/react`, existing `@repo/mail` React Email templates, Playwright.

**Launch bar (what “100% ready” means):**

1. A Ghana customer can pay with mobile money or card and receive a real order confirmation.
2. An unpaid/failed/cancelled/refunded payment never leaves inventory or order state wrong.
3. Admins can fulfil, refund, and restock without touching the database.
4. Marketing, legal, and docs describe this store — not a SaaS starter.
5. Tests cover the happy path and the payment failure/refund paths.

Out of scope for this launch (do not build): wishlist, account-synced cart, rider/dispatch app, regional shipping matrix, marketplace/multi-vendor, live catalogue of 320+ SKUs.

---

## File map

### Payments (new)

| File | Responsibility |
|---|---|
| `packages/payments/provider/reevit/index.ts` | Server-only Reevit client (`REEVIT_API_KEY`, `REEVIT_ORG_ID`) |
| `packages/payments/lib/store-payments.ts` | Create intent, map method, verify webhook signature |
| `packages/database/prisma/schema.prisma` | `WebhookEvent` table; optional `providerPaymentId` on `StoreTransaction` |
| `packages/database/prisma/queries/commerce.ts` | Split mock create into pending + paid + fail + refund/restock |
| `apps/saas/app/api/webhooks/reevit/route.ts` | Raw-body HMAC verify, idempotent event handling |
| `apps/saas/modules/commerce/actions/checkout.ts` | Place pending order + create Reevit intent (or COD) |
| `apps/saas/modules/commerce/components/CheckoutForm.tsx` | Delivery form + payment method + Reevit widget |
| `apps/saas/app/(store)/checkout/pay/page.tsx` | Waiting / pay screen after order is created |
| `.env.local.example` | Reevit env vars |

### Commerce completeness

| File | Responsibility |
|---|---|
| `packages/database/prisma/queries/commerce.ts` | Variant-aware stock; restock on cancel/refund |
| `apps/saas/modules/commerce/components/VariantPicker.tsx` | Colour/storage picker on PDP |
| `apps/saas/modules/admin/components/products/ProductForm.tsx` | Variant editor |
| `apps/saas/modules/admin/components/categories/` | Category CRUD |
| `packages/mail/emails/OrderConfirmation.tsx` | Paid-order email |
| `packages/mail/emails/OrderFailed.tsx` | Failed-payment email |
| `packages/mail/emails/OrderShipped.tsx` | Out-for-delivery email |
| `packages/mail/emails/OrderRefunded.tsx` | Refund email |

### Product polish

| File | Responsibility |
|---|---|
| `packages/auth/config.ts` | Turn organizations off for launch |
| `apps/marketing/modules/shared/messages/marketing.json` | Store FAQ, not SaaS FAQ |
| `apps/marketing/content/legal/*.md` | Real store terms/privacy |
| `apps/docs/content/docs/` | Replace lorem with store docs |
| `apps/saas/tests/commerce.spec.ts` | Real checkout + failure path |
| `README.md` | Launch setup including Reevit |

---

## Payment state machine (lock this)

```
place order
  → Order.status = PENDING
  → Order.paymentStatus = PENDING
  → stock decremented (reserved)
  → StoreTransaction.status = PENDING, provider = "reevit" | "cash"

payment.succeeded
  → paymentStatus = PAID
  → status = CONFIRMED
  → transaction PAID
  → send OrderConfirmation

payment.failed | payment.canceled | unpaid timeout
  → paymentStatus = FAILED
  → status = CANCELLED
  → restock
  → send OrderFailed

admin marks OUT_FOR_DELIVERY
  → send OrderShipped

admin marks REFUNDED (only if PAID)
  → paymentStatus = REFUNDED
  → status = REFUNDED
  → Reevit refund API
  → restock on payment.refunded webhook
  → send OrderRefunded

COD
  → no Reevit intent
  → status = CONFIRMED
  → paymentStatus = PENDING
  → paymentMethod = CASH_ON_DELIVERY
  → admin marks PAID on delivery
```

Never mark an order `PAID` from the browser. The webhook (or an admin COD action) is the source of truth.

Keep `STORE_PAYMENT_PROVIDER=reevit|mock` so Playwright and offline local work stay deterministic. `mock` is the current atomic paid-order path, renamed, not deleted.

---

## Human gate before Task 1

Reevit `init` opens a browser to pair the CLI. An agent cannot complete that unattended.

1. Create a Reevit org at [dashboard.reevit.io](https://dashboard.reevit.io) (docs also mention `dashboard.reevit.com` — use whichever the current signup page uses).
2. Install the CLI: `npm install -g @reevit/cli` or `brew install reevit-platform/tap/reevit`.
3. From **`apps/saas`** (so the CLI sees Next.js App Router + pnpm), run a **dry run first**:

```bash
cd apps/saas
reevit init --goal full --checkout-page - --dry-run
```

4. Then run for real. Do **not** let the wizard write into `modules/commerce/components/CheckoutForm.tsx`. Use standalone checkout (`--checkout-page -`) and our own checkout wiring.

```bash
reevit init --goal full \
  --checkout-page - \
  --webhook-path app/api/webhooks/reevit/route.ts \
  --yes
```

Expected: `@reevit/node` (and possibly `@reevit/react`) installed, `REEVIT_API_KEY`, `REEVIT_ORG_ID`, `REEVIT_WEBHOOK_SECRET`, `NEXT_PUBLIC_REEVIT_CHECKOUT_KEY` written to `apps/saas/.env.local`.

5. Copy those four values into the **repo-root** `.env` (this monorepo loads env from the root). Add them to `.env.local.example` in Task 1. Do not commit secrets.

6. Reevit is BYOK for live money. For production later, connect Paystack and/or Hubtel in the Reevit dashboard and point those PSPs at Reevit’s inbound URLs (`https://api.reevit.io/v1/webhooks/incoming/paystack` and `.../hubtel`). Sandbox/simulator works without a live PSP.

---

### Task 1: Reevit env, client, and signature helper

**Files:**
- Modify: `.env.local.example`
- Create: `packages/payments/provider/reevit/index.ts`
- Create: `packages/payments/lib/store-payments.ts`
- Create: `packages/payments/lib/store-payments.test.ts`
- Modify: `packages/payments/package.json`
- Modify: `packages/payments/index.ts`
- Modify: `packages/payments/provider/index.ts`

- [ ] **Step 1: Add env placeholders to `.env.local.example`**

Append after the existing Payments block:

```bash
# Store payments (Reevit) — Ghana GHS / mobile money + card
STORE_PAYMENT_PROVIDER="reevit"
REEVIT_API_KEY=""
REEVIT_ORG_ID=""
REEVIT_WEBHOOK_SECRET=""
REEVIT_MODE="test"
NEXT_PUBLIC_REEVIT_CHECKOUT_KEY=""
```

- [ ] **Step 2: Add `@reevit/node` to `@repo/payments`**

If `reevit init` already installed it on `apps/saas`, also add it here so server code lives in the payments package:

```bash
pnpm --filter @repo/payments add @reevit/node
```

- [ ] **Step 3: Write the failing signature tests**

Create `packages/payments/lib/store-payments.test.ts`:

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	mapStorePaymentMethod,
	verifyReevitSignature,
} from "./store-payments";

function sign(body: string, secret: string) {
	return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyReevitSignature", () => {
	it("accepts a valid sha256 signature of the raw body", () => {
		const body = '{"id":"evt_1","type":"payment.succeeded"}';
		expect(verifyReevitSignature(body, sign(body, "whsec_test"), "whsec_test")).toBe(
			true,
		);
	});

	it("rejects a tampered body", () => {
		const body = '{"id":"evt_1","type":"payment.succeeded"}';
		expect(
			verifyReevitSignature(
				'{"id":"evt_1","type":"payment.failed"}',
				sign(body, "whsec_test"),
				"whsec_test",
			),
		).toBe(false);
	});

	it("rejects a missing sha256 prefix", () => {
		expect(verifyReevitSignature("{}", "deadbeef", "whsec_test")).toBe(false);
	});
});

describe("mapStorePaymentMethod", () => {
	it("maps store methods to Reevit methods", () => {
		expect(mapStorePaymentMethod("MOBILE_MONEY")).toBe("mobile_money");
		expect(mapStorePaymentMethod("CARD")).toBe("card");
		expect(mapStorePaymentMethod("CASH_ON_DELIVERY")).toBeNull();
		expect(mapStorePaymentMethod("MOCK")).toBeNull();
	});
});
```

- [ ] **Step 4: Run the test and confirm it fails**

```bash
pnpm --filter @repo/payments exec vitest run lib/store-payments.test.ts
```

Expected: FAIL because the module does not exist (or `vitest` is missing — if so add `vitest` as a devDependency of `@repo/payments` and a `"test": "vitest run"` script first).

- [ ] **Step 5: Implement the client and helpers**

`packages/payments/provider/reevit/index.ts`:

```ts
import "server-only";
import Reevit from "@reevit/node";

let client: Reevit | null = null;

export function getReevitClient() {
	const apiKey = process.env.REEVIT_API_KEY;
	const orgId = process.env.REEVIT_ORG_ID;

	if (!apiKey || !orgId) {
		throw new Error("Reevit is not configured. Set REEVIT_API_KEY and REEVIT_ORG_ID.");
	}

	if (!client) {
		client = new Reevit(apiKey, orgId);
	}

	return client;
}
```

If `@reevit/node` exports `{ Reevit }` instead of default, match the installed package. Confirm with:

```bash
node -e "console.log(Object.keys(require('@reevit/node')))"
```

`packages/payments/lib/store-payments.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export type StorePaymentMethod =
	| "MOCK"
	| "CARD"
	| "MOBILE_MONEY"
	| "CASH_ON_DELIVERY";

export function mapStorePaymentMethod(
	method: StorePaymentMethod,
): "mobile_money" | "card" | null {
	if (method === "MOBILE_MONEY") {
		return "mobile_money";
	}
	if (method === "CARD") {
		return "card";
	}
	return null;
}

export function verifyReevitSignature(
	rawBody: string,
	signatureHeader: string,
	secret: string,
): boolean {
	if (!signatureHeader.startsWith("sha256=")) {
		return false;
	}

	const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
	const received = signatureHeader.slice(7);

	if (received.length !== expected.length) {
		return false;
	}

	return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
```

Export from `packages/payments/index.ts`:

```ts
export { getReevitClient } from "./provider/reevit";
export {
	mapStorePaymentMethod,
	verifyReevitSignature,
} from "./lib/store-payments";
```

- [ ] **Step 6: Re-run tests**

```bash
pnpm --filter @repo/payments exec vitest run lib/store-payments.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .env.local.example packages/payments
git commit -m "feat: add Reevit client and webhook signature helpers"
```

---

### Task 2: Pending / paid / fail / refund order queries

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Modify: `packages/database/prisma/queries/commerce.ts`
- Create: `packages/database/prisma/queries/commerce-payments.test.ts` if a test runner exists there; otherwise put unit tests next to a extracted helper in `apps/saas/modules/commerce/lib/order-transitions.ts`

- [ ] **Step 1: Add webhook idempotency to the schema**

In `packages/database/prisma/schema.prisma`, add:

```prisma
model WebhookEvent {
  id          String   @id
  type        String
  processedAt DateTime @default(now())
  payload     Json?

  @@map("store_webhook_event")
}
```

On `StoreTransaction`, add:

```prisma
  providerPaymentId String?
```

And an index:

```prisma
  @@index([providerPaymentId])
```

- [ ] **Step 2: Apply the schema**

```bash
pnpm db:push
```

Expected: Postgres updates without dropping store tables.

- [ ] **Step 3: Extract the shared cart-to-order-items logic already in `createMockStoreOrder`**

In `packages/database/prisma/queries/commerce.ts`, keep `createMockStoreOrder` working (used when `STORE_PAYMENT_PROVIDER=mock`). Add these functions beside it:

```ts
export async function createPendingStoreOrder(
  input: CreateMockStoreOrderInput & {
    paymentMethod: "CARD" | "MOBILE_MONEY" | "CASH_ON_DELIVERY";
  },
) {
  // Same product lookup + stock reservation as createMockStoreOrder.
  // Differences:
  //   status: input.paymentMethod === "CASH_ON_DELIVERY" ? "CONFIRMED" : "PENDING"
  //   paymentStatus: "PENDING"
  //   paymentMethod: input.paymentMethod
  //   transactions.create.status: "PENDING"
  //   transactions.create.provider: input.paymentMethod === "CASH_ON_DELIVERY" ? "cash" : "reevit"
  //   statusEvents.create.status: same as order.status
  // Do NOT set paymentStatus PAID.
}

export async function markStoreOrderPaid(input: {
  orderId: string;
  providerPaymentId: string;
  providerPayload: Prisma.InputJsonValue;
}) {
  return db.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: input.orderId },
      include: { transactions: true },
    });
    if (!order) {
      throw new Error("Order not found.");
    }
    if (order.paymentStatus === "PAID") {
      return order;
    }
    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      throw new Error("Cannot mark a cancelled or refunded order as paid.");
    }

    await transaction.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await transaction.storeTransaction.updateMany({
      where: { orderId: order.id },
      data: {
        status: "PAID",
        providerPaymentId: input.providerPaymentId,
        providerPayload: input.providerPayload,
        processedAt: new Date(),
      },
    });
    await transaction.orderStatusEvent.create({
      data: { orderId: order.id, status: "CONFIRMED", note: "Payment confirmed" },
    });

    return transaction.order.findUniqueOrThrow({ where: { id: order.id } });
  });
}

export async function markStoreOrderPaymentFailed(orderId: string) {
  return db.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new Error("Order not found.");
    }
    if (order.paymentStatus === "PAID") {
      return order;
    }
    if (order.status === "CANCELLED") {
      return order;
    }

    for (const item of order.items) {
      await transaction.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      await transaction.inventoryEvent.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          orderItemId: item.id,
          type: "RETURN",
          quantity: item.quantity,
          reason: `Payment failed for ${order.orderNumber}`,
        },
      });
    }

    await transaction.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
    await transaction.storeTransaction.updateMany({
      where: { orderId },
      data: { status: "FAILED", processedAt: new Date() },
    });
    await transaction.orderStatusEvent.create({
      data: { orderId, status: "CANCELLED", note: "Payment failed" },
    });

    return transaction.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

export async function markStoreOrderRefunded(orderId: string) {
  // Same restock as failed, but:
  //   paymentStatus = REFUNDED
  //   status = REFUNDED
  //   transaction status = REFUNDED
  //   inventoryEvent.reason = `Refund ${orderNumber}`
  // No-op if already REFUNDED.
}

export async function recordWebhookEvent(id: string, type: string, payload: unknown) {
  try {
    await db.webhookEvent.create({
      data: { id, type, payload: payload as Prisma.InputJsonValue },
    });
    return { duplicate: false };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { duplicate: true };
    }
    throw error;
  }
}
```

Copy the product lookup / stock decrement block from `createMockStoreOrder` into `createPendingStoreOrder`. Do not invent a second pricing path.

- [ ] **Step 4: Make cancel/refund restock in `updateStoreOrderStatus`**

Replace `updateStoreOrderStatus` so that moving to `CANCELLED` (when not already paid-and-delivered-complete) or `REFUNDED` calls the same restock loop. Moving to `REFUNDED` also sets `paymentStatus` to `REFUNDED`.

```ts
export async function updateStoreOrderStatus(
  id: string,
  status: OrderStatus,
  actorId: string,
) {
  return db.$transaction(async (transaction) => {
    const current = await transaction.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });

    const shouldRestock =
      (status === "CANCELLED" || status === "REFUNDED") &&
      current.status !== "CANCELLED" &&
      current.status !== "REFUNDED";

    if (shouldRestock) {
      for (const item of current.items) {
        await transaction.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await transaction.inventoryEvent.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            orderItemId: item.id,
            type: "RETURN",
            quantity: item.quantity,
            reason: `${status} ${current.orderNumber}`,
            actorId,
          },
        });
      }
    }

    const order = await transaction.order.update({
      where: { id },
      data: {
        status,
        paymentStatus: status === "REFUNDED" ? "REFUNDED" : undefined,
      },
    });
    await transaction.orderStatusEvent.create({
      data: { orderId: id, status, actorId },
    });
    return order;
  });
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm --filter @repo/database type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/database
git commit -m "feat: add pending, paid, failed, and refunded store order transitions"
```

---

### Task 3: Checkout creates a pending order and a Reevit intent

**Files:**
- Modify: `apps/saas/modules/commerce/actions/checkout.ts`
- Modify: `apps/saas/modules/commerce/components/CheckoutForm.tsx`
- Create: `apps/saas/app/(store)/checkout/pay/page.tsx`
- Modify: `apps/saas/app/(store)/checkout/page.tsx`
- Modify: `apps/saas/app/(store)/checkout/success/page.tsx`
- Modify: `apps/saas/modules/commerce/components/CheckoutSuccess.tsx`
- Modify: `apps/saas/app/(store)/products/[slug]/page.tsx` (remove “mock checkout” copy)
- Modify: `apps/saas/package.json` if `@reevit/react` is needed

- [ ] **Step 1: Replace `placeMockOrderAction` with `placeStoreOrderAction`**

`apps/saas/modules/commerce/actions/checkout.ts` becomes:

```ts
"use server";

import { getSession } from "@auth/lib/server";
import { getReevitClient, mapStorePaymentMethod } from "@repo/payments";
import {
  createMockStoreOrder,
  createPendingStoreOrder,
} from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const placeStoreOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10),
  }),
  address: z.object({
    line1: z.string().trim().min(5),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2),
    region: z.string().trim().min(2),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  customerNote: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["CARD", "MOBILE_MONEY", "CASH_ON_DELIVERY"]),
});

export async function placeStoreOrderAction(
  input: z.infer<typeof placeStoreOrderSchema>,
) {
  const parsedInput = placeStoreOrderSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false as const, message: "Check your delivery details and try again." };
  }

  const session = await getSession();
  const provider = process.env.STORE_PAYMENT_PROVIDER ?? "reevit";

  try {
    if (provider === "mock") {
      const order = await createMockStoreOrder({
        ...parsedInput.data,
        userId: session?.user.id,
      });
      revalidateAdminAndOrders();
      return {
        success: true as const,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          placedAt: order.placedAt.toISOString(),
          next: "success" as const,
        },
      };
    }

    const order = await createPendingStoreOrder({
      ...parsedInput.data,
      userId: session?.user.id,
      paymentMethod: parsedInput.data.paymentMethod,
    });

    if (parsedInput.data.paymentMethod === "CASH_ON_DELIVERY") {
      revalidateAdminAndOrders();
      return {
        success: true as const,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          placedAt: order.placedAt.toISOString(),
          next: "success" as const,
        },
      };
    }

    const reevitMethod = mapStorePaymentMethod(parsedInput.data.paymentMethod);
    if (!reevitMethod) {
      return { success: false as const, message: "Choose a supported payment method." };
    }

    const payment = await getReevitClient().payments.createIntent(
      {
        amount: order.totalInPesewas,
        currency: "GHS",
        method: reevitMethod,
        country: "GH",
        customer_id: session?.user.id ?? order.customerEmail,
        reference: order.orderNumber,
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
        },
      },
      { idempotencyKey: order.id },
    );

    revalidateAdminAndOrders();
    return {
      success: true as const,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        placedAt: order.placedAt.toISOString(),
        next: "pay" as const,
        paymentId: payment.id,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "We couldn’t place the order. Please try again.",
    };
  }
}

function revalidateAdminAndOrders() {
  revalidatePath("/admin/overview");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
```

If the installed `@reevit/node` method names differ (`payments.create` vs `payments.createIntent`), use the installed SDK. The public docs use `createIntent` with `amount` in pesewas, `currency: 'GHS'`, `method: 'mobile_money'`, `country: 'GH'`.

- [ ] **Step 2: Update `CheckoutForm`**

- Default `paymentMethod` to `MOBILE_MONEY`.
- Add a radio group: Mobile money, Card, Cash on delivery.
- Call `placeStoreOrderAction`.
- If `next === "pay"`, `router.push(`/checkout/pay?order=${order.id}&payment=${paymentId}`)`.
- If `next === "success"`, go to `/checkout/success?order=${orderNumber}` as today.
- Delete the localStorage mock-order write (`MOCK_ORDERS_STORAGE_KEY`) from the submit path. Guest history is no longer a fake client list; signed-in users use `/orders`.
- Replace “Secure mock checkout” / “will not charge you” with “Pay with mobile money or card. You are only charged when the payment succeeds.”

- [ ] **Step 3: Add `/checkout/pay`**

Create `apps/saas/app/(store)/checkout/pay/page.tsx`:

- Read `order` and `payment` search params.
- Show order number, amount, and “Complete payment on your phone” for MoMo / card widget for CARD.
- If `reevit init` generated a React checkout component, import it here — do not mount it on the delivery form.
- Poll `GET` via a tiny server action `getStoreOrderPaymentState(orderId)` every 3s until `PAID` (redirect to success) or `FAILED` (show retry + link back to checkout).
- Keep a “I have paid” button that re-reads the order; do not mark paid from this button.

- [ ] **Step 4: Clean mock copy**

Update product detail, checkout metadata, and `CheckoutSuccess` so they no longer say “mock order” when `STORE_PAYMENT_PROVIDER=reevit`.

- [ ] **Step 5: Type-check the SaaS app**

```bash
pnpm --filter saas type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/saas/modules/commerce apps/saas/app/\(store\)/checkout
git commit -m "feat: create pending store orders and Reevit payment intents"
```

---

### Task 4: Signature-verified Reevit webhook

**Files:**
- Create: `apps/saas/app/api/webhooks/reevit/route.ts`
- Create: `apps/saas/app/api/webhooks/reevit/route.test.ts` if a Node test harness is easy; otherwise verify with `reevit doctor`

The catch-all `apps/saas/app/api/[[...rest]]/route.ts` is the oRPC/Hono handler. A static `api/webhooks/reevit/route.ts` wins in the App Router. Do not put Reevit inside Hono.

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  markStoreOrderPaid,
  markStoreOrderPaymentFailed,
  markStoreOrderRefunded,
  recordWebhookEvent,
} from "@repo/database";
import { verifyReevitSignature } from "@repo/payments";
import { sendEmail } from "@repo/mail";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-reevit-signature") ?? "";
  const secret = process.env.REEVIT_WEBHOOK_SECRET;

  if (!secret || !verifyReevitSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    id: string;
    type: string;
    data: {
      id: string;
      metadata?: { order_id?: string };
    };
  };

  const recorded = await recordWebhookEvent(event.id, event.type, event);
  if (recorded.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const orderId = event.data.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (event.type === "payment.succeeded") {
    const order = await markStoreOrderPaid({
      orderId,
      providerPaymentId: event.data.id,
      providerPayload: event,
    });
    await sendEmail({
      to: order.customerEmail,
      templateId: "orderConfirmation",
      context: {
        name: getRecipientName(order.shippingAddress),
        orderNumber: order.orderNumber,
        totalLabel: formatGhs(order.totalInPesewas),
      },
    });
  }

  if (event.type === "payment.failed" || event.type === "payment.canceled") {
    const order = await markStoreOrderPaymentFailed(orderId);
    await sendEmail({
      to: order.customerEmail,
      templateId: "orderFailed",
      context: {
        name: getRecipientName(order.shippingAddress),
        orderNumber: order.orderNumber,
      },
    });
  }

  if (event.type === "payment.refunded") {
    const order = await markStoreOrderRefunded(orderId);
    await sendEmail({
      to: order.customerEmail,
      templateId: "orderRefunded",
      context: {
        name: getRecipientName(order.shippingAddress),
        orderNumber: order.orderNumber,
      },
    });
  }

  return NextResponse.json({ received: true });
}
```

`sendEmail` / templates land in Task 6. Until those templates exist, call `sendEmail` with `{ subject, text }` so this task stays independently testable:

```ts
await sendEmail({
  to: order.customerEmail,
  subject: `Geostoresgh order ${order.orderNumber}`,
  text: `Your payment was received. Order ${order.orderNumber}.`,
});
```

Swap to templates in Task 6.

- [ ] **Step 2: Start the SaaS app and verify signatures**

```bash
pnpm --filter saas dev
# other terminal, from apps/saas
reevit listen --forward-to http://localhost:3000/api/webhooks/reevit
# other terminal
reevit doctor --webhook-url http://localhost:3000/api/webhooks/reevit
```

Expected: doctor accepts a correctly signed `payment.succeeded` and rejects a tampered body (401).

- [ ] **Step 3: Fire real sandbox outcomes**

```bash
reevit trigger payment.succeeded
reevit trigger payment.failed
```

Expected: `reevit listen` forwards signed events; orders in the DB move to `PAID`/`CONFIRMED` or `FAILED`/`CANCELLED` and stock restocks on failure.

- [ ] **Step 4: Commit**

```bash
git add apps/saas/app/api/webhooks
git commit -m "feat: verify Reevit webhooks and reconcile store orders"
```

---

### Task 5: Admin refunds go through Reevit

**Files:**
- Modify: `apps/saas/modules/admin/actions/commerce.ts`
- Modify: `apps/saas/modules/admin/components/orders/OrderStatusSelect.tsx`
- Modify: `apps/saas/app/(authenticated)/(main)/(account)/admin/orders/page.tsx`

- [ ] **Step 1: When an admin chooses `REFUNDED` on a PAID Reevit order, call Reevit first**

In `updateStoreOrderStatusAction`:

```ts
if (status === "REFUNDED") {
  const order = await getAdminStoreOrder(orderId); // add this query if missing
  if (order.paymentMethod !== "CASH_ON_DELIVERY" && order.paymentStatus === "PAID") {
    const paymentId = order.transactions[0]?.providerPaymentId;
    if (!paymentId) {
      return { success: false, message: "No Reevit payment id on this order." };
    }
    await getReevitClient().payments.refund(paymentId, {
      amount: order.totalInPesewas,
      reason: "Requested by Geostoresgh admin",
    });
    // Do not restock here. Wait for payment.refunded.
    return { success: true, message: "Refund requested. Stock updates when Reevit confirms." };
  }
}
await updateStoreOrderStatus(orderId, status, session.user.id);
```

If the SDK refund method name differs, use the installed client. Do not invent a second refund path.

- [ ] **Step 2: Disable illegal status jumps in the select**

- Cannot refund an unpaid order.
- Cannot move `REFUNDED` or `CANCELLED` back to `PROCESSING`.
- COD can be marked `PAID` via a dedicated “Mark cash received” action that only sets `paymentStatus`.

- [ ] **Step 3: Commit**

```bash
git add apps/saas/modules/admin
git commit -m "feat: refund paid Reevit orders from admin"
```

---

### Task 6: Order emails

**Files:**
- Create: `packages/mail/emails/OrderConfirmation.tsx`
- Create: `packages/mail/emails/OrderFailed.tsx`
- Create: `packages/mail/emails/OrderShipped.tsx`
- Create: `packages/mail/emails/OrderRefunded.tsx`
- Modify: `packages/mail/emails/index.ts`
- Modify: `packages/mail/messages/mail.json`
- Modify: webhook route + `updateStoreOrderStatus` (send shipped mail on `OUT_FOR_DELIVERY`)

Copy the structure of `packages/mail/emails/NewUser.tsx` (Wrapper + PrimaryButton). Each template takes `{ name, orderNumber, totalLabel? }`.

- [ ] **Step 1: Add translation subjects in `packages/mail/messages/mail.json`**

```json
"orderConfirmation": { "subject": "Your Geostoresgh order {{orderNumber}} is confirmed" },
"orderFailed": { "subject": "We could not complete payment for {{orderNumber}}" },
"orderShipped": { "subject": "Your Geostoresgh order {{orderNumber}} is on the way" },
"orderRefunded": { "subject": "Refund issued for Geostoresgh order {{orderNumber}}" }
```

If the mail renderer does not interpolate `{{orderNumber}}`, put the number in the template body and use a static subject: `"Your Geostoresgh order is confirmed"`.

- [ ] **Step 2: Register templates in `packages/mail/emails/index.ts`**

```ts
import { OrderConfirmation } from "./OrderConfirmation";
import { OrderFailed } from "./OrderFailed";
import { OrderShipped } from "./OrderShipped";
import { OrderRefunded } from "./OrderRefunded";

export const mailTemplates = {
  magicLink: MagicLink,
  forgotPassword: ForgotPassword,
  newUser: NewUser,
  organizationInvitation: OrganizationInvitation,
  emailVerification: EmailVerification,
  orderConfirmation: OrderConfirmation,
  orderFailed: OrderFailed,
  orderShipped: OrderShipped,
  orderRefunded: OrderRefunded,
} as const;
```

- [ ] **Step 3: Preview**

```bash
pnpm --filter mail-preview dev
```

Expected: all four new templates render.

- [ ] **Step 4: Wire `OUT_FOR_DELIVERY` to `orderShipped` in `updateStoreOrderStatusAction`.**

- [ ] **Step 5: Commit**

```bash
git add packages/mail apps/saas/app/api/webhooks apps/saas/modules/admin
git commit -m "feat: send store order confirmation, failure, shipped, and refund emails"
```

---

### Task 7: Variants on PDP, cart, checkout, and admin

**Files:**
- Modify: `packages/api/modules/commerce/types.ts`
- Modify: `packages/database/prisma/queries/commerce.ts`
- Modify: `apps/saas/modules/commerce/lib/live-catalog.ts`
- Modify: `apps/saas/modules/commerce/types.ts`
- Modify: `apps/saas/modules/commerce/components/CartProvider.tsx`
- Create: `apps/saas/modules/commerce/components/VariantPicker.tsx`
- Modify: `apps/saas/app/(store)/products/[slug]/page.tsx`
- Modify: `apps/saas/modules/admin/components/products/ProductForm.tsx`
- Modify: `tooling/scripts/src/seed-store.ts` so iPhone 15 Pro seeds 128/256 GB variants

Rules:

- Cart line key is `${productId}:${variantId ?? "default"}`.
- Stock and price come from the variant when present, otherwise the product.
- `createPendingStoreOrder` decrements `ProductVariant.stockQuantity` when `variantId` is set.
- Restock increments the same row.
- Admin product form gets a repeating “Variants” list: name, sku, price, stock, attributes JSON (`{ "Storage": "256 GB" }`).
- Seed at least one product with two variants so the UI is testable.

- [ ] **Step 1: Extend `productFormSchema` with**

```ts
variants: z
  .array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1),
      sku: z.string().trim().min(3),
      priceInPesewas: z.number().int().min(1),
      stockQuantity: z.number().int().min(0),
      attributes: z.record(z.string(), z.string()),
      isActive: z.boolean(),
    }),
  )
  .default([]),
```

- [ ] **Step 2: Persist variants in `createStoreProduct` / `updateStoreProduct` (delete missing, upsert remaining).**

- [ ] **Step 3: Surface `variants` from `getLiveProducts` / product-by-slug.**

- [ ] **Step 4: VariantPicker + cart line + checkout item include `variantId`.**

- [ ] **Step 5: Seed iPhone 15 Pro variants and run**

```bash
pnpm db:seed
```

- [ ] **Step 6: Commit**

```bash
git add packages/api/modules/commerce packages/database apps/saas/modules/commerce apps/saas/app/\(store\)/products tooling/scripts
git commit -m "feat: sell product variants with their own price and stock"
```

---

### Task 8: Category admin

**Files:**
- Create: `apps/saas/app/(authenticated)/(main)/(account)/admin/categories/page.tsx`
- Create: `apps/saas/modules/admin/components/categories/CategoryForm.tsx`
- Modify: `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`
- Modify: `packages/database/prisma/queries/commerce.ts` (`createStoreCategory`, `updateStoreCategory`)

Fields: name, slug, description, imageUrl, isActive, sortOrder. Reuse the product image upload URL helper for category images if cheap; otherwise a URL field is enough for launch.

- [ ] **Step 1: Add queries and admin actions (admin role required, same as products).**
- [ ] **Step 2: Add “Categories” to the admin menu.**
- [ ] **Step 3: Commit**

```bash
git add apps/saas/app/\(authenticated\) packages/database/prisma/queries/commerce.ts apps/saas/modules/admin
git commit -m "feat: let admins manage store categories"
```

---

### Task 9: Hide SaaS leftovers for a single store

**Files:**
- Modify: `packages/auth/config.ts`
- Modify: `apps/saas/app/(authenticated)/(main)/(account)/dashboard/page.tsx`
- Modify: `apps/marketing/modules/home/components/FaqSection.tsx`
- Modify: `apps/marketing/modules/shared/messages/marketing.json`
- Modify: `apps/marketing/modules/home/components/HeroSection.tsx` (search must navigate, not `preventDefault`)
- Modify: `apps/marketing/modules/home/components/NewsletterSection.tsx` (remove or hide until a real list exists)
- Modify: `apps/docs/content/docs/index.mdx`
- Modify: `apps/docs/content/docs/getting-started/overview.mdx`

- [ ] **Step 1: Turn organizations off**

```ts
organizations: {
  enable: false,
  hideOrganization: true,
  enableUsersToCreateOrganizations: false,
  requireOrganization: false,
  forbiddenOrganizationSlugs: [/* keep existing list */],
},
```

- [ ] **Step 2: Dashboard shows orders + account links only. No OrganizationsGrid.**

- [ ] **Step 3: Marketing FAQ becomes store questions**

Replace the four SaaS keys with:

- How do I pay? — Mobile money or card via Reevit, or cash on delivery in Accra.
- Do you deliver outside Accra? — Yes, across Ghana. Timing depends on destination and stock.
- Can I return a device? — Contact support within 48 hours if it arrives damaged, faulty, or different from the listing. Warranty is on the product page.
- Is checkout charging real money? — Yes, once live keys are enabled. Test mode never moves funds.

- [ ] **Step 4: Marketing search submits to `${config.saasUrl}/?q=...`.**

- [ ] **Step 5: Docs overview becomes a short store operator guide** (seed, create admin, Reevit doctor, fulfil an order). Delete lorem.

- [ ] **Step 6: Commit**

```bash
git add packages/auth/config.ts apps/saas/app/\(authenticated\) apps/marketing apps/docs
git commit -m "fix: present Geostoresgh as a store, not a SaaS starter"
```

---

### Task 10: Legal copy that matches the live checkout

**Files:**
- Modify: `apps/saas/app/(store)/legal/[slug]/page.tsx`
- Modify: `apps/marketing/content/legal/privacy-policy.md`
- Modify: `apps/marketing/content/legal/terms.md`

- [ ] **Step 1: Remove “mock checkout / demonstration” sections once Reevit is the default.**
- [ ] **Step 2: State: GHS pricing, Ghana delivery, Reevit processes card and mobile money, no card details stored on Geostoresgh, COD available, 48-hour damaged-item contact, warranty on the product page, `support@geostoresgh.com`.**
- [ ] **Step 3: Marketing legal pages must match the store pages — no “placeholder page” sentences.**
- [ ] **Step 4: Commit**

```bash
git add apps/saas/app/\(store\)/legal apps/marketing/content/legal
git commit -m "docs: publish store terms and privacy for live payments"
```

---

### Task 11: Tests and launch checklist

**Files:**
- Modify: `apps/saas/tests/commerce.spec.ts`
- Create: `apps/saas/tests/payments.spec.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Keep a mock-provider Playwright test**

At the top of the commerce spec, document that CI sets `STORE_PAYMENT_PROVIDER=mock`. Update the button name from `/Place mock order/` to `/Place order/` or `/Pay with mobile money/` depending on the final copy. Keep the JBL Charge 5 journey.

- [ ] **Step 2: Add a payment-failure unit/integration test** that creates a pending order, calls `markStoreOrderPaymentFailed`, and asserts stock is restored.

- [ ] **Step 3: Manual Reevit e2e (not in CI unless keys exist)**

```bash
reevit doctor --e2e --strict --webhook-url http://localhost:3000/api/webhooks/reevit
```

- [ ] **Step 4: Update README**

Replace the “mock payment” paragraph with:

```md
## Payments

Local default is Reevit test mode.

1. `npm i -g @reevit/cli`
2. `cd apps/saas && reevit init --goal full --checkout-page -`
3. Copy `REEVIT_*` and `NEXT_PUBLIC_REEVIT_CHECKOUT_KEY` into the repo-root `.env`
4. `reevit listen --forward-to http://localhost:3000/api/webhooks/reevit`
5. `reevit doctor --webhook-url http://localhost:3000/api/webhooks/reevit`

Set `STORE_PAYMENT_PROVIDER=mock` to skip Reevit in Playwright.

Live launch requires a Reevit live key plus a connected Ghana provider (Paystack or Hubtel) in the Reevit dashboard.
```

- [ ] **Step 5: Run the quality gate**

```bash
pnpm test:commerce
pnpm type-check
pnpm lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/saas/tests README.md CHANGELOG.md
git commit -m "test: cover store checkout and document Reevit launch setup"
```

---

## Live go-live (operator, not code)

Do this after Tasks 1–11, not instead of them.

1. Create live Reevit keys (`pfk_live_…`) in Dashboard → Developers → API keys.
2. Connect Paystack and/or Hubtel. Point those dashboards at Reevit’s inbound webhook URLs.
3. Set production env: `STORE_PAYMENT_PROVIDER=reevit`, `REEVIT_MODE=live`, live API key, org id, webhook secret, checkout key.
4. Set the outbound webhook URL to `https://<saas-domain>/api/webhooks/reevit` (HTTPS only).
5. Send a GH₵1 live test via MoMo, then refund it from admin.
6. Confirm order emails arrive (switch `MAIL_PROVIDER` off `console`).
7. Confirm legal pages no longer mention test/mock checkout.

---

## Suggested implementation order

Payments first (Tasks 1–5), then emails (6), then catalogue (7–8), then product surface (9–10), then proof (11). Each phase is shippable. Do not start variants or marketing cleanup while checkout still marks orders paid in the browser.

## Spec coverage

| Requirement | Task |
|---|---|
| Reevit CLI setup | Human gate + Task 1 |
| GHS / GH / MoMo + card intents | Task 3 |
| Webhook signature + idempotency | Tasks 1, 4 |
| Stock reserved then restocked | Tasks 2, 4, 5 |
| COD | Tasks 2, 3 |
| Admin refund via Reevit | Task 5 |
| Order emails | Task 6 |
| Variants | Task 7 |
| Category admin | Task 8 |
| Strip SaaS leftovers | Task 9 |
| Legal | Task 10 |
| Tests + README | Task 11 |
| Live PSP connection | Live go-live |

## Type consistency

- Store methods stay `CARD | MOBILE_MONEY | CASH_ON_DELIVERY | MOCK`.
- Reevit methods stay `card | mobile_money`.
- Order ids in metadata are `order_id` (internal cuid) and `order_number` (`GST-…`).
- Webhook header is `x-reevit-signature` / `sha256=`.
- Env names are `REEVIT_API_KEY`, `REEVIT_ORG_ID`, `REEVIT_WEBHOOK_SECRET`, `NEXT_PUBLIC_REEVIT_CHECKOUT_KEY`, `STORE_PAYMENT_PROVIDER`.
