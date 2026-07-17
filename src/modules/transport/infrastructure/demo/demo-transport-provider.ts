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
      throw new JourneyNotSupportedError(
        `The demo provider does not support '${request.originId}' to '${request.destinationId}'.`,
      );
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
