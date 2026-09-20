import { type NextRequest, NextResponse } from "next/server";

/**
 * Lets the back office preview its unpublished landing draft.
 *
 * `/?preview=draft&key=…` is turned into the `x-storefront-preview` request
 * header, which layouts and pages can read — `searchParams` never reaches a
 * layout, so the header is how the draft flag gets to the chrome around the
 * page. The key is the same shared secret the revalidate endpoint uses; the
 * comparison is constant-time, as it is there.
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

export function proxy(request: NextRequest) {
	const secret = process.env.STOREFRONT_REVALIDATE_SECRET;
	const wantsDraft = request.nextUrl.searchParams.get("preview") === "draft";
	const key = request.nextUrl.searchParams.get("key") ?? "";

	if (wantsDraft && secret && secretMatches(key, secret)) {
		const headers = new Headers(request.headers);
		headers.set("x-storefront-preview", "draft");
		return NextResponse.next({ request: { headers } });
	}

	return NextResponse.next();
}

// The draft preview is only wired into the home page; other paths never look
// at the header, so running on them would be waste.
export const config = {
	matcher: "/",
};
