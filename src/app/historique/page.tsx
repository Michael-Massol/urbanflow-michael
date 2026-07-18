import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { emissionFactors } from "@/modules/carbon-tracking/domain/emission-factors";
import { SupabaseCompletedJourneyRepository } from "@/modules/carbon-tracking/infrastructure/supabase-completed-journey-repository";
import { DeleteCompletedJourneyForm } from "@/modules/carbon-tracking/presentation/delete-completed-journey-form";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";
import type { JourneyMode } from "@/modules/journey-planning/domain/models";

export const metadata: Metadata = { title: "Historique des trajets" };
export const dynamic = "force-dynamic";

const modeLabels: Record<JourneyMode, string> = {
  walking: "Marche",
  bike: "Vélo",
  bus: "Bus",
  metro: "Métro",
  tram: "Tram",
  train: "Train",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

export default async function HistoryPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/connexion");
  const journeys = await new SupabaseCompletedJourneyRepository(
    await createUserSupabaseClient(),
  ).listByUserId(userId);

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
        <div className="history-list">
          {journeys.map((journey) => (
            <article className="dashboard-card history-card" key={journey.id}>
              <h2>{journey.originLabel} → {journey.destinationLabel}</h2>
              <dl className="history-details">
                <div><dt>Départ prévu</dt><dd>{formatDate(journey.departureAt)}</dd></div>
                <div><dt>Confirmation</dt><dd>{formatDate(journey.confirmedAt)}</dd></div>
                <div><dt>Durée et distance</dt><dd>{journey.durationMinutes} min · {(journey.distanceMeters / 1_000).toLocaleString("fr-FR")} km</dd></div>
                <div><dt>Modes utilisés</dt><dd>{journey.modes.map((mode) => modeLabels[mode]).join(" · ")}</dd></div>
                <div><dt>Estimation du trajet</dt><dd>{journey.emissionsGramsCo2e.toLocaleString("fr-FR")} g CO₂e</dd></div>
                <div><dt>Voiture thermique de référence</dt><dd>{journey.carReferenceGramsCo2e.toLocaleString("fr-FR")} g CO₂e</dd></div>
                <div><dt>Économie estimée</dt><dd>{journey.avoidedGramsCo2e.toLocaleString("fr-FR")} g CO₂e</dd></div>
                <div><dt>Version des facteurs</dt><dd>{journey.factorVersion}</dd></div>
              </dl>
              <DeleteCompletedJourneyForm journeyId={journey.id} />
            </article>
          ))}
        </div>
      )}
      <aside className="notice">
        <strong>Source et limites</strong>
        <span>Facteurs statiques ADEME/Impact CO₂, version {emissionFactors.car_thermal_reference.version}. Estimations fondées sur des moyennes nationales et les distances théoriques, pas un bilan complet personnalisé.</span>
      </aside>
    </section>
  );
}
