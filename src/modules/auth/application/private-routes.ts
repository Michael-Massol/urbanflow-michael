const privatePagePrefixes = [
  "/dashboard",
  "/profil",
  "/historique",
  "/diagnostics/transport",
  "/confidentialite",
] as const;

export function isPrivatePagePath(pathname: string): boolean {
  return privatePagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
