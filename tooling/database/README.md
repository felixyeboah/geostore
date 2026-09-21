# Production schema updates

`2026-09-21-product-options.sql` adds five columns required by the current
Prisma schema. It was applied to the named Turso production database on
2026-09-21 in a write transaction after verifying the columns were absent.
Product, image, and order counts were unchanged (38, 152, and 0).
Do not reapply it to a database that already has these columns.

Before deploying application changes, compare the target database's
`sqlite_master` and `PRAGMA table_info` against
`packages/database/prisma/schema.prisma`. Review additive changes explicitly;
never use a reset or accept-data-loss flag as part of a deployment.

## Cloudflare storefront deployment

The deployed app is `apps/marketing`, Worker `geostoresgh`, at
https://geostoresgh.reevitinc.workers.dev. The admin app is separate.

Build from the repository root with the production public origin:

```sh
pnpm exec dotenv -c -- env NEXT_PUBLIC_MARKETING_URL=https://geostoresgh.reevitinc.workers.dev pnpm --filter marketing cf:build
OPEN_NEXT_DEPLOY=true pnpm --filter marketing exec wrangler deploy
```

The direct Wrangler deploy preserves existing remote secrets; do not bulk-upload
local `.dev.vars` or `.env` values into production. Database credentials must
refer to the intended production database, not the local development database.

On 2026-09-21, the previous Worker returned error 1101 for HTML page requests.
Its logs reported a hung request, while the search endpoint still responded.
A fresh build/deployment restored HTML rendering. Live verification then exposed
missing production columns (`condition` and `optionAxis`); the additive upgrade
above fixed catalogue and search queries. The exact internal cause of the old
Worker's rendering hang was not established.

Deployment verification must check response content and Worker logs, not only
HTTP status: a Next.js streaming response can report HTTP 200 even when its
catalogue query fails. Check `/`, `/shop`, a real product URL, `/cart`, `/contact`,
`/api/search?q=iphone`, a no-match search, and referenced static assets. Repeat
page requests to exercise reused Workers. Browser checks remain a separate step.
