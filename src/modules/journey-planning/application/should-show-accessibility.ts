export function shouldShowAccessibility(
  preferences: { reducedMobility: boolean } | null | undefined,
): boolean {
  return preferences?.reducedMobility === true;
}
