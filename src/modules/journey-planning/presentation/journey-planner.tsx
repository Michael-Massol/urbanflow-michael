"use client";

import { useMemo, useState } from "react";
import { createCurrentLocationPlace } from "../application/create-current-location-place";
import { sortJourneys } from "../application/sort-journeys";
import type { ActionResult, Journey, JourneyPlanResult, JourneyPlace, JourneySort } from "../domain/models";
import type { TransportProviderDescriptor } from "../../transport/domain/models";
import { PlaceAutocomplete } from "./place-autocomplete";
import { JourneyResults } from "./journey-results";

function initialDate() {
  const date = new Date(Date.now() + 5 * 60_000);
  return { date: date.toISOString().slice(0, 10), time: date.toTimeString().slice(0, 5) };
}

export function JourneyPlanner({
  mapStyleUrl,
  provider,
  showAccessibility,
}: {
  mapStyleUrl?: string;
  provider: TransportProviderDescriptor;
  showAccessibility: boolean;
}) {
  const initial = initialDate();
  const [origin, setOrigin] = useState<JourneyPlace | null>(null);
  const [destination, setDestination] = useState<JourneyPlace | null>(null);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [result, setResult] = useState<JourneyPlanResult | null>(null);
  const [sort, setSort] = useState<JourneySort>("recommended");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sortedJourneys = useMemo(() => sortJourneys(result?.journeys ?? [], sort), [result, sort]);
  const selected = sortedJourneys.find((journey) => journey.id === selectedId) ?? null;

  function useCurrentLocation() {
    setGeoMessage("Demande de position en cours…");
    if (!("geolocation" in navigator)) { setGeoMessage("La géolocalisation n’est pas disponible. Saisissez un départ manuellement."); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin(createCurrentLocationPlace(position.coords.latitude, position.coords.longitude));
        setGeoMessage("Position utilisée uniquement comme départ, sans enregistrement.");
      },
      (geoError) => {
        const messages: Record<number, string> = { 1: "Autorisation refusée. Saisissez un départ manuellement.", 2: "Position indisponible. Saisissez un départ manuellement.", 3: "La recherche de position a expiré. Réessayez ou saisissez un départ." };
        setGeoMessage(messages[geoError.code] ?? "Impossible d’obtenir la position.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!origin || !destination) { setError("Sélectionnez un départ et une arrivée dans les suggestions."); return; }
    const departureAt = new Date(`${date}T${time}`);
    if (Number.isNaN(departureAt.getTime())) { setError("La date ou l’heure est invalide."); return; }
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/transport/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ origin, destination, departureAt: departureAt.toISOString(), preferredModes: [], avoidedModes: [], maxWalkingMinutes: 20, reducedMobility: false }),
      });
      const actionResult = await response.json() as ActionResult<JourneyPlanResult>;
      if (actionResult.status === "error") setError(actionResult.message);
      else { setResult(actionResult.data); setSelectedId(actionResult.data.journeys[0]?.id ?? null); setSort("recommended"); }
    } catch { setError("La recherche d’itinéraires est temporairement indisponible."); }
    finally { setLoading(false); }
  }

  return (
    <div className="planner-layout">
      {provider.isDemo ? (
        <aside className="demo-warning" role="note"><strong>Données de démonstration — non temps réel</strong><span>Ces propositions sont fictives et impropres à un déplacement réel.</span></aside>
      ) : null}
      <form className="planner-form" onSubmit={submit}>
        <PlaceAutocomplete id="origin" label="Départ" selectedPlace={origin} onSelect={setOrigin} />
        <div className="geolocation-box"><p>Votre position sert uniquement à définir le départ. Elle n’est ni enregistrée ni envoyée à Supabase. La saisie manuelle reste possible.</p><button className="button button-secondary" type="button" onClick={useCurrentLocation}>Utiliser ma position</button><p aria-live="polite">{geoMessage}</p></div>
        <button className="swap-button" type="button" onClick={() => { setOrigin(destination); setDestination(origin); }} aria-label="Inverser le départ et l’arrivée">⇅ Inverser</button>
        <PlaceAutocomplete id="destination" label="Arrivée" selectedPlace={destination} onSelect={setDestination} />
        <div className="date-time-grid"><div className="field"><label htmlFor="departure-date">Date</label><input id="departure-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div><div className="field"><label htmlFor="departure-time">Heure</label><input id="departure-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></div></div>
        {error ? <p className="form-message" role="alert">{error}</p> : null}
        <button className="button" type="submit" disabled={loading}>{loading ? "Recherche en cours…" : "Rechercher des itinéraires"}</button>
      </form>
      {result ? <>{result.isDemo && result.notice ? <p className="demo-warning"><strong>{result.notice}</strong></p> : null}<JourneyResults journeys={sortedJourneys} selected={selected} sort={sort} onSort={setSort} onSelect={(journey: Journey) => setSelectedId(journey.id)} showAccessibility={showAccessibility} {...(mapStyleUrl ? { mapStyleUrl } : {})} /></> : null}
    </div>
  );
}
