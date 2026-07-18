"use client";

import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";

export function createBrowserSupabaseClient() {
  const config = z.object({ url: z.url(), publishableKey: z.string().min(1) }).parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return createBrowserClient(config.url, config.publishableKey);
}
