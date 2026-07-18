import "server-only";
import { getAuthenticatedUserId } from "../application/get-authenticated-user-id.ts";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";
import { hasPublicSupabaseConfig } from "@/modules/supabase/infrastructure/server-config";

export async function getServerUserId(): Promise<string | null> {
  if (!hasPublicSupabaseConfig()) return null;
  const client = await createUserSupabaseClient();
  return getAuthenticatedUserId(() => client.auth.getClaims());
}
