# GeoStore end-to-end QA report

Full pass over the buyer journey, the admin catalogue/fulfilment journey, and
analytics. Every defect below was reproduced first, then fixed, then re-verified.

**Environment.** SaaS dev server on `http://localhost:3210` (`NEXT_PUBLIC_SAAS_URL`
matched to it, or Better Auth rejects the origin), Postgres in `geostore-postgres`,
MinIO in `geostore-minio`, `STORE_PAYMENT_PROVIDER=mock`, `MAIL_PROVIDER=console`.
Ports 3000/3001 belong to an unrelated project and were left alone.

**Final state**

| Gate | Result |
|---|---|
| `pnpm type-check` | 12/12 packages |
| `pnpm lint` (Biome) | clean, 468 files |
| `pnpm test:unit` | 3 pass / 0 fail |
| Playwright E2E | **16/16**, green on two consecutive runs |
| `pnpm --filter saas build` | succeeds |

---

## A. Correctness / data-integrity bugs

### A1. Checkout had no idempotency — a retry charged and restocked twice
A resubmitted checkout (flaky connection, second tab, double-click beating the
disabled state) created a second order and decremented stock again.

*Fix:* added a unique, nullable `idempotencyKey` to `Order`; the checkout form
mints one per attempt and rotates it only after an outright failure, and both
`createMockStoreOrder` / `createPendingStoreOrder` return the existing order when
the key repeats.
`schema.prisma`, `queries/commerce.ts`, `actions/checkout.ts`, `CheckoutForm.tsx`

*Verified:* a duplicate submit decremented stock by 2 (not 4), returned the same
order, and produced one row. Orders without a key stayed distinct.

### A2. A failed webhook handler dropped the provider's retry
The event was marked processed before handling. If handling then threw, the
retry was discarded as a duplicate — leaving a **charged customer on an unpaid
order**.

*Fix:* claim-then-release. The claim is deleted when handling throws, so the
retry is processed.
`app/api/webhooks/reevit/route.ts`, `releaseWebhookEvent` in `queries/commerce.ts`

*Verified:* `{firstIsDuplicate: false, concurrentDeliveryBlocked: true, retryProcessedAfterFailure: true}`

### A3. Cart additions were silently thrown away before hydration
Tapping "Add to bag" before the hydration effect ran was discarded when the
stored cart replaced state — the button said "Added to bag" and the bag stayed
empty. Found by a failing E2E assertion, not by reading.

*Fix:* fold pending additions into the stored cart instead of overwriting, keyed
on product **and** variant; disable the button until hydrated.
`CartProvider.tsx`, `AddToCartButton.tsx`

### A4. Unpaid orders displayed a green "Confirmed" badge
`PENDING` fell through to `confirmed`, and `paymentStatus`/`paymentMethod` were
hardcoded literals. A customer who abandoned a mobile-money prompt saw an order
they had never paid for marked confirmed.

*Fix:* real status/payment mapping plus "Awaiting payment" and "Refunded" badges.
`customer-orders.ts`, `order.ts`, `OrderHistory.tsx`

### A5. Cancelled-but-paid orders still counted as revenue
*Fix:* `REALISED_REVENUE_WHERE` excludes `CANCELLED`/`REFUNDED`.
*Verified:* +53500 on payment, back to the exact baseline after cancelling (delta 0).

### A6. Payment success rate was divided by *all* orders
Cash-on-delivery and still-pending checkouts sat in the denominator, so a healthy
store looked like it was declining half its cards.
*Fix:* `succeededPaymentCount / attemptedPaymentCount`, with an em-dash when there
are no online payments yet. `admin/analytics/page.tsx`

### A7. `topProducts` was keyed by product name
Two products sharing a name collided. *Fix:* carries `productId`.

---

## B. Bugs found in this final sweep

### B1. No confirmation email for mock or cash-on-delivery orders
Only the Reevit webhook sent `orderConfirmation`, and **COD never produces a
webhook**. So a COD customer never received an email in any environment — and a
*guest* had no route back to their order at all, while the empty order-history
state tells them verbatim to "use the confirmation link we emailed you".

*Fix:* both paths now send the confirmation, including a tokenised order link.
`actions/checkout.ts`

*Verified* in the server log — the emitted token matched the URL the browser
actually loaded:
`http://localhost:3210/checkout/success?order=GST-…&t=f-Vk0Xq1…`

Two things this fix exposed, also corrected:
- The template said "Total paid" for COD orders → now "Pay GH₵ X in cash when it arrives."
- My first draft called `getBaseUrl()` with no argument, which falls back to
  `localhost` — it would have emailed guests an unreachable link. Now passes
  `NEXT_PUBLIC_SAAS_URL`, matching the rest of the SaaS app.

### B2. A mail failure could undo a correct database write
`sendEmail` renders its template *outside* its own try block, so a bad context
throws out of it. In the webhook that escaped into the catch, released the event
claim, and re-ran the payment handler on retry.
*Fix:* a `notifyCustomer` wrapper that logs and swallows. The ledger is
authoritative; the receipt is a side effect. `app/api/webhooks/reevit/route.ts`

