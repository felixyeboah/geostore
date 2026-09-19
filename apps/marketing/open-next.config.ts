import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * The storefront on Cloudflare Workers.
 *
 * Every storefront page is dynamic — the catalogue, the landing page's running
 * order and the cart all read the database on each request — so there is no
 * incremental cache to configure. Adding one would only introduce a second
 * source of truth for pages that are meant to be live.
 */
const config = defineCloudflareConfig();

/**
 * The workerd export condition points `@libsql/isomorphic-ws` at a `web.mjs`
 * that OpenNext does not copy into the bundle, so esbuild cannot resolve it.
 * Turso is reached over HTTP here, never a websocket, so the node entry is
 * never executed either way.
 */
config.cloudflare = { ...config.cloudflare, useWorkerdCondition: false };

export default config;
