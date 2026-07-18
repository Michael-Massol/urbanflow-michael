import "server-only";
import { z } from "zod";

const publicConfigSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
  siteUrl: z.url(),
});

export function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getPublicServerConfig() {
  return publicConfigSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });
}

export function getAdminServerConfig() {
  getPublicServerConfig();
  return z.object({ secretKey: z.string().min(1) }).parse({
    secretKey: process.env.SUPABASE_SECRET_KEY,
  });
}
