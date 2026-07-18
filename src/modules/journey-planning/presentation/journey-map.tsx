"use client";

import { useEffect, useRef, useState } from "react";
import type { Journey } from "../domain/models";

export function JourneyMap({ journey, styleUrl }: { journey: Journey; styleUrl?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!styleUrl || !containerRef.current || !journey.geometry) return;
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      try {
        map = new maplibre.Map({ container: containerRef.current, style: styleUrl });
        map.on("load", () => {
          if (!map || !journey.geometry) return;
          map.addSource("journey", { type: "geojson", data: { type: "Feature", properties: {}, geometry: journey.geometry } });
          map.addLayer({ id: "journey-line", type: "line", source: "journey", paint: { "line-color": "#0b6b53", "line-width": 5 } });
          const coordinates = journey.geometry.coordinates;
          const first = coordinates[0];
          const last = coordinates.at(-1);
          if (first && last) {
            new maplibre.Marker({ color: "#0b6b53" }).setLngLat(first).addTo(map);
            new maplibre.Marker({ color: "#a52727" }).setLngLat(last).addTo(map);
            const bounds = coordinates.reduce((value, coordinate) => value.extend(coordinate), new maplibre.LngLatBounds(first, first));
            map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
          }
        });
        map.on("error", () => setError("La carte n’a pas pu être chargée. Le détail textuel reste disponible."));
      } catch { setError("La carte n’a pas pu être initialisée."); }
    }).catch(() => setError("La carte est temporairement indisponible."));
    return () => { cancelled = true; map?.remove(); };
  }, [journey, styleUrl]);

  if (!styleUrl) return <p className="map-fallback">Carte désactivée : configurez `NEXT_PUBLIC_MAP_STYLE_URL`.</p>;
  if (!journey.geometry) return <p className="map-fallback">Aucune géométrie disponible pour ce trajet.</p>;
  return <div><div className="journey-map" ref={containerRef} aria-label="Carte du trajet sélectionné" />{error ? <p className="form-message" role="status">{error}</p> : null}</div>;
}
