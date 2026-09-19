# Geostoresgh

Geostoresgh is a Ghana-focused commerce product for phones, audio, wearables, and home technology. It includes a public storefront, persistent cart, database-backed mock checkout, customer accounts and verified reviews, and a complete administration surface for catalogue, inventory, fulfilment, transactions, users, and analytics.

## Product surfaces

- Storefront: discovery, search, categories, product details, cart, and stock-safe checkout
- Customer account: order history, live fulfilment status, verified delivered-item reviews, profile/security controls, and saved delivery addresses
- Administration: overview, catalogue publishing, product image uploads, inventory adjustments, order fulfilment, payment records, customers, and 30-day sales analytics
- Payments: Reevit for mobile money and card, cash on delivery, or a mock provider for local tests

## Local setup

Requirements: Node.js 20+, pnpm 10+, and Docker.

1. Copy `.env.local.example` to `.env` and set `BETTER_AUTH_SECRET` and `ORDER_TOKEN_SECRET` to two different random strings. The Docker defaults use PostgreSQL on port `55432` and MinIO on port `9000`.
2. Install dependencies with `pnpm install`.
3. Start local services with `pnpm db:up`.
4. Apply the Prisma schema with `pnpm db:push`.
5. Seed the sample catalogue with `pnpm db:seed`.
6. Start the workspace with `pnpm dev`.

The storefront runs at [http://localhost:3001](http://localhost:3001) and the account and admin app at [http://localhost:3000](http://localhost:3000). MinIO’s console is at [http://localhost:9001](http://localhost:9001).

`apps/marketing` serves everything a shopper sees: the landing page, the shop,
categories, product pages, the bag and checkout, plus the blog, changelog and
legal pages. `apps/saas` serves everything behind a sign-in: the customer
account, order history, saved addresses and the admin back office. Old
storefront URLs on port 3000 redirect to their new home.

Create a local administrator with:

```bash
pnpm --filter @repo/scripts create:user
```

Choose the admin role when prompted. Never commit the generated password or local `.env` file.

## Quality checks

```bash
pnpm test:commerce
pnpm type-check
pnpm lint
pnpm build
```

## Production configuration

The server refuses to start in production if any of these is wrong, rather than
failing quietly at the first customer request.

| Variable | Why it is required |
| --- | --- |
| `STORE_PAYMENT_PROVIDER` | Must be `reevit`. The `mock` provider marks orders paid without charging, so it is never inferred. |
| `REEVIT_API_KEY`, `REEVIT_ORG_ID`, `REEVIT_WEBHOOK_SECRET` | Required when the provider is `reevit`. |
| `BETTER_AUTH_SECRET` | Signs sessions. |
| `ORDER_TOKEN_SECRET` | Signs guest order links. Must differ from `BETTER_AUTH_SECRET`, so that rotating sessions does not invalidate links already emailed out. |
| `NEXT_PUBLIC_SAAS_URL` | Becomes the trusted auth origin and the host in order emails. |
| `DATABASE_URL` | Database connection. |

Two more are optional but matter behind a proxy:

- `IP_ADDRESS_HEADERS` overrides the header trusted to carry the client IP. It
  defaults to `cf-connecting-ip` in production. Only list a header your proxy is
  known to *overwrite*; a header the client can set is a rate-limit bypass.
- `RATE_LIMIT_ENABLED` forces auth rate limiting on or off. Leave it unset
  outside test runs.

### Rotating the order-link key

Order links are emailed and cannot be recalled, so the key rotates in three
steps rather than one:

1. Set `ORDER_TOKEN_SECRET_PREVIOUS` to the current `ORDER_TOKEN_SECRET`.
2. Set `ORDER_TOKEN_SECRET` to the new value and deploy. Both are accepted; new
   links are signed with the new key.
3. Once the old links have aged out, remove `ORDER_TOKEN_SECRET_PREVIOUS`.

## Payments

Local default can stay on the mock provider so Playwright does not need Reevit keys:

```bash
STORE_PAYMENT_PROVIDER=mock
```

For Reevit test mode:

1. `npm i -g @reevit/cli`
2. `cd apps/saas && reevit init --goal full --checkout-page -`
3. Copy `REEVIT_*` and `NEXT_PUBLIC_REEVIT_CHECKOUT_KEY` into the repo-root `.env`
4. Set `STORE_PAYMENT_PROVIDER=reevit`
5. `reevit listen --forward-to http://localhost:3000/api/webhooks/reevit`
6. `reevit doctor --webhook-url http://localhost:3000/api/webhooks/reevit`

Live launch requires a Reevit live key plus a connected Ghana provider (Paystack or Hubtel) in the Reevit dashboard. The store only marks an order paid after a signature-verified webhook.
