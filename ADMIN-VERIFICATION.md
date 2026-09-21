# Admin and catalogue verification

Target: `apps/saas`, `http://localhost:3000`, branch `option-media`.

This audit is in progress. The older `QA-REPORT.md` describes a different environment and is not evidence for this run.

## Verified

- Product persistence: six real-database integration tests pass for create/update, variant identity and ownership, optional-field clearing, stock, unpublishing, deletion, and order-reference protection. Fixes committed as `069c396`.
- Product save intent: three unit regressions pass, including respecting Draft on existing products and editing sold-out products. UI changes remain alongside the pre-existing product-form redesign; browser verification is pending.
- Image storage: started the configured Docker MinIO service. Signed PUT and public GET both returned 200; downloaded bytes matched; disposable image removed.
- Commerce regression suite: 81 tests pass.
- Malformed bulk selections: two tests pass; reject non-arrays, blank IDs, duplicate IDs, and batches exceeding 100. Fix committed as `9ea3b74`.
- Order URL filters: three tests pass; invalid status/payment values are discarded before reaching Prisma. Committed as `ac874bc`.
- Organization search debounce, page recovery and translated retry UI committed as `9213a68`; type checking and lint pass, browser verification pending.
- Pagination: five real-database integration tests pass across every supported sort and direction, including tied values and disjoint repeatable pages. Committed as `8742692`.
- Active users: real-database regression passes for null, false and true ban flags. Committed as `aae58c3`.
- Guest order search: real-database regression passes for recipient-name search, server pagination/counts, and literal punctuation/wildcards. Committed as `cc7cd4d`.
- Route protection: all 12 admin entry routes redirect unauthenticated HTTP requests to login (307). This does not prove authenticated rendering.
- Catalogue preparation: 12 individually reviewed model-specific assets with manufacturer provenance and SHA-256 fingerprints. Asset regression checks pass for missing files, replacements, and cross-product duplication; semantic image matching remains a visual review responsibility. No reset or reseed has run.
- Type checks: SaaS, API, and database pass on the changes checked so far.

## Remaining proof

- Complete browser create/edit/variant/pause/delete journey in `apps/saas/tests/product-lifecycle.spec.ts`.
- Browser interactions for overview, products, departments, collections, orders/order details, transactions, users, organizations/details, analytics, landing CMS, and settings.
- Browser pagination, search, sort, filter, page-boundary and empty/error-state behavior; read database rows and responses to confirm server handling.
- Organization search debounce, out-of-range-page recovery, and fetch-error retry UI.
- Product uploads through the authenticated UI, not just storage transport.
- Replacement catalogue: exact model-specific photography, supported variants, accessible images, and correct category/collection links. Inspect base images and option galleries.
- Scoped catalogue reset, reseed, and final database/storefront verification after admin testing.

## Current external dependencies

- Shared browser opens its assigned URL but DOM evaluation fails and navigation/screenshots time out. Localhost responds to direct HTTP requests. A request to reopen the browser panel and leave an admin session ready is pending.
- Reset inventory: 86 products, 6 categories, 4 collections, 6 linked orders, 3 users. Two orders are marked paid. Clarification is pending on whether the six orders should be deleted or preserved; no catalogue deletion has run.

## Commands

```sh
pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/product-lifecycle.integration.test.ts
pnpm exec dotenv -c -- pnpm exec tsx --test packages/database/tests/admin-pagination.integration.test.ts
pnpm exec tsx --test apps/saas/modules/admin/lib/product-save-intent.test.ts apps/saas/modules/admin/lib/list-params.test.ts apps/saas/modules/admin/lib/bulk-action-schema.test.ts
pnpm test:commerce
pnpm --filter saas --filter @repo/api --filter @repo/database type-check
```

The browser suite must be exercised through the available authorized browser runtime; a passing type check is not a substitute.
