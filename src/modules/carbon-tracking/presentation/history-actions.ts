"use server";

import { revalidatePath } from "next/cache";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { deleteCompletedJourney } from "../application/delete-completed-journey";
import { SupabaseCompletedJourneyRepository } from "../infrastructure/supabase-completed-journey-repository";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export async function deleteCompletedJourneyAction(formData: FormData): Promise<void> {
  const userId = await getServerUserId();
  if (!userId) return;
  const repository = new SupabaseCompletedJourneyRepository(await createUserSupabaseClient());
  await deleteCompletedJourney(repository, userId, formData.get("journeyId"));
  revalidatePath("/historique");
  revalidatePath("/dashboard");
}
