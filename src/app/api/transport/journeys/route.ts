import { NextResponse } from "next/server";
import { planJourney } from "@/modules/journey-planning/application/plan-journey";
import { getServerTransportProvider } from "@/modules/journey-planning/infrastructure/get-server-transport-provider";
import { getUserJourneyPreferences } from "@/modules/journey-planning/infrastructure/get-user-journey-preferences";
import { noStoreHeaders, safeErrorStatus, toSafeErrorResult } from "@/modules/journey-planning/infrastructure/http-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const userPreferences = await getUserJourneyPreferences();
    const input = typeof body === "object" && body !== null
      ? { ...body, ...(userPreferences ?? {}) }
      : body;
    const data = await planJourney(getServerTransportProvider(), input);
    return NextResponse.json({ status: "success", data }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(toSafeErrorResult(error), { status: safeErrorStatus(error), headers: noStoreHeaders });
  }
}
