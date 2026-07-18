import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAdminServerConfig, getPublicServerConfig } from "./server-config";

export function createAdminSupabaseClient() {
  const publicConfig = getPublicServerConfig();
  const adminConfig = getAdminServerConfig();
  return createClient(publicConfig.url, adminConfig.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
