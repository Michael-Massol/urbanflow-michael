import { JourneyNotSupportedError, TransportProviderError } from "../../domain/errors.ts";
import type {
  JourneyLeg,
  JourneyOption,
  JourneyRequest,
  Place,
  SearchPlacesRequest,
  TransportMode,
} from "../../domain/models.ts";
import type { TransportProvider } from "../../domain/transport-provider.ts";
import { geometryDistanceMeters, parseWktLineGeometry } from "./parse-wkt-geometry.ts";
import {
  tisseoJourneysResponseSchema,
  tisseoPlacesResponseSchema,
  type TisseoJourneyChunkDto,
  type TisseoJourneyDto,
  type TisseoPlaceDto,
} from "./tisseo-dtos.ts";

const TISSEO_NOTICE = "Horaires Tisséo — informations temps réel non garanties";
const DEFAULT_BASE_URL = "https://api.tisseo.fr/v2";
const DEFAULT_TIMEOUT_MS = 12_000;

const rollingStocksByMode: Partial<Record<TransportMode, readonly string[]>> = {
  metro: ["commercial_mode:1"],
  tram: ["commercial_mode:2"],
  bus: ["commercial_mode:3", "commercial_mode:10"],
  train: ["commercial_mode:5"],
};

type Fetcher = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

export interface TisseoTransportAdapterOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetcher?: Fetcher;
}

function parseDurationSeconds(value: string): number {
  const match = /^(\d+):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new TransportProviderError("invalid-response");
  return Number(match[1]) * 3_600 + Number(match[2]) * 60 + Number(match[3]);
}

const parisFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parisParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    parisFormatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function parseTisseoDateTime(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) throw new TransportProviderError("invalid-response");
  const desiredWallTime = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? "0"),
  );
  const guess = new Date(desiredWallTime);
  const parts = parisParts(guess);
  const representedWallTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const result = new Date(desiredWallTime - (representedWallTime - desiredWallTime));
  if (Number.isNaN(result.getTime())) throw new TransportProviderError("invalid-response");
  return result;
}

