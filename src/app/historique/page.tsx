import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { emissionFactors } from "@/modules/carbon-tracking/domain/emission-factors";
import { SupabaseCompletedJourneyRepository } from "@/modules/carbon-tracking/infrastructure/supabase-completed-journey-repository";
import { CompletedJourneyHistoryList } from "@/modules/carbon-tracking/presentation/completed-journey-history-list";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export const metadata: Metadata = { title: "Historique des trajets" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/connexion");
  const journeys = await new SupabaseCompletedJourneyRepository(
    await createUserSupabaseClient(),
  ).listByUserId(userId);
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;

  return (
    <section className="page-shell history-page">
      <p className="eyebrow">Votre mobilité</p>
      <h1>Trajets effectués</h1>
      <p>Seuls les trajets que vous avez explicitement confirmés apparaissent ici.</p>
      {journeys.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun trajet confirmé</h2>
          <p>Planifiez un trajet puis confirmez-le après l’avoir effectué.</p>
        </div>
      ) : (
        <CompletedJourneyHistoryList
          journeys={journeys}
          {...(mapStyleUrl ? { mapStyleUrl } : {})}
        />
      )}
      <aside className="notice">
        <strong>Source et limites</strong>
        <span>Facteurs statiques ADEME/Impact CO₂, version {emissionFactors.car_thermal_reference.version}. Estimations fondées sur des moyennes nationales et les distances théoriques, pas un bilan complet personnalisé.</span>
      </aside>
    </section>
  );
}
