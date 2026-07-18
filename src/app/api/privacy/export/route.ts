import { NextResponse } from "next/server";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { exportUserData } from "@/modules/privacy/application/export-user-data";
import { SupabasePrivacyDataRepository } from "@/modules/privacy/infrastructure/supabase-privacy-data-repository";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export const dynamic = "force-dynamic";

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json(
      { message: "Authentification requise." },
      { status: 401, headers: privateResponseHeaders },
    );
  }

  try {
    const repository = new SupabasePrivacyDataRepository(await createUserSupabaseClient());
    const data = await exportUserData(repository, userId);
    const date = data.generatedAt.slice(0, 10);
    return new Response(`${JSON.stringify(data, null, 2)}\n`, {
      status: 200,
      headers: {
        ...privateResponseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="urbanflow-donnees-${date}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "L’export est temporairement indisponible." },
      { status: 503, headers: privateResponseHeaders },
    );
  }
}
