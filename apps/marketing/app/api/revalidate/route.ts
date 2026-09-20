import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * On-demand cache invalidation, called by the back office.
 *
 * The admin is a separate Next application, so its `revalidatePath` calls
 * cannot reach this app's caches. Most of the storefront re-queries per
 * request and does not need this; `/api/nav-menu` is the exception, because it
 * pulls the whole catalogue and is deliberately cached. Without this endpoint
 * an admin who hides, renames or reorders a department watches the shop menu
 * keep the old shape until the cache window expires.
 *
 * Authorised with a shared secret rather than a session: the caller is a
 * server action on another origin, not a signed-in browser.
 */

export const dynamic = "force-dynamic";

/** Enough for any single write; a cap stops a stolen secret queueing thousands. */
const MAX_PATHS = 20;

const MAX_PATH_LENGTH = 512;

function isSafePath(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.startsWith("/") &&
		value.length <= MAX_PATH_LENGTH &&
		!value.includes("\n")
	);
}

/**
 * Compares without leaking the answer through timing.
 *
 * Hand-rolled rather than `crypto.timingSafeEqual`, which is not dependable
 * under workerd — this route runs on Cloudflare in production.
 */
function secretMatches(provided: string, expected: string): boolean {
	if (provided.length !== expected.length) {
		return false;
	}

	let difference = 0;
	for (let index = 0; index < provided.length; index += 1) {
		difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
	}

	return difference === 0;
}

export async function POST(request: NextRequest) {
	const expected = process.env.STOREFRONT_REVALIDATE_SECRET;

	// Fail closed. An unset secret must never mean "let anyone in".
	if (!expected) {
		return NextResponse.json(
			{ error: "Revalidation is not configured." },
			{ status: 503 },
		);
	}

	const provided =
		request.headers
			.get("authorization")
			?.replace(/^Bearer\s+/i, "")
			.trim() ?? "";

	if (!secretMatches(provided, expected)) {
		return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Expected a JSON body." },
			{ status: 400 },
		);
	}

	const requested =
		body && typeof body === "object" && "paths" in body
			? (body as { paths: unknown }).paths
			: undefined;

	if (!Array.isArray(requested)) {
		return NextResponse.json(
			{ error: "Expected `paths` to be an array." },
			{ status: 400 },
		);
	}

	const paths = [...new Set(requested.filter(isSafePath))].slice(
		0,
		MAX_PATHS,
	);

	if (paths.length === 0) {
		return NextResponse.json(
			{ error: "No valid paths to revalidate." },
			{ status: 400 },
		);
	}

	for (const path of paths) {
		revalidatePath(path);
	}

	return NextResponse.json({ revalidated: paths });
}
