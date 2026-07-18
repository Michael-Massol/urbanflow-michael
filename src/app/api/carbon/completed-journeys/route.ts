import { NextResponse } from "next/server";
import { confirmCompletedJourney } from "@/modules/carbon-tracking/application/confirm-completed-journey";
import { completedJourneyInputSchema } from "@/modules/carbon-tracking/domain/completed-journey-schema";
import { SupabaseCompletedJourneyRepository } from "@/modules/carbon-tracking/infrastructure/supabase-completed-journey-repository";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { noStoreHeaders, toSafeErrorResult } from "@/modules/journey-planning/infrastructure/http-response";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";
import type { Journey } from "@/modules/journey-planning/domain/models";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json(
      { status: "error", message: "Connectez-vous pour confirmer ce trajet." },
      { status: 401, headers: noStoreHeaders },
    );
  }
  try {
    const journey = completedJourneyInputSchema.parse(await request.json()) as Journey;
    const repository = new SupabaseCompletedJourneyRepository(await createUserSupabaseClient());
    const data = await confirmCompletedJourney(repository, userId, journey);
    return NextResponse.json({ status: "success", data }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(toSafeErrorResult(error), { status: 400, headers: noStoreHeaders });
  }
}
