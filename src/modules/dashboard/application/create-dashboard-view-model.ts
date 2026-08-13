import type { MobilityPreferences } from "../../profile/domain/mobility-preferences.ts";
import { isMobilityProfileComplete } from "../../profile/domain/mobility-profile-completeness.ts";
import type { Profile } from "../../profile/domain/profile.ts";

export interface DashboardViewModel {
  greeting: string;
  profileStatus: "complete" | "incomplete";
  profileStatusLabel: "Profil configuré" | "Profil à compléter";
  providerLabel: string;
  features: ReadonlyArray<{
    title: string;
    description: string;
    status: "available" | "planned";
    href?: string;
  }>;
}

export function createDashboardViewModel(input: {
  profile: Pick<Profile, "displayName"> | null;
  preferences: MobilityPreferences | null;
  provider: "demo" | "tisseo";
}): DashboardViewModel {
  const normalizedName = input.profile?.displayName.trim() ?? "";
  const profileIsComplete = isMobilityProfileComplete(
    input.profile
      ? { displayName: input.profile.displayName, preferences: input.preferences }
      : null,
  );

  return {
    greeting: normalizedName ? `Bonjour ${normalizedName}` : "Bonjour",
    profileStatus: profileIsComplete ? "complete" : "incomplete",
    profileStatusLabel: profileIsComplete ? "Profil configuré" : "Profil à compléter",
    providerLabel: input.provider === "demo" ? "Démonstration — non temps réel" : "Tisséo",
    features: [
      {
        title: "Profil de mobilité",
        description: "Consultez et modifiez vos préférences de déplacement.",
        status: "available",
        href: "/profil",
      },
      {
        title: "Diagnostic transport",
        description: "Vérifiez le fournisseur actif et la disponibilité des données locales.",
        status: "available",
        href: "/diagnostics/transport",
      },
      {
        title: "Planificateur d’itinéraires",
        description: input.provider === "tisseo"
          ? "Comparez des itinéraires calculés par Tisséo."
          : "Comparez des propositions multimodales de démonstration.",
        status: "available",
        href: "/planifier",
      },
    ],
  };
}
