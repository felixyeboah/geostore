# Geostore R2 storage

Account: `dfed33ea3d6cce574a4f6d446d5f1e8b` (the existing storefront Worker account).

- `geostore-products`: public product photography. Reviewed catalogue files are under `catalogue/`.
- `geostore-avatars`: private; the existing authenticated storage flow issues signed reads.
- Development public product URL: `https://pub-3d66529de106425c8c82087a4d8cc710.r2.dev`.

Both local and production applications use the S3-compatible R2 endpoint. No local MinIO is needed for this configuration.

## Credentials and deployment

Create an R2 Object Read & Write API token scoped to these two buckets. Store its Access Key ID and Secret Access Key in `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`. Wrangler's OAuth login is not a substitute for these signing credentials. Never commit the keys.

Use `.env.local.example` for the non-secret values. The root `.env.local` configures local `pnpm dev`; restart the dev servers after changing it. For production, put secrets in the hosting platform's secret manager and supply the same non-secret values at build and runtime. Public image host variables must be available during the Next.js build as well as at runtime.

`NEXT_PUBLIC_PRODUCTS_STORAGE_URL` is the public bucket root, without a bucket-name suffix. Uploads are signed against `S3_ENDPOINT`, while stored image URLs use the public bucket root. Configure a production custom domain on the product bucket and use it for `NEXT_PUBLIC_PRODUCTS_STORAGE_URL` in both environments once available. The r2.dev URL is a development endpoint, not the production delivery configuration.

## CORS

`r2-cors.json` allows local ports 3000/3001 and the current storefront Worker origin. Add the actual production admin origin before deploying its upload flow. Apply and inspect the configuration for both buckets:

```sh
export CLOUDFLARE_ACCOUNT_ID=dfed33ea3d6cce574a4f6d446d5f1e8b
# Run from apps/marketing, where Wrangler is installed.
pnpm exec wrangler r2 bucket cors set geostore-products --file ../../tooling/storage/r2-cors.json
pnpm exec wrangler r2 bucket cors set geostore-avatars --file ../../tooling/storage/r2-cors.json
pnpm exec wrangler r2 bucket cors list geostore-products
```

## Verification status

On 2026-09-21 both buckets were created and CORS applied. All 12 reviewed catalogue images were uploaded and downloaded from the public product endpoint; SHA-256 hashes match `packages/commerce/catalogue-sources.json`. A PUT preflight from `http://localhost:3000` returned 204 with the expected allowed origin, methods and content-type header.

The URL/host regression suite passes 15 tests. Storage, API and SaaS type checks pass. Signed application upload verification, production custom-domain delivery and production deployment remain pending R2 signing credentials and the production admin/image domains. Existing database image URLs were not migrated by this setup.

References: https://developers.cloudflare.com/r2/api/tokens/ and https://developers.cloudflare.com/r2/buckets/public-buckets/.
