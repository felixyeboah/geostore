import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getUploadImageHosts, isAllowedImageUrl } from "./image-hosts";

/** Runs `fn` with the given env applied, restoring whatever was there before. */
function withEnv(env: Record<string, string | undefined>, fn: () => void) {
	const previous = new Map<string, string | undefined>();
	for (const [key, value] of Object.entries(env)) {
		previous.set(key, process.env[key]);
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
	try {
		fn();
	} finally {
		for (const [key, value] of previous) {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	}
}

const NO_STORAGE = {
	NEXT_PUBLIC_STORAGE_URL: undefined,
	S3_ENDPOINT: undefined,
};

describe("isAllowedImageUrl", () => {
	it("accepts the configured public hosts", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "production" }, () => {
			assert.equal(
				isAllowedImageUrl("https://images.unsplash.com/photo-1.jpg"),
				true,
			);
			assert.equal(
				isAllowedImageUrl("https://lh3.googleusercontent.com/a/b"),
				true,
			);
		});
	});

	it("rejects an unknown host", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "production" }, () => {
			assert.equal(
				isAllowedImageUrl("https://evil.example.com/x.png"),
				false,
			);
		});
	});

	it("rejects a host that merely ends with an allowed one", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "production" }, () => {
			assert.equal(
				isAllowedImageUrl(
					"https://images.unsplash.com.evil.test/x.png",
				),
				false,
			);
		});
	});

	it("rejects non-http protocols", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "development" }, () => {
			for (const value of [
				"data:image/png;base64,AAAA",
				"file:///etc/passwd",
				"javascript:alert(1)",
			]) {
				assert.equal(isAllowedImageUrl(value), false, value);
			}
		});
	});

	it("rejects a value that is not a URL at all", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "development" }, () => {
			assert.equal(isAllowedImageUrl("not a url"), false);
			assert.equal(isAllowedImageUrl(""), false);
		});
	});

	it("allows localhost outside production, where MinIO serves uploads", () => {
		withEnv({ ...NO_STORAGE, NODE_ENV: "development" }, () => {
			assert.equal(
				isAllowedImageUrl("http://localhost:9000/products/a"),
				true,
			);
			assert.equal(
				isAllowedImageUrl("http://127.0.0.1:9000/products/a"),
				true,
			);
		});
	});

	it("refuses localhost in production, closing the SSRF path", () => {
		// `next/image` fetches these server-side, so accepting a loopback URL
		// would let an admin-supplied image address internal services.
		withEnv({ ...NO_STORAGE, NODE_ENV: "production" }, () => {
			assert.equal(
				isAllowedImageUrl("http://localhost:9000/products/a"),
				false,
			);
			assert.equal(
				isAllowedImageUrl("http://127.0.0.1:2375/containers/json"),
				false,
			);
		});
	});

	it("accepts the public storage origin, which may differ from the S3 API origin", () => {
		// The regression this guards: the allowlist used to read a
		// NEXT_PUBLIC_S3_URL that is defined nowhere, so a CDN-fronted bucket
		// had every one of its images rejected.
		withEnv(
			{
				NODE_ENV: "production",
				NEXT_PUBLIC_STORAGE_URL: "https://cdn.geostoresgh.com",
				S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
			},
			() => {
				assert.equal(
					isAllowedImageUrl(
						"https://cdn.geostoresgh.com/products/a.webp",
					),
					true,
				);
				assert.equal(
					isAllowedImageUrl(
						"https://abc123.r2.cloudflarestorage.com/products/a.webp",
					),
					true,
				);
			},
		);
	});
});

describe("getUploadImageHosts", () => {
	it("returns nothing when no storage is configured", () => {
		withEnv(NO_STORAGE, () => {
			assert.deepEqual(getUploadImageHosts(), []);
		});
	});

	it("deduplicates when both variables point at the same origin", () => {
		withEnv(
			{
				NEXT_PUBLIC_STORAGE_URL: "http://localhost:9000",
				S3_ENDPOINT: "http://localhost:9000/",
			},
			() => {
				assert.deepEqual(getUploadImageHosts(), ["localhost"]);
			},
		);
	});

	it("ignores a malformed endpoint rather than throwing", () => {
		withEnv(
			{ NEXT_PUBLIC_STORAGE_URL: "not a url", S3_ENDPOINT: undefined },
			() => {
				assert.deepEqual(getUploadImageHosts(), []);
			},
		);
	});
});
