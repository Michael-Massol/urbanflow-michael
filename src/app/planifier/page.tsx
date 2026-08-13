import type { Metadata } from "next";
import { shouldShowAccessibility } from "@/modules/journey-planning/application/should-show-accessibility";
import { getUserJourneyPreferences } from "@/modules/journey-planning/infrastructure/get-user-journey-preferences";
import { JourneyPlanner } from "@/modules/journey-planning/presentation/journey-planner";
import { getServerTransportProvider } from "@/modules/journey-planning/infrastructure/get-server-transport-provider";

export const metadata: Metadata = { title: "Planifier un trajet" };

export default async function PlanJourneyPage() {
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const provider = getServerTransportProvider().descriptor;
  const userPreferences = await getUserJourneyPreferences();
  const showAccessibility = shouldShowAccessibility(userPreferences);
  return (
    <section className="page-shell planner-page">
      <p className="eyebrow">Mobilité toulousaine</p>
      <h1>Planifier un trajet</h1>
      <p>Comparez plusieurs propositions multimodales. Aucune recherche n’est enregistrée.</p>
      <JourneyPlanner
        provider={provider}
        showAccessibility={showAccessibility}
        {...(mapStyleUrl ? { mapStyleUrl } : {})}
      />
    </section>
  );
}
