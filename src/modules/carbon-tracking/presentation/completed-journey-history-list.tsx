"use client";

import { useState } from "react";
import type { CompletedJourney } from "../domain/models";
import type { JourneyMode } from "../../journey-planning/domain/models";
import { JourneyGeometryMap } from "../../journey-planning/presentation/journey-map";
import { DeleteCompletedJourneyForm } from "./delete-completed-journey-form";
import { formatCarbonSavingsPercentage } from "./format-carbon-savings";
import { formatEmissionFactorVersion } from "./format-emission-factor-version";

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

function HistoryMap({
  journey,
  active,
  styleUrl,
  onActivate,
}: {
  journey: CompletedJourney;
  active: boolean;
  styleUrl?: string;
  onActivate: () => void;
}) {
  if (!journey.geometry) {
    return <p className="map-fallback history-map-fallback" role="status">Carte indisponible pour ce trajet.</p>;
  }
  if (!styleUrl) {
    return <p className="map-fallback history-map-fallback" role="status">Carte désactivée : aucun style cartographique n’est configuré.</p>;
  }
  if (!active) {
    return (
      <div className="history-map-placeholder">
        <button className="button button-secondary" type="button" onClick={onActivate}>
          Afficher la carte de ce trajet
        </button>
      </div>
    );
  }
  return (
    <JourneyGeometryMap
      geometry={journey.geometry}
      mode={journey.modes[0] ?? "walking"}
      styleUrl={styleUrl}
      accessibleLabel={`Carte du trajet ${journey.originLabel} vers ${journey.destinationLabel}`}
    />
  );
}

export function CompletedJourneyHistoryList({
  journeys,
  mapStyleUrl,
}: {
  journeys: CompletedJourney[];
  mapStyleUrl?: string;
}) {
  const [activeMapId, setActiveMapId] = useState<string | null>(
    () => journeys.find((journey) => journey.geometry)?.id ?? null,
  );

  return (
    <div className="history-list">
      {journeys.map((journey) => {
        const savingsPercentage = formatCarbonSavingsPercentage(
          journey.avoidedGramsCo2e,
          journey.carReferenceGramsCo2e,
        );
        return (
          <article className="dashboard-card history-card" key={journey.id}>
            <div className="history-card-layout">
              <div className="history-card-content">
                <h2>{journey.originLabel} → {journey.destinationLabel}</h2>
                <dl className="history-details">
                  <div><dt>Départ prévu</dt><dd>{formatDate(journey.departureAt)}</dd></div>
                  <div><dt>Confirmation</dt><dd>{formatDate(journey.confirmedAt)}</dd></div>
                  <div><dt>Durée et distance</dt><dd>{journey.durationMinutes} min · {(journey.distanceMeters / 1_000).toLocaleString("fr-FR")} km</dd></div>
                  <div><dt>Modes utilisés</dt><dd>{journey.modes.map((mode) => modeLabels[mode]).join(" · ")}</dd></div>
                  <div><dt>Émissions estimées du trajet</dt><dd>{journey.emissionsGramsCo2e.toLocaleString("fr-FR")} g CO₂e</dd></div>
                  <div><dt>Même trajet en voiture thermique</dt><dd>{journey.carReferenceGramsCo2e.toLocaleString("fr-FR")} g CO₂e</dd></div>
                  <div><dt>Économie estimée</dt><dd>{journey.avoidedGramsCo2e.toLocaleString("fr-FR")} g CO₂e{savingsPercentage ? ` (${savingsPercentage})` : ""}</dd></div>
                  <div><dt>Facteurs d’émission</dt><dd>{formatEmissionFactorVersion(journey.factorVersion)}</dd></div>
                </dl>
                <DeleteCompletedJourneyForm journeyId={journey.id} />
              </div>
              <div className="history-map-region">
                <HistoryMap
                  journey={journey}
                  active={activeMapId === journey.id}
                  {...(mapStyleUrl ? { styleUrl: mapStyleUrl } : {})}
                  onActivate={() => setActiveMapId(journey.id)}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
