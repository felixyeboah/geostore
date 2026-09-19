import { withContentCollections } from "@content-collections/next";
import { ALLOWED_IMAGE_HOSTS, getUploadImageHosts } from "@repo/utils";
import type { NextConfig } from "next";

// `next/image` throws during render on an unconfigured host, so this list has
// to stay in lockstep with the one the admin product form validates against.
// Deriving both from ALLOWED_IMAGE_HOSTS is what keeps them from drifting.
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
	{ protocol: "https", hostname: "placehold.co" },
	{ protocol: "https", hostname: "picsum.photos" },
];

for (const hostname of getUploadImageHosts()) {
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
		"@repo/auth",
		"@repo/commerce",
		"@repo/database",
		"@repo/ui",
	],
	// `@prisma/client` is externalised by Next automatically; `pg` and its
	// optional native bindings are not, and bundling them breaks the adapter.
	serverExternalPackages: ["pg", "@prisma/adapter-pg"],
	images: { remotePatterns },
	// Two departments were renamed when the taxonomy grew. Anything already
	// shared or indexed under the old slug keeps working.
	async redirects() {
		return [
			{
				source: "/categories/wearables",
				destination: "/categories/watches-wearables",
				permanent: true,
			},
			{
				source: "/categories/home-tech",
				destination: "/categories/home-tv",
				permanent: true,
			},
		];
	},
};

export default withContentCollections(nextConfig);
