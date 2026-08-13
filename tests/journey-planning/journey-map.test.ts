import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createJourneyMapData } from "../../src/modules/journey-planning/application/create-journey-map-data.ts";
import type { Journey } from "../../src/modules/journey-planning/domain/models.ts";

const place = (id: string, longitude: number, latitude: number) => ({
  id,
  label: id,
  type: "stop" as const,
  longitude,
  latitude,
  source: "tisseo",
});

const journey: Journey = {
  id: "tisseo-map",
  departureAt: "2026-08-10T15:00:00.000Z",
  arrivalAt: "2026-08-10T15:20:00.000Z",
  durationMinutes: 20,
  walkingMinutes: 4,
  transferCount: 0,
  modes: ["walking", "metro"],
  provider: "tisseo",
  realtime: false,
  segments: [
    {
      id: "walk",
      mode: "walking",
      origin: place("origin", 1.44, 43.6),
      destination: place("stop", 1.445, 43.605),
      departureAt: "2026-08-10T15:00:00.000Z",
      arrivalAt: "2026-08-10T15:04:00.000Z",
      durationMinutes: 4,
      distanceMeters: 500,
      geometry: { type: "LineString", coordinates: [[1.44, 43.6], [1.445, 43.605]] },
    },
    {
      id: "metro",
      mode: "metro",
      origin: place("stop", 1.445, 43.605),
      destination: place("destination", 1.46, 43.62),
      departureAt: "2026-08-10T15:04:00.000Z",
      arrivalAt: "2026-08-10T15:20:00.000Z",
      durationMinutes: 16,
      distanceMeters: 2_000,
      geometry: { type: "LineString", coordinates: [[1.445, 43.605], [1.46, 43.62]] },
    },
  ],
};

test("map data keeps real segment geometries and endpoint markers", () => {
  const data = createJourneyMapData(journey);
  assert.equal(data?.lines.length, 2);
  assert.deepEqual(data?.lines.map((line) => line.mode), ["walking", "metro"]);
  assert.deepEqual(data?.origin, [1.44, 43.6]);
  assert.deepEqual(data?.destination, [1.46, 43.62]);
  assert.equal(data?.coordinates.length, 4);
});

test("map data tolerates missing segment geometry and rejects a fully absent trace", () => {
  const partiallyMissing = {
    ...journey,
    segments: journey.segments.map((segment, index) => {
      if (index !== 0) return segment;
      const withoutGeometry = { ...segment };
      delete withoutGeometry.geometry;
      return withoutGeometry;
    }),
  };
  assert.equal(createJourneyMapData(partiallyMissing)?.lines.length, 1);
  const withoutGeometry = {
    ...journey,
    segments: journey.segments.map((segment) => {
      const withoutGeometry = { ...segment };
      delete withoutGeometry.geometry;
      return withoutGeometry;
    }),
  };
  assert.equal(createJourneyMapData(withoutGeometry), null);
});

test("MapLibre stays client-only and exposes style, WebGL and fitBounds fallbacks", async () => {
  const [source, styles] = await Promise.all([
    readFile("src/modules/journey-planning/presentation/journey-map.tsx", "utf8"),
    readFile("src/app/globals.css", "utf8"),
  ]);
  assert.match(source, /^"use client"/);
  assert.match(source, /import\("maplibre-gl"\)/);
  assert.match(source, /NEXT_PUBLIC_MAP_STYLE_URL/);
  assert.match(source, /fitBounds/);
  assert.match(source, /function isWebGlSupported/);
  assert.match(source, /getContext\("webgl"\)/);
  assert.match(source, /NavigationControl/);
  assert.match(source, /JourneyGeometryMap/);
  assert.match(source, /Impossible d’afficher la carte/);
  assert.match(source, /className="journey-map-planning"/);
  assert.match(styles, /\.journey-map-planning\s*\{[^}]*aspect-ratio:\s*5\s*\/\s*4/);
  assert.match(styles, /\.journey-map-history\s*\{[^}]*aspect-ratio:\s*auto/);
});
