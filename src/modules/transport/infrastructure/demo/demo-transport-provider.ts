import { z } from "zod";
import { JourneyNotSupportedError } from "../../domain/errors.ts";
import { TRANSPORT_MODES, type JourneyOption, type JourneyRequest, type Place, type SearchPlacesRequest } from "../../domain/models.ts";
import type { TransportProvider } from "../../domain/transport-provider.ts";
import placesFixture from "./fixtures/places.json" with { type: "json" };
import journeysFixture from "./fixtures/journeys.json" with { type: "json" };

export const DEMO_PROVIDER_NOTICE = "Données de démonstration — non temps réel";

const coordinatesSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

const placeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["station", "stop", "public-place"]),
  coordinates: coordinatesSchema,
});

const fixtureLegSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(TRANSPORT_MODES),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  durationMinutes: z.number().int().nonnegative(),
  distanceMeters: z.number().int().nonnegative(),
  lineName: z.string().min(1).optional(),
  geometry: z.array(z.tuple([z.number(), z.number()])).min(2).optional(),
});

const fixtureJourneySchema = z.object({
  id: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  distanceMeters: z.number().int().positive(),
  transfers: z.number().int().nonnegative(),
  legs: z.array(fixtureLegSchema).min(1),
});

const places = z.array(placeSchema).parse(placesFixture);
const journeyFixtures = z.record(z.string(), z.array(fixtureJourneySchema).min(2)).parse(journeysFixture);
const placesById = new Map(places.map((place) => [place.id, place]));

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLocaleLowerCase("fr")
    .trim();
}

function resolvePlace(id: string): Place {
  const place = placesById.get(id);
  if (!place) throw new Error(`Invalid demo fixture: unknown place '${id}'.`);
  return place;
}

function distanceMeters(first: Place, second: Place): number {
  const radius = 6_371_000;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.coordinates.latitude - first.coordinates.latitude);
  const longitudeDelta = radians(second.coordinates.longitude - first.coordinates.longitude);
  const firstLatitude = radians(first.coordinates.latitude);
  const secondLatitude = radians(second.coordinates.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(2 * radius * Math.asin(Math.sqrt(value)));
}

function createGenericDemoJourneys(request: JourneyRequest): readonly JourneyOption[] {
  const origin = request.origin ?? placesById.get(request.originId);
  const destination = request.destination ?? placesById.get(request.destinationId);
  if (!origin || !destination) {
    throw new JourneyNotSupportedError("Le fournisseur de démonstration ne connaît pas ces lieux.");
  }

  const distance = Math.max(distanceMeters(origin, destination), 100);
  const geometry = {
    type: "LineString" as const,
    coordinates: [
      [origin.coordinates.longitude, origin.coordinates.latitude],
      [destination.coordinates.longitude, destination.coordinates.latitude],
    ] as [number, number][],
  };
  const options: JourneyOption[] = [
    {
      id: `demo-${origin.id}-${destination.id}-walk`,
      durationMinutes: Math.max(2, Math.ceil(distance / 80)),
      distanceMeters: distance,
      transfers: 0,
      isRealTime: false,
      legs: [{ id: "walk-direct", mode: "walk", from: origin, to: destination, durationMinutes: Math.max(2, Math.ceil(distance / 80)), distanceMeters: distance, geometry }],
    },
    {
      id: `demo-${origin.id}-${destination.id}-bike`,
      durationMinutes: Math.max(5, Math.ceil(distance / 250) + 4),
      distanceMeters: distance + 200,
      transfers: 0,
      isRealTime: false,
      legs: [
        { id: "walk-bike", mode: "walk", from: origin, to: origin, durationMinutes: 2, distanceMeters: 100 },
        { id: "bike-direct", mode: "bike", from: origin, to: destination, durationMinutes: Math.max(3, Math.ceil(distance / 250)), distanceMeters: distance, lineName: "Vélo de démonstration", geometry },
        { id: "walk-arrival", mode: "walk", from: destination, to: destination, durationMinutes: 2, distanceMeters: 100 },
      ],
    },
    {
      id: `demo-${origin.id}-${destination.id}-bus`,
      durationMinutes: Math.max(9, Math.ceil(distance / 300) + 8),
      distanceMeters: distance + 500,
      transfers: 0,
      isRealTime: false,
      legs: [
        { id: "walk-bus", mode: "walk", from: origin, to: origin, durationMinutes: 4, distanceMeters: 250 },
        { id: "bus-direct", mode: "bus", from: origin, to: destination, durationMinutes: Math.max(3, Math.ceil(distance / 300)), distanceMeters: distance, lineName: "Bus de démonstration", geometry },
        { id: "walk-final", mode: "walk", from: destination, to: destination, durationMinutes: 4, distanceMeters: 250 },
      ],
    },
  ];
  const allowedModes = request.allowedModes ? new Set(request.allowedModes) : undefined;
  return options.filter((option) => !allowedModes || option.legs.every((leg) => allowedModes.has(leg.mode)));
}

export class DemoTransportProvider implements TransportProvider {
  readonly descriptor = {
    id: "demo",
    displayName: "UrbanFlow Demo",
    isDemo: true,
    isRealTime: false,
    notice: DEMO_PROVIDER_NOTICE,
  } as const;

  async searchPlaces(request: SearchPlacesRequest): Promise<readonly Place[]> {
    const query = normalizeText(request.query);
    const limit = Math.min(Math.max(request.limit ?? 10, 1), 20);
    if (query.length < 2) return [];

    return places
      .filter((place) => normalizeText(place.name).includes(query))
      .slice(0, limit);
  }

  async planJourney(request: JourneyRequest): Promise<readonly JourneyOption[]> {
    const fixtureKey = `${request.originId}:${request.destinationId}`;
    const candidates = journeyFixtures[fixtureKey];
    if (!candidates) {
      return createGenericDemoJourneys(request);
    }

    const allowedModes = request.allowedModes ? new Set(request.allowedModes) : undefined;
    return candidates
      .filter((candidate) => !allowedModes || candidate.legs.every((leg) => allowedModes.has(leg.mode)))
      .map((candidate) => ({
        id: candidate.id,
        durationMinutes: candidate.durationMinutes,
        distanceMeters: candidate.distanceMeters,
        transfers: candidate.transfers,
        isRealTime: false,
        legs: candidate.legs.map((leg) => ({
          id: leg.id,
          mode: leg.mode,
          from: resolvePlace(leg.fromId),
          to: resolvePlace(leg.toId),
          durationMinutes: leg.durationMinutes,
          distanceMeters: leg.distanceMeters,
          ...(leg.lineName ? { lineName: leg.lineName } : {}),
          ...(leg.geometry
            ? { geometry: { type: "LineString" as const, coordinates: leg.geometry } }
            : {}),
        })),
      }));
  }
}
