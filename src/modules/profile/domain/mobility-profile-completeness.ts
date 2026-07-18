import { transportModes, type MobilityPreferences } from "./mobility-preferences.ts";

export interface MobilityProfileCompletionInput {
  displayName?: string | null;
  preferences?: Pick<MobilityPreferences, "preferredModes" | "maxWalkingMinutes"> | null;
}

export function isMobilityProfileComplete(input?: MobilityProfileCompletionInput | null): boolean {
  if (!input || typeof input.displayName !== "string" || input.displayName.trim().length === 0) {
    return false;
  }

  const preferredModes = input.preferences?.preferredModes;
  if (
    !Array.isArray(preferredModes) ||
    preferredModes.length === 0 ||
    !preferredModes.every((mode) => transportModes.includes(mode))
  ) {
    return false;
  }

  const maxWalkingMinutes = input.preferences?.maxWalkingMinutes;
  return (
    typeof maxWalkingMinutes === "number" &&
    Number.isFinite(maxWalkingMinutes) &&
    Number.isInteger(maxWalkingMinutes) &&
    maxWalkingMinutes > 0 &&
    maxWalkingMinutes <= 120
  );
}
