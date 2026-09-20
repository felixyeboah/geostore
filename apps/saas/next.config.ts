import path from "node:path";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import { ALLOWED_IMAGE_HOSTS, getUploadImageHosts } from "@repo/utils";
import type { NextConfig } from "next";

// `next/image` throws during render on an unconfigured host, so this list has
// to stay in lockstep with the one the product form validates against.
// Deriving both from ALLOWED_IMAGE_HOSTS is what keeps them from drifting.
const uploadImageHosts = getUploadImageHosts();

// A localhost pattern is a server-side fetch target for `next/image`, so it is
// only configured outside production. This mirrors `isAllowedImageUrl`.
const allowLocalhostImages = process.env.NODE_ENV !== "production";

const remotePatterns: NonNullable<
	NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
	...(allowLocalhostImages
		? ([
				{ protocol: "http", hostname: "localhost" },
				{ protocol: "http", hostname: "127.0.0.1" },
			] as const)
		: []),
	...ALLOWED_IMAGE_HOSTS.map(
		(hostname) => ({ protocol: "https", hostname }) as const,
	),
];

for (const hostname of uploadImageHosts) {
	if (hostname === "localhost" || hostname === "127.0.0.1") {
		if (allowLocalhostImages) {
			remotePatterns.push({ protocol: "http", hostname });
		}
		continue;
	}

	remotePatterns.push({ protocol: "https", hostname });
}

const nextConfig: NextConfig = {
	transpilePackages: [
		"@repo/api",
		"@repo/auth",
		"@repo/commerce",
		"@repo/database",
		"@repo/ui",
	],
	images: {
		remotePatterns,
	},
	async redirects() {
		// The customer-facing storefront moved to the marketing app. These keep
		// old links, bookmarks and indexed URLs working; without a configured
		// storefront URL they are skipped rather than pointing nowhere.
		const storefrontUrl = process.env.NEXT_PUBLIC_MARKETING_URL?.replace(
			/\/$/,
			"",
		);
		const storefrontRedirects = storefrontUrl
			? [
					{
						source: "/",
						destination: `${storefrontUrl}/shop`,
						permanent: false,
					},
					{
						source: "/cart",
						destination: `${storefrontUrl}/cart`,
						permanent: false,
					},
					{
						source: "/checkout/:path*",
						destination: `${storefrontUrl}/checkout/:path*`,
						permanent: false,
					},
					{
						source: "/products/:slug",
						destination: `${storefrontUrl}/products/:slug`,
						permanent: false,
					},
					{
						source: "/categories/:slug",
						destination: `${storefrontUrl}/categories/:slug`,
						permanent: false,
					},
				]
			: [];

		return [
			...storefrontRedirects,
			{
				source: "/settings",
				destination: "/settings/general",
				permanent: true,
			},
			{
				source: "/:organizationSlug/settings",
				destination: "/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/admin",
				destination: "/admin/overview",
				permanent: true,
			},
			{
				// Adding a product is a sheet over the list now. The old
				// route keeps working because the sheet's open state lives
				// in the query string rather than in component state.
				source: "/admin/products/new",
				destination: "/admin/products?new=true",
				permanent: false,
			},
		];
	},
	webpack: (config, { webpack, isServer }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		/*
		 * The admin runs on Node, never on Cloudflare Workers, so it has no
		 * use for the workerd Prisma client. That client imports its query
		 * compiler as `...wasm?module`, which webpack cannot parse — the build
		 * fails with "Unexpected character" on the raw wasm. The import in
		 * client.ts is relative, so the alias is the resolved path rather than
		 * a package specifier.
		 */
		const generated = path.resolve(
			process.cwd(),
			"../../packages/database/prisma/generated",
		);
		config.resolve.alias = {
			...config.resolve.alias,
			[`${generated}-workerd/client`]: `${generated}/client`,
		};

		if (isServer) {
			config.plugins.push(new PrismaPlugin());
		}

		return config;
	},
};

export default nextConfig;