### B3. A mail failure reported a committed status change as failed
Same root cause. An admin marking an order `OUT_FOR_DELIVERY` during a mail
outage saw "We couldn't update the order" about a change that *had* saved —
inviting a retry that writes a duplicate status note.
*Fix:* the notification is wrapped and logged. `admin/actions/commerce.ts:262`

### B4. Validation errors on array fields rendered the literal word `undefined`
Submitting a disallowed image host correctly blocked the write, but the only
feedback an admin got was the word **`undefined`** under the field.

`FormMessage` did `String(error?.message)`. For an array field, zodResolver puts
the issue at `imageUrls.0`, so the field error is a sparse *array* whose own
`.message` is `undefined`. The message the schema defines could never be shown —
latent for every array field, including `variants`.

*Fix:* `getFirstErrorMessage` walks into arrays and nested objects for the first
real message, falling back to `children` so an `aria-invalid` field is never left
unexplained. `packages/ui/components/form.tsx`

---

## C. Security / privacy

### C1. Typed passwords were written into the URL
Before hydration a submit is a native one; with no `method` the browser defaults
to **GET** and serialises the password into the URL, the address bar, and session
history. *Fix:* `method="post"` on login, signup, and reset forms.

### C2. Guest-order PII readable by guessing an order number
*Fix:* HMAC access token bound to the order id, required for unauthenticated reads.
*Verified over HTTP:* no token → email absent; wrong token → absent; valid token →
present; `/checkout/pay` 404s without one.

### C3. Raw Prisma/Zod messages leaked to end users
Constraint names, column names, and server paths reached customer- and
admin-facing toasts. *Fix:* `StoreOperationError` marks messages written *for*
humans; everything else is logged server-side and replaced with a safe fallback,
with `P2002`/`P2025` mapped to plain language.

---

## D. Consistency / copy

- **D1.** Delivery-fee rule was triplicated with a zero-subtotal mismatch → single
  `calculateDeliveryFeeInPesewas` in `@repo/utils`.
- **D2.** `next.config.ts` `remotePatterns` could drift from the host list the
  product form validates against; `next/image` **throws during render** on an
  unconfigured host, so one bad URL 500s a whole page. Both now derive from
  `ALLOWED_IMAGE_HOSTS`.
- **D3.** Banner said "Free delivery **over** GH₵ 1,000"; the threshold is
  inclusive → "from GH₵ 1,000".
- **D4.** A failed payment offered "Try checkout again" against an already-cleared
  cart → now "Back to your bag".
- **D5.** Review composer silently discarded reviews with no order item while
  flashing a success badge → now blocks and explains.

---

## E. Test-suite defects (not product faults)

These made the suite untrustworthy rather than the product wrong. Both were
found by running the suite **twice in a row** — something that had not been done.

- **E1.** `admin-qa.spec.ts` used a fixed `QA_SUFFIX` ("qa1"), so slug and SKU
  collided on every rerun. The suite only passed against a virgin database.
  Its failure message was in fact the *correct* `P2002` handling from C3.
  → per-run suffix; `QA_SUFFIX` still pins it when wanted.
- **E2.** `commerce.spec.ts` buys a real seeded product every run and never
  restored it. `jbl-charge-5` had been ground down to **0 stock**, at which point
  "Add to bag" is correctly disabled and the purchase test fails for a reason
  unrelated to the code. → the test restores the unit it consumes; stock verified
  stable at 15 across consecutive runs.

Also added `pnpm test:unit` (`tsx --test`) — the two existing unit test files had
no runner wired up.

---

## F. Verified working (no defect)

Cart quantity edit/remove and persistence; quantity clamped to stock even when
localStorage is tampered with; free delivery at the exact GH₵1,000 boundary;
signed-in order history; admin stock edit; category create/edit; **cancellation
restocks inventory and writes exactly one `RETURN` inventory event**; product
creation with a variant; admin analytics and transactions pages; a non-admin
buyer cannot reach `/admin/*`.

---

## G. Open items and limits of this pass

1. **The pending / COD / webhook paths are not reachable through the UI in this
   environment** (`STORE_PAYMENT_PROVIDER=mock`). A2, B2 and the COD half of B1
   were verified by driving the handlers directly, not by clicking through a real
   Reevit payment. They should be re-checked against a Reevit sandbox before launch.
2. **The mail template was not rendered standalone.** `tsx` cannot transform
   `packages/ui/components/logo.tsx` outside Next's build (`React is not defined`)
   — a harness limitation. The B1 change is type-checked, matches five existing
   templates, and its output was confirmed in the console-provider log, but there
   is no isolated template test.
3. `qa-coverage.spec.ts` shells out to `docker exec geostore-postgres psql`, so it
   is a dev-machine suite and **not CI-portable** as written.
4. A correction worth recording: an earlier comment claimed `/products/[slug]` and
   `/categories/[slug]` were statically cached. The production build shows all
   three storefront routes as `ƒ` (dynamic). The `revalidatePath` calls are still
   right, but for the **client Router Cache**, not for static output — the comment
   has been fixed so it does not mislead the next reader.
