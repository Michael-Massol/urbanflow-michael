export interface AuthClaimsResult {
  data: { claims?: { sub?: unknown } | null } | null;
}

export async function getAuthenticatedUserId(
  loadClaims: () => Promise<AuthClaimsResult>,
): Promise<string | null> {
  try {
    const { data } = await loadClaims();
    return typeof data?.claims?.sub === "string" && data.claims.sub.length > 0
      ? data.claims.sub
      : null;
  } catch {
    return null;
  }
}