function formatTisseoDateTime(date: Date): string {
  const parts = parisParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function dateTimeFromClock(clock: string | undefined, journeyDeparture: Date): Date | undefined {
  if (!clock) return undefined;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(clock);
  if (!match) return undefined;
  const day = parisParts(journeyDeparture);
  let result = parseTisseoDateTime(
    `${day.year}-${day.month}-${day.day} ${match[1]}:${match[2]}:${match[3] ?? "00"}`,
  );
  if (result.getTime() < journeyDeparture.getTime() - 60 * 60_000) {
    result = new Date(result.getTime() + 24 * 60 * 60_000);
  }
  return result;
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function toTransportMode(value: string): TransportMode {
  const mode = normalizeText(value);
  if (mode.includes("metro")) return "metro";
  if (mode.includes("tram")) return "tram";
  if (mode.includes("train")) return "train";
  if (mode.includes("bus") || mode.includes("lineo") || mode.includes("navette")) return "bus";
  throw new TransportProviderError("invalid-response");
}

function toRoadMode(value: string | undefined): TransportMode {
  return normalizeText(value ?? "walk").includes("bike") ? "bike" : "walk";
}

function explicitRealtime(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === "1" || value === "yes") return true;
  if (value === false || value === 0 || value === "0" || value === "no") return false;
  return undefined;
}

function toPlace(dto: TisseoPlaceDto): Place {
  return {
    id: dto.id,
    name: dto.label,
    kind: dto.className === "stop" ? "stop" : "public-place",
    coordinates: { longitude: dto.x, latitude: dto.y },
  };
}

function coordinatePlace(
  id: string,
  name: string,
  coordinates: { longitude: number; latitude: number },
  kind: Place["kind"] = "public-place",
): Place {
  return {
    id,
    name: name.trim() || "Lieu non disponible",
    kind,
    coordinates: {
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
    },
  };
}

function addressLocation(container: TisseoJourneyChunkDto["street"] extends infer Street
  ? Street extends { startAddress?: infer Address } ? Address : never
  : never) {
  return container?.connectionPlace ?? container?.address;
}

function stopPlace(chunk: TisseoJourneyChunkDto | undefined, fallback: Place, id: string): Place {
  const stop = chunk?.stop;
  if (!stop) return fallback;
  const location = stop.connectionPlace;
  const longitude = location?.longitude ?? stop.longitude;
  const latitude = location?.latitude ?? stop.latitude;
  if (longitude === undefined || latitude === undefined) return fallback;
  return coordinatePlace(
    location?.id ?? id,
    location?.name ?? stop.name ?? fallback.name,
    { longitude, latitude },
    "stop",
  );
}

function nearestStop(
  chunks: readonly TisseoJourneyChunkDto[],
  index: number,
  direction: -1 | 1,
): TisseoJourneyChunkDto | undefined {
  for (let cursor = index + direction; cursor >= 0 && cursor < chunks.length; cursor += direction) {
    const chunk = chunks[cursor];
    if (chunk?.stop) return chunk;
    if (chunk?.service) return undefined;
  }
  return undefined;
}

function streetLeg(
  chunk: NonNullable<TisseoJourneyChunkDto["street"]>,
  index: number,
  chunkCount: number,
  journeyDeparture: Date,
  request: JourneyRequest,
): JourneyLeg {
  const geometry = parseWktLineGeometry(chunk.wkt);
  const start = addressLocation(chunk.startAddress);
  const end = addressLocation(chunk.endAddress);
  const geometryStart = geometry?.coordinates[0];
  const geometryEnd = geometry?.coordinates.at(-1);
  const isJourneyStart = index === 0;
  const isJourneyEnd = index === chunkCount - 1;
  const from = start
    ? coordinatePlace(
      `tisseo-street-${index}-from`,
      start.name ?? start.streetName ?? (isJourneyStart ? request.origin!.name : "Point de cheminement"),
      start,
    )
    : geometryStart
      ? coordinatePlace(
        `tisseo-street-${index}-from`,
        isJourneyStart ? request.origin!.name : "Point de cheminement",
        { longitude: geometryStart[0], latitude: geometryStart[1] },
      )
      : isJourneyStart
        ? request.origin!
        : undefined;
  const to = end
    ? coordinatePlace(
      `tisseo-street-${index}-to`,
      end.name ?? end.streetName ?? (isJourneyEnd ? request.destination!.name : "Point de cheminement"),
      end,
    )
    : geometryEnd
      ? coordinatePlace(
        `tisseo-street-${index}-to`,
        isJourneyEnd ? request.destination!.name : "Point de cheminement",
        { longitude: geometryEnd[0], latitude: geometryEnd[1] },
      )
      : isJourneyEnd
        ? request.destination!
        : undefined;
  if (!from || !to) throw new TransportProviderError("invalid-response");
  const durationSeconds = parseDurationSeconds(chunk.duration);
  const distanceMeters = chunk.length ?? (geometry ? geometryDistanceMeters(geometry) : 0);
  const legDepartureAt = dateTimeFromClock(chunk.departureTime, journeyDeparture);
  const legArrivalAt = dateTimeFromClock(chunk.arrivalTime, journeyDeparture);
  return {
    id: `tisseo-street-${index}`,
    mode: toRoadMode(chunk.roadMode),
    from,
    to,
    durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
    durationSeconds,
    distanceMeters,
    ...(legDepartureAt ? { departureAt: legDepartureAt } : {}),
    ...(legArrivalAt ? { arrivalAt: legArrivalAt } : {}),
    ...(geometry ? { geometry } : {}),
  };
}

function serviceLeg(
  chunk: NonNullable<TisseoJourneyChunkDto["service"]>,
  chunks: readonly TisseoJourneyChunkDto[],
  index: number,
  journeyDeparture: Date,
  request: JourneyRequest,
): JourneyLeg {
  const geometry = parseWktLineGeometry(chunk.wkt);
  const from = stopPlace(nearestStop(chunks, index, -1), request.origin!, `tisseo-service-${index}-from`);
  const to = stopPlace(nearestStop(chunks, index, 1), request.destination!, `tisseo-service-${index}-to`);
  const durationSeconds = parseDurationSeconds(chunk.duration);
  const line = chunk.destinationStop.line;
  const legDepartureAt = dateTimeFromClock(chunk.firstDepartureTime, journeyDeparture);
  const legArrivalAt = dateTimeFromClock(chunk.firstArrivalTime, journeyDeparture);
  const lineName = line.shortName || line.name;
  return {
    id: `tisseo-service-${index}`,
    mode: toTransportMode(line.transportMode.name),
    from,
    to,
    durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
    durationSeconds,
    distanceMeters: geometry ? geometryDistanceMeters(geometry) : 0,
    ...(legDepartureAt ? { departureAt: legDepartureAt } : {}),
    ...(legArrivalAt ? { arrivalAt: legArrivalAt } : {}),
    ...(lineName ? { lineName } : {}),
    ...(chunk.destinationStop.name ? { direction: chunk.destinationStop.name } : {}),
    ...(geometry ? { geometry } : {}),
  };
}

function toJourneyOption(dto: TisseoJourneyDto, index: number, request: JourneyRequest): JourneyOption {
  const departureAt = parseTisseoDateTime(dto.departureDateTime);
  const arrivalAt = parseTisseoDateTime(dto.arrivalDateTime);
  const legs = dto.chunks.flatMap((chunk, chunkIndex) => {
    if (chunk.street) return [streetLeg(chunk.street, chunkIndex, dto.chunks.length, departureAt, request)];
    if (chunk.service) return [serviceLeg(chunk.service, dto.chunks, chunkIndex, departureAt, request)];
    return [];
  });
  if (legs.length === 0) throw new TransportProviderError("invalid-response");
  const realtimeFlags = [dto.realTime, ...dto.chunks.map((chunk) => chunk.service?.realTime)]
    .map(explicitRealtime)
    .filter((value): value is boolean => value !== undefined);
  const serviceCount = legs.filter((leg) => !["walk", "bike"].includes(leg.mode)).length;
  const durationSeconds = parseDurationSeconds(dto.duration);

  return {
    id: `tisseo-${dto.departureDateTime.replace(/[^0-9]/g, "")}-${index}`,
    departureAt,
    arrivalAt,
    durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    transfers: Math.max(0, serviceCount - 1),
    legs,
    isRealTime: realtimeFlags.length > 0 && realtimeFlags.every(Boolean),
  };
}

export class TisseoTransportAdapter implements TransportProvider {
  readonly descriptor = {
    id: "tisseo",
    displayName: "Tisséo",
    isDemo: false,
    isRealTime: false,
    notice: TISSEO_NOTICE,
  } as const;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: Fetcher;

  constructor(options: TisseoTransportAdapterOptions) {
    const apiKey = options.apiKey.trim();
    if (!apiKey) throw new TransportProviderError("authentication");
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = options.fetcher ?? fetch;
  }

  private async request(endpoint: "places.json" | "journeys.json", params: Record<string, string>): Promise<unknown | undefined> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    url.searchParams.set("key", this.apiKey);

    let response: Response;
    try {
      response = await this.fetcher(url, {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "UrbanFlow-Mobility/1.1" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      throw new TransportProviderError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "unavailable");
    }

    if (response.status === 404) return undefined;
    if (response.status === 401 || response.status === 403) {
      throw new TransportProviderError("authentication", response.status);
    }
    if (response.status === 429) throw new TransportProviderError("rate-limit", 429);
    if (!response.ok) throw new TransportProviderError("unavailable", response.status);

    try {
      return await response.json();
    } catch {
      throw new TransportProviderError("invalid-response", response.status);
    }
  }

  async searchPlaces(request: SearchPlacesRequest): Promise<readonly Place[]> {
    const payload = await this.request("places.json", {
      term: request.query.trim(),
      number: String(Math.min(Math.max(request.limit ?? 10, 1), 10)),
    });
    if (payload === undefined) return [];
    const parsed = tisseoPlacesResponseSchema.safeParse(payload);
    if (!parsed.success) throw new TransportProviderError("invalid-response", 200);
    return parsed.data.placesList.place.slice(0, request.limit ?? 10).map(toPlace);
  }

  async planJourney(request: JourneyRequest): Promise<readonly JourneyOption[]> {
    if (!request.origin || !request.destination) {
      throw new JourneyNotSupportedError("Tisséo requires normalized origin and destination places.");
    }
    const allowedModes = new Set<TransportMode>(request.allowedModes ?? ["walk", "bus", "metro", "tram", "train"]);
    const rollingStocks = [...allowedModes].flatMap((mode) => rollingStocksByMode[mode] ?? []);
    if (rollingStocks.length === 0) {
      throw new JourneyNotSupportedError("No supported public transport mode is enabled.");
    }
    const roadMode = request.reducedMobility ? "wheelchair" : allowedModes.has("walk") ? "walk" : allowedModes.has("bike") ? "bike" : "walk";
    const roadSpeed = roadMode === "wheelchair" ? 0.556 : roadMode === "bike" ? 4.167 : 1.111;
    const maxApproachDistance = Math.round((request.maxWalkingMinutes ?? 20) * 60 * roadSpeed);
    const payload = await this.request("journeys.json", {
      departurePlaceXY: `${request.origin.coordinates.longitude},${request.origin.coordinates.latitude}`,
      arrivalPlaceXY: `${request.destination.coordinates.longitude},${request.destination.coordinates.latitude}`,
      srid: "4326",
      firstDepartureDatetime: formatTisseoDateTime(request.departureAt ?? new Date()),
      rollingStockList: [...new Set(rollingStocks)].join(","),
      roadMode,
      startRoadMode: roadMode,
      roadMaxDistance: String(maxApproachDistance),
      startRoadMaxDistance: String(maxApproachDistance),
      maxApproachDistance: String(maxApproachDistance),
      number: "3",
      displayWording: "1",
      displayMessages: "1",
      lang: "fr",
    });
    if (payload === undefined) return [];
    const parsed = tisseoJourneysResponseSchema.safeParse(payload);
    if (!parsed.success) throw new TransportProviderError("invalid-response", 200);
    return parsed.data.routePlannerResult.journeys.map(({ journey }, index) => toJourneyOption(journey, index, request));
  }
}

export { TISSEO_NOTICE };
