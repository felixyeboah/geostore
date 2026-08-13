# Geostoresgh

Geostoresgh is a Ghana-focused commerce product for phones, audio, wearables, and home technology. It includes a public storefront, persistent cart, database-backed mock checkout, customer accounts and verified reviews, and a complete administration surface for catalogue, inventory, fulfilment, transactions, users, and analytics.

## Product surfaces

- Storefront: discovery, search, categories, product details, cart, and stock-safe checkout
- Customer account: order history, live fulfilment status, verified delivered-item reviews, profile/security controls, and saved delivery addresses
- Administration: overview, catalogue publishing, product image uploads, inventory adjustments, order fulfilment, payment records, customers, and 30-day sales analytics
- Mock payment: creates a paid transaction and real order/inventory records without collecting payment credentials or moving funds

## Local setup

Requirements: Node.js 20+, pnpm 10+, and Docker.

1. Copy `.env.local.example` to `.env` and set `BETTER_AUTH_SECRET`. The Docker defaults use PostgreSQL on port `55432` and MinIO on port `9000`.
2. Install dependencies with `pnpm install`.
3. Start local services with `pnpm db:up`.
4. Apply the Prisma schema with `pnpm db:push`.
5. Seed the sample catalogue with `pnpm db:seed`.
6. Start the workspace with `pnpm dev`.

The SaaS/store app runs at [http://localhost:3000](http://localhost:3000), the marketing app at [http://localhost:3001](http://localhost:3001), and MinIO’s console at [http://localhost:9001](http://localhost:9001).

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

The mock checkout is deliberately separated from production payment credentials. Replace the mock provider in the order action when a live gateway is ready, and add provider webhook reconciliation before accepting real payments.
