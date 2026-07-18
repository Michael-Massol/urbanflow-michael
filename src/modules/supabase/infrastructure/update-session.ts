import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPrivatePagePath } from "../../auth/application/private-routes";
import { hasPublicSupabaseConfig, getPublicServerConfig } from "./server-config";

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  if (!hasPublicSupabaseConfig()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const config = getPublicServerConfig();
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headersToSet).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (!userId && isPrivatePagePath(request.nextUrl.pathname)) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/connexion";
    destination.searchParams.set("retour", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
