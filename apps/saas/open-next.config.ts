import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// The Node build uses webpack and aliases Prisma's workerd client. Turbopack
// preserves the WASM module import needed by Cloudflare's query compiler.
config.buildCommand = "pnpm exec next build --turbopack";

// Match the storefront: Turso uses HTTP, so its websocket entry is unused.
config.cloudflare = { ...config.cloudflare, useWorkerdCondition: false };

export default config;
