import type { Metadata } from "next";
import { JourneyPlanner } from "@/modules/journey-planning/presentation/journey-planner";

export const metadata: Metadata = { title: "Planifier un trajet" };

export default function PlanJourneyPage() {
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  return (
    <section className="page-shell planner-page">
      <p className="eyebrow">Mobilité toulousaine</p>
      <h1>Planifier un trajet</h1>
      <p>Comparez plusieurs propositions multimodales de démonstration. Aucune recherche n’est enregistrée.</p>
      <JourneyPlanner {...(mapStyleUrl ? { mapStyleUrl } : {})} />
    </section>
  );
}
