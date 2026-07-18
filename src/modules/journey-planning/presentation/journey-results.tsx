"use client";

import type { Journey, JourneySort } from "../domain/models";
import { JourneyMap } from "./journey-map";

const modeLabels = { walking: "Marche", bike: "Vélo", bus: "Bus", metro: "Métro", tram: "Tram", train: "Train" } as const;
const time = (value: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function JourneyResults(props: {
  journeys: Journey[];
  selected: Journey | null;
  sort: JourneySort;
  onSort: (sort: JourneySort) => void;
  onSelect: (journey: Journey) => void;
  mapStyleUrl?: string;
}) {
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
        </article>
      ) : null}
    </section>
  );
}
