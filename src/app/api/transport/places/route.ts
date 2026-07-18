import { NextResponse } from "next/server";
import { searchPlaces } from "@/modules/journey-planning/application/search-places";
import { getServerTransportProvider } from "@/modules/journey-planning/infrastructure/get-server-transport-provider";
import { noStoreHeaders, toSafeErrorResult } from "@/modules/journey-planning/infrastructure/http-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = await searchPlaces(getServerTransportProvider(), {
      query: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return NextResponse.json({ status: "success", data }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(toSafeErrorResult(error), { status: 400, headers: noStoreHeaders });
  }
}
