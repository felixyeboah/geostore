# Admin and catalog verification — 21 September 2026

Target: `apps/saas` admin, its shared API/database packages, and the connected
`apps/marketing` storefront. Branch: `fix/admin-audit-catalog`, based on
`origin/main` (`cbb4467`). Work took place in the isolated `geostore-admin-audit`
worktree; the original checkout was not modified.

## Changes

- Departments and collections now use database pagination, search, visibility
  filters, deterministic ordering, and bounded page sizes. Reordering works
  across page boundaries; filtered views deliberately disable global reorder.
- Collection membership loads on demand through paginated protected APIs.
  Collections with more than 200 products no longer hit the selected-product
  summary limit. Empty and failed requests retain recovery controls.
- User and organization lists recover from invalid pages. Organization metadata
  can be managed by a site administrator who is not an organization member.
  Membership controls remain role-gated and subscriptions block direct deletion.
- Payment attempts retain their own identities and outcomes. Late captures on
  cancelled orders require reconciliation without reopening fulfillment;
  duplicate-charge refunds affect only their matching attempt. Final refunds,
  failure replays, gross/net totals, and inventory restoration are consistent.
- Webhook completion is recorded after the idempotent database mutation so a
  crash cannot permanently suppress a retry. Notifications follow actual
  transitions. Ambiguous or unresolved payment events remain retryable.
- Homepage product features resolve live published database records instead of
  hardcoded prices, obsolete product cards, or unrelated fallback photographs.
  Missing images have a neutral placeholder. Product photos fit their frames.

## Verification

| Area | Evidence |
| --- | --- |
| Unit checks | 118 passed across commerce, SaaS, and marketing commands |
| Database integration | 40 passed serially through the Prisma HTTP/libSQL adapter against the isolated reset database; the earlier development-database suite also passed |
| Browser/API journeys | All 57 cases passed across the complete sweep and focused reruns; no case remains unexecuted |
| Builds and types | Both production builds and affected package typechecks passed |
| Catalog integrity | 24 products, 8 categories, 4 manual collections, 26 variants, 24 product images; zero orders and zero foreign-key violations in the reset rehearsal |
| Image provenance | All 24 public image downloads matched recorded SHA-256 values; all 24 product pages displayed the image assigned to that exact model |
| Responsive UI | Eleven admin routes inspected at 390px; Products and landing-editor overflow fixed and rechecked at 390px, including the live mobile preview |
| Security review | Independent payment/auth/reset review; findings fixed and payment changes re-reviewed with no remaining blocker |

Browser coverage includes every admin route, product creation/edit/publish/pause/
delete, variant selection and checkout, stock changes, cancellation restocking,
category and collection management, cross-page reorder, list sorting/filtering/
search/pagination, error recovery, user roles/ban/unban/impersonation/deletion,
organization access and billing guards, settings persistence, reporting ranges,
landing publishing, homepage price updates and archived-product removal, and
signed webhook replay/reconciliation cases.

The first remote browser sweep passed 49 of 52 cases; three test/environment
problems were corrected. The clean-catalog sweep passed 54 of 57; its stock-label
selector and premature range reload were corrected, and all affected/dependent
cases then passed. Those were not skipped or treated as application successes.
Payment tests used the mock provider and console mail, not live charges.

Local image optimization briefly timed out on cold requests. Reloads recovered;
the completed image sweep loaded all 24 images and matched each to its model.

## Catalog reset status

**The configured remote development database has not been reset.** Its six
existing orders reference catalog products. Deleting their linked commerce
history is awaiting the user's answer to the explicit reset question.

The reset has been executed and checked on an isolated restored database. It
backs up the affected rows before mutation, clears catalog and linked commerce
history in one transaction, inserts the curated seed, and checks foreign keys.
Accounts, addresses, store settings, and landing content are retained. Original
development landing settings were restored and read back exactly after testing;
the eight revisions created by the test were removed.

The private full SQL backup is at
`~/.local/share/geostore-backups/geostore-dev-before-admin-audit-20260921.sql`.
It is not committed. Production credentials were not used.

See [README catalog maintenance](README.md) for the guarded reset and image
verification commands. Manufacturer sources, image ownership, checksums, and
variant scope are recorded in
[catalogue-sources.json](packages/commerce/catalogue-sources.json).
Prices and stock are development fixtures, not supplier inventory. Family
artwork is not misrepresented as an individual color variant photograph.

## Local evidence

- `/tmp/geostore-admin-audit-e2e-final.log`
- `/tmp/geostore-admin-audit-variant-final.log`
- `/tmp/geostore-admin-audit-ranges-final.log`
- `/tmp/geostore-admin-audit-database-rehearsal-final.log`
- `/tmp/geostore-admin-audit-visual-final/`
- `/tmp/geostore-admin-audit-visual-polish/`
- `/tmp/geostore-admin-audit-payment-rereview.txt`

The branch is committed locally; it has not been pushed, merged, or deployed.
