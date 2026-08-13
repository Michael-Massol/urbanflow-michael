import assert from "node:assert/strict";
import test from "node:test";
import { mergeConsecutiveWalkingSegments } from "../../src/modules/journey-planning/application/merge-consecutive-walking-segments.ts";
import { toJourney } from "../../src/modules/journey-planning/application/transport-mappers.ts";
import type { JourneyMode, JourneyPlace, JourneySegment } from "../../src/modules/journey-planning/domain/models.ts";
import type { JourneyOption, Place } from "../../src/modules/transport/domain/models.ts";

function place(id: string, longitude: number): JourneyPlace {
  return {
    id,
    label: id,
    type: "point_of_interest",
    latitude: 43.6,
    longitude,
    source: "tisseo",
  };
}

function segment(
  id: string,
  mode: JourneyMode,
  origin: JourneyPlace,
  destination: JourneyPlace,
  durationMinutes: number,
  distanceMeters?: number,
): JourneySegment {
  return {
    id,
    mode,
    origin,
    destination,
    departureAt: `2026-08-13T10:0${origin.longitude}:00.000Z`,
    arrivalAt: `2026-08-13T10:0${destination.longitude}:00.000Z`,
    durationMinutes,
    ...(distanceMeters !== undefined ? { distanceMeters } : {}),
    geometry: {
      type: "LineString",
      coordinates: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]],
    },
  };
}

const a = place("A", 0);
const b = place("B", 1);
const c = place("C", 2);
const d = place("D", 3);

test("three consecutive walks become one ordered and fully aggregated walk", () => {
  const first = { ...segment("walk-1", "walking", a, b, 1, 100), accessibility: "Accessible" };
  const second = { ...segment("walk-2", "walking", b, c, 2, 200), accessibility: "Accessible" };
  const third = { ...segment("walk-3", "walking", c, d, 3, 300), accessibility: "Accessible" };

  const result = mergeConsecutiveWalkingSegments([first, second, third]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.origin, a);
  assert.equal(result[0]?.destination, d);
  assert.equal(result[0]?.departureAt, first.departureAt);
  assert.equal(result[0]?.arrivalAt, third.arrivalAt);
  assert.equal(result[0]?.durationMinutes, 6);
  assert.equal(result[0]?.distanceMeters, 600);
  assert.equal(result[0]?.accessibility, "Accessible");
  assert.deepEqual(result[0]?.geometry?.coordinates, [
    [0, 43.6],
    [1, 43.6],
    [2, 43.6],
    [3, 43.6],
  ]);
});

test("walks separated by metro are never merged", () => {
  const input = [
    segment("walk-1", "walking", a, b, 1, 100),
    segment("metro", "metro", b, c, 4, 2_000),
    segment("walk-2", "walking", c, d, 1, 100),
  ];

  const result = mergeConsecutiveWalkingSegments(input);

  assert.deepEqual(result.map(({ mode }) => mode), ["walking", "metro", "walking"]);
  assert.deepEqual(result, input);
});

test("two walks before a bus are merged without absorbing the bus", () => {
  const bus = segment("bus", "bus", c, d, 5, 2_500);
  const result = mergeConsecutiveWalkingSegments([
    segment("walk-1", "walking", a, b, 1, 100),
    segment("walk-2", "walking", b, c, 2, 200),
    bus,
  ]);

  assert.deepEqual(result.map(({ mode }) => mode), ["walking", "bus"]);
  assert.equal(result[0]?.durationMinutes, 3);
  assert.equal(result[0]?.destination, c);
  assert.equal(result[1], bus);
});

test("empty and single-segment inputs are preserved", () => {
  assert.deepEqual(mergeConsecutiveWalkingSegments([]), []);
  const only = segment("walk", "walking", a, b, 1, 100);
  const result = mergeConsecutiveWalkingSegments([only]);
  assert.equal(result.length, 1);
  assert.equal(result[0], only);
});

test("partial distances and geometries are aggregated without inventing missing data", () => {
  const withoutOptionalData = segment("walk-1", "walking", a, b, 1);
  delete withoutOptionalData.geometry;
  const withAvailableData = segment("walk-2", "walking", b, c, 2, 75);
  const result = mergeConsecutiveWalkingSegments([
    { ...withoutOptionalData, accessibility: "Accessible" },
    withAvailableData,
  ]);

  assert.equal(result[0]?.distanceMeters, 75);
  assert.deepEqual(result[0]?.geometry, withAvailableData.geometry);
  assert.equal(result[0]?.accessibility, undefined);

  const secondWithoutDistance = { ...withAvailableData };
  delete secondWithoutDistance.distanceMeters;
  const noDistances = mergeConsecutiveWalkingSegments([withoutOptionalData, secondWithoutDistance]);
  assert.equal(noDistances[0]?.distanceMeters, undefined);
});

test("Tisséo normalization applies the merge after converting provider legs", () => {
  const providerPlaces: Place[] = [a, b, c, d].map((journeyPlace) => ({
    id: journeyPlace.id,
    name: journeyPlace.label,
    kind: "public-place",
    coordinates: { longitude: journeyPlace.longitude, latitude: journeyPlace.latitude },
  }));
  const [providerA, providerB, providerC, providerD] = providerPlaces;
  assert.ok(providerA && providerB && providerC && providerD);
  const option: JourneyOption = {
    id: "tisseo-walking-parts",
    durationMinutes: 6,
    distanceMeters: 600,
    transfers: 0,
    isRealTime: false,
    legs: [
      { id: "leg-1", mode: "walk", from: providerA, to: providerB, durationMinutes: 1, distanceMeters: 100 },
      { id: "leg-2", mode: "walk", from: providerB, to: providerC, durationMinutes: 2, distanceMeters: 200 },
      { id: "leg-3", mode: "walk", from: providerC, to: providerD, durationMinutes: 3, distanceMeters: 300 },
    ],
  };

  const tisseoJourney = toJourney(option, new Date("2026-08-13T10:00:00.000Z"), { id: "tisseo" });
  const demoJourney = toJourney(option, new Date("2026-08-13T10:00:00.000Z"), { id: "demo" });

  assert.equal(tisseoJourney.segments.length, 1);
  assert.equal(tisseoJourney.segments[0]?.origin.id, "A");
  assert.equal(tisseoJourney.segments[0]?.destination.id, "D");
  assert.equal(demoJourney.segments.length, 3);
});
