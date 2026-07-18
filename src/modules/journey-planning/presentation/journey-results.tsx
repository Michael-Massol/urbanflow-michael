"use client";

import { useState } from "react";
import type { CompletedJourney } from "../../carbon-tracking/domain/models";
import type { ActionResult, Journey, JourneySort } from "../domain/models";
import { JourneyMap } from "./journey-map";

const modeLabels = { walking: "Marche", bike: "Vélo", bus: "Bus", metro: "Métro", tram: "Tram", train: "Train" } as const;
const time = (value: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const grams = (value: number) => `${value.toLocaleString("fr-FR")} g CO₂e`;

export function JourneyResults(props: {
  journeys: Journey[];
  selected: Journey | null;
  sort: JourneySort;
  onSort: (sort: JourneySort) => void;
  onSelect: (journey: Journey) => void;
  mapStyleUrl?: string;
}) {
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [pendingConfirmationId, setPendingConfirmationId] = useState<string | null>(null);

  async function confirmJourney(journey: Journey) {
    setConfirming(true);
    setConfirmationMessage("");
    try {
      const response = await fetch("/api/carbon/completed-journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(journey),
      });
      const result = await response.json() as ActionResult<CompletedJourney>;
      if (result.status === "error") setConfirmationMessage(result.message);
      else {
        setConfirmedIds((ids) => [...ids, journey.id]);
        setPendingConfirmationId(null);
        setConfirmationMessage("Trajet confirmé et ajouté à votre historique.");
      }
    } catch {
      setConfirmationMessage("Impossible de confirmer ce trajet pour le moment.");
    } finally {
      setConfirming(false);
    }
  }

  if (props.journeys.length === 0) return <section className="empty-state"><h2>Aucun trajet</h2><p>Essayez une autre destination ou augmentez la durée de marche dans votre profil.</p></section>;
  return (
    <section className="journey-results" aria-labelledby="journey-results-title">
      <div className="results-heading"><h2 id="journey-results-title">Propositions</h2><label>Trier par <select value={props.sort} onChange={(event) => props.onSort(event.target.value as JourneySort)}><option value="recommended">Recommandé</option><option value="fastest">Plus rapide</option><option value="least-walking">Moins de marche</option><option value="fewest-transfers">Moins de correspondances</option></select></label></div>
      <div className="journey-list">
        {props.journeys.map((journey) => (
          <article className={`journey-card ${props.selected?.id === journey.id ? "journey-card-selected" : ""}`} key={journey.id}>
            <div className="badges"><span>Démonstration</span><span>Non temps réel</span></div>
            <h3>{time(journey.departureAt)} → {time(journey.arrivalAt)}</h3>
            <p><strong>{journey.durationMinutes} min</strong> · Marche {journey.walkingMinutes} min · {journey.transferCount} correspondance(s)</p>
            <p>{journey.modes.map((mode) => modeLabels[mode]).join(" · ")}</p>
            {journey.carbonEstimate ? <p><strong>{grams(journey.carbonEstimate.gramsCo2e)}</strong> · voiture thermique : {grams(journey.carbonEstimate.carReferenceGramsCo2e)}</p> : null}
            <button className="button button-secondary" type="button" onClick={() => props.onSelect(journey)}>Voir le détail</button>
          </article>
        ))}
      </div>
      {props.selected ? (
        <article className="journey-details">
          <h2>Détail du trajet</h2>
          <ol className="timeline">
            {props.selected.segments.map((segment) => (
              <li key={segment.id}>
                <strong>{time(segment.departureAt)} · {modeLabels[segment.mode]}</strong>
                <p>{segment.origin.label} → {segment.destination.label}</p>
                <p>{segment.durationMinutes} min{segment.lineName ? ` · ${segment.lineName}` : ""}{segment.direction ? ` · direction ${segment.direction}` : ""}{segment.stopCount !== undefined ? ` · ${segment.stopCount} arrêts` : ""}</p>
                <p>{segment.accessibility}</p>
              </li>
            ))}
          </ol>
          <JourneyMap journey={props.selected} {...(props.mapStyleUrl ? { styleUrl: props.mapStyleUrl } : {})} />
          {props.selected.carbonEstimate ? (
            <section className="carbon-comparison" aria-labelledby="carbon-title">
              <h3 id="carbon-title">Estimation carbone</h3>
              <p><strong>{grams(props.selected.carbonEstimate.gramsCo2e)}</strong> pour ce trajet, contre {grams(props.selected.carbonEstimate.carReferenceGramsCo2e)} en voiture thermique de référence.</p>
              <p>Économie estimée : {grams(props.selected.carbonEstimate.avoidedGramsCo2e)}. Facteurs ADEME/Impact CO₂, version {props.selected.carbonEstimate.factorVersion}. Estimation fondée sur les distances théoriques et des moyennes nationales.</p>
              {pendingConfirmationId === props.selected.id ? (
                <div className="confirmation-disclosure" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
                  <h4 id="confirmation-title">Avant d’enregistrer ce trajet</h4>
                  <p>UrbanFlow conservera uniquement : les noms du départ et de l’arrivée, les horaires prévus, la durée, la distance théorique, les modes utilisés, le fournisseur, les estimations carbone, la version des facteurs et la date de confirmation.</p>
                  <p>La recherche, les coordonnées précises, la géométrie et les détails des segments ne seront pas enregistrés.</p>
                  <div className="actions">
                    <button className="button" type="button" disabled={confirming} onClick={() => confirmJourney(props.selected!)}>{confirming ? "Enregistrement…" : "Oui, confirmer et enregistrer"}</button>
                    <button className="button button-secondary" type="button" disabled={confirming} onClick={() => setPendingConfirmationId(null)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <button className="button" type="button" disabled={confirmedIds.includes(props.selected.id)} onClick={() => { setConfirmationMessage(""); setPendingConfirmationId(props.selected!.id); }}>
                  {confirmedIds.includes(props.selected.id) ? "Trajet confirmé" : "Confirmer que j’ai effectué ce trajet"}
                </button>
              )}
              {confirmationMessage ? <p aria-live="polite">{confirmationMessage}</p> : null}
            </section>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
