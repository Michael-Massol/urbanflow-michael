"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ActionResult, JourneyPlace } from "../domain/models";

interface PlaceAutocompleteProps {
  id: string;
  label: string;
  selectedPlace: JourneyPlace | null;
  onSelect: (place: JourneyPlace | null) => void;
}

export function PlaceAutocomplete({ id, label, selectedPlace, onSelect }: PlaceAutocompleteProps) {
  const listId = useId();
  const requestId = useRef(0);
  const [query, setQuery] = useState(selectedPlace?.label ?? "");
  const [results, setResults] = useState<JourneyPlace[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedPlace) return;
    const timeout = window.setTimeout(() => setQuery(selectedPlace.label), 0);
    return () => window.clearTimeout(timeout);
  }, [selectedPlace]);

  useEffect(() => {
    const normalized = query.trim();
    if (selectedPlace?.label === query || normalized.length < 2) {
      return;
    }
    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/transport/places?q=${encodeURIComponent(normalized)}&limit=6`, { cache: "no-store" });
        const result = await response.json() as ActionResult<JourneyPlace[]>;
        if (currentRequest !== requestId.current) return;
        if (result.status === "error") {
          setResults([]);
          setMessage(result.message);
        } else {
          setResults(result.data);
          setMessage(result.data.length === 0 ? "Aucun résultat." : `${result.data.length} résultat(s).`);
        }
      } catch {
        if (currentRequest === requestId.current) setMessage("Recherche de lieux indisponible.");
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query, selectedPlace]);

  function select(place: JourneyPlace) {
    requestId.current += 1;
    onSelect(place);
    setQuery(place.label);
    setResults([]);
    setActiveIndex(-1);
    setMessage(`${place.label} sélectionné.`);
  }

  return (
    <div className="field autocomplete">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          requestId.current += 1;
          setQuery(value);
          onSelect(null);
          setResults([]);
          setMessage(value.trim().length > 0 && value.trim().length < 2 ? "Saisissez au moins 2 caractères." : "");
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && results.length > 0) { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); }
          else if (event.key === "ArrowUp" && results.length > 0) { event.preventDefault(); setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1)); }
          else if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); const place = results[activeIndex]; if (place) select(place); }
          else if (event.key === "Escape") { setResults([]); setActiveIndex(-1); }
        }}
        required
      />
      <p className="field-hint" aria-live="polite">{loading ? "Recherche…" : message}</p>
      {results.length > 0 ? (
        <ul className="autocomplete-list" id={listId} role="listbox">
          {results.map((place, index) => (
            <li id={`${listId}-${index}`} key={place.id} role="option" aria-selected={index === activeIndex}>
              <button type="button" onClick={() => select(place)}>{place.label}<small>{place.context}</small></button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
