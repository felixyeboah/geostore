import { searchPublishedStoreProducts } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
	if (query.length < 2) {
		return NextResponse.json({ total: 0, products: [] });
	}
	if (query.length > 200) {
		return NextResponse.json(
			{ error: "Search must be 200 characters or fewer." },
			{ status: 400 },
		);
	}
	return NextResponse.json(await searchPublishedStoreProducts(query));
}
