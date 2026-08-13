import assert from "node:assert/strict";
import test from "node:test";
import {
  completedJourneyRowToDomain,
  type CompletedJourneyRow,
} from "../../src/modules/carbon-tracking/infrastructure/supabase-completed-journey-repository.ts";

const row: CompletedJourneyRow = {
  id: "journey-a",
  user_id: "user-a",
  origin_label: "Jean-Jaurès",
  destination_label: "Arènes",
  departure_at: "2026-08-13T10:00:00.000Z",
  arrival_at: "2026-08-13T10:20:00.000Z",
  duration_minutes: 20,
  distance_meters: 4_000,
  modes: ["metro"],
  emissions_grams_co2e: 17.76,
  car_reference_grams_co2e: 568,
  avoided_grams_co2e: 550.24,
  factor_version: "urbanflow-ademe-2025.1",
  provider: "tisseo",
  geometry_snapshot: { type: "LineString", coordinates: [[1.44, 43.6], [1.42, 43.59]] },
  confirmed_at: "2026-08-13T10:25:00.000Z",
};

test("Supabase rows restore the normalized confirmed geometry", () => {
  assert.deepEqual(completedJourneyRowToDomain(row).geometry, row.geometry_snapshot);
});

test("nullable and invalid stored geometries remain compatible", () => {
  assert.equal(completedJourneyRowToDomain({ ...row, geometry_snapshot: null }).geometry, null);
  assert.equal(completedJourneyRowToDomain({ ...row, geometry_snapshot: { type: "Point", coordinates: [] } }).geometry, null);
});
