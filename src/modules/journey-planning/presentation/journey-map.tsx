"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createJourneyMapData } from "../application/create-journey-map-data";
import type { JourneyMapData } from "../application/create-journey-map-data";
import type { Journey, JourneyGeometry, JourneyMode } from "../domain/models";

const lineColors: Record<JourneyMode, string> = {
  walking: "#626f6a",
  bike: "#7a4e00",
  bus: "#1769aa",
  metro: "#c52233",
  tram: "#7b3fb3",
  train: "#0b6b53",
};

interface MapFallbackMessages {
  noStyle: string;
  noGeometry: string;
  error: string;
}

const planningFallbacks: MapFallbackMessages = {
  noStyle: "Carte désactivée : configurez `NEXT_PUBLIC_MAP_STYLE_URL`.",
  noGeometry: "Aucune géométrie disponible pour ce trajet.",
  error: "La carte n’a pas pu être chargée. Le détail textuel reste disponible.",
};

const historyFallbacks: MapFallbackMessages = {
  noStyle: "Carte désactivée : aucun style cartographique n’est configuré.",
  noGeometry: "Carte indisponible pour ce trajet.",
  error: "Impossible d’afficher la carte. Les informations du trajet restent disponibles ci-contre.",
};

function isWebGlSupported() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext
      && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

function MapLibreJourneyMap({
  mapData,
  styleUrl,
  accessibleLabel,
  className = "",
  fallbacks,
}: {
  mapData: JourneyMapData | null;
  styleUrl?: string;
  accessibleLabel: string;
  className?: string;
  fallbacks: MapFallbackMessages;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!styleUrl || !containerRef.current || !mapData) return;
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    setError("");
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      if (!isWebGlSupported()) {
        setError(fallbacks.error);
        return;
      }
      try {
        map = new maplibre.Map({
          container: containerRef.current,
          style: styleUrl,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
          if (!map) return;
          mapData.lines.forEach((line, index) => {
            const sourceId = `journey-segment-${index}`;
            map!.addSource(sourceId, {
              type: "geojson",
              data: { type: "Feature", properties: { mode: line.mode }, geometry: line.geometry },
            });
            map!.addLayer({
              id: `${sourceId}-line`,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": lineColors[line.mode],
                "line-width": line.mode === "walking" ? 4 : 6,
                ...(line.mode === "walking" ? { "line-dasharray": [1.5, 1.5] } : {}),
              },
            });
          });
          new maplibre.Marker({ color: "#0b6b53" }).setLngLat(mapData.origin).addTo(map);
          new maplibre.Marker({ color: "#a52727" }).setLngLat(mapData.destination).addTo(map);
          const first = mapData.coordinates[0]!;
          const bounds = mapData.coordinates.reduce(
            (value, coordinate) => value.extend(coordinate),
            new maplibre.LngLatBounds(first, first),
          );
          map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
        });
        map.on("error", () => {
          map?.remove();
          map = undefined;
          setError(fallbacks.error);
        });
      } catch {
        setError(fallbacks.error);
      }
    }).catch(() => setError(fallbacks.error));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [fallbacks.error, mapData, styleUrl]);

  if (!styleUrl) return <p className="map-fallback" role="status">{fallbacks.noStyle}</p>;
  if (!mapData) return <p className="map-fallback" role="status">{fallbacks.noGeometry}</p>;
  if (error) return <p className="map-fallback" role="status">{error}</p>;
  return (
    <div className="journey-map-wrapper">
      <div
        className={`journey-map ${className}`.trim()}
        ref={containerRef}
        role="img"
        aria-label={accessibleLabel}
      />
    </div>
  );
}

export function JourneyMap({ journey, styleUrl }: { journey: Journey; styleUrl?: string }) {
  const mapData = useMemo(() => createJourneyMapData(journey), [journey]);
  return (
    <MapLibreJourneyMap
      mapData={mapData}
      {...(styleUrl ? { styleUrl } : {})}
      accessibleLabel="Carte du trajet sélectionné"
      className="journey-map-planning"
      fallbacks={planningFallbacks}
    />
  );
}

export function JourneyGeometryMap({
  geometry,
  mode = "walking",
  styleUrl,
  accessibleLabel,
}: {
  geometry: JourneyGeometry | null;
  mode?: JourneyMode;
  styleUrl?: string;
  accessibleLabel: string;
}) {
  const mapData = useMemo<JourneyMapData | null>(() => {
    const first = geometry?.coordinates[0];
    const last = geometry?.coordinates.at(-1);
    if (!geometry || !first || !last) return null;
    return {
      lines: [{ id: "confirmed-journey", mode, geometry }],
      origin: first,
      destination: last,
      coordinates: geometry.coordinates,
    };
  }, [geometry, mode]);

  return (
    <MapLibreJourneyMap
      mapData={mapData}
      {...(styleUrl ? { styleUrl } : {})}
      accessibleLabel={accessibleLabel}
      className="journey-map-history"
      fallbacks={historyFallbacks}
    />
  );
}
