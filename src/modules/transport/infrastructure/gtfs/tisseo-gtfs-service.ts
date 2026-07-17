import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { constants } from "node:fs";
import { GtfsDataUnavailableError, GtfsValidationError } from "../../domain/errors.ts";
import type { Coordinates } from "../../domain/models.ts";

export interface GtfsStop {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface GtfsLine {
  id: string;
  shortName: string;
  longName: string;
  type: string;
}

interface GtfsRouteRow {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
}

interface GtfsTripRow {
  route_id: string;
  trip_id: string;
}

interface GtfsStopTimeRow {
  trip_id: string;
  stop_id: string;
}

function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift()?.map((value) => value.replace(/^\uFEFF/, "").trim());
  if (!header) return [];
  return rows.map((values) =>
    Object.fromEntries(header.map((name, index) => [name, values[index] ?? ""])),
  );
}

function requireColumns(fileName: string, rows: Record<string, string>[], columns: string[]): void {
  const first = rows[0];
  if (!first) throw new GtfsValidationError(`${fileName} is empty.`);
  const missing = columns.filter((column) => !(column in first));
  if (missing.length > 0) {
    throw new GtfsValidationError(`${fileName} is missing required columns: ${missing.join(", ")}.`);
  }
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function distanceMeters(first: Coordinates, second: Coordinates): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

async function readGtfsFile(directory: string, fileName: string): Promise<Record<string, string>[]> {
  const path = join(directory, fileName);
  try {
    await access(path, constants.R_OK);
    return parseCsv(await readFile(path, "utf8"));
  } catch (error) {
    if (error instanceof GtfsValidationError) throw error;
    throw new GtfsDataUnavailableError(
      `GTFS file '${fileName}' is unavailable in '${directory}'. Run npm run gtfs:download or configure TISSEO_GTFS_PATH.`,
    );
  }
}

export class TisseoGtfsService {
  private readonly stops: readonly GtfsStop[];
  private readonly routesById: ReadonlyMap<string, GtfsLine>;
  private readonly routeIdByTripId: ReadonlyMap<string, string>;
  private readonly tripIdsByStopId: ReadonlyMap<string, ReadonlySet<string>>;

  private constructor(
    stops: readonly GtfsStop[],
    routesById: ReadonlyMap<string, GtfsLine>,
    routeIdByTripId: ReadonlyMap<string, string>,
    tripIdsByStopId: ReadonlyMap<string, ReadonlySet<string>>,
  ) {
    this.stops = stops;
    this.routesById = routesById;
    this.routeIdByTripId = routeIdByTripId;
    this.tripIdsByStopId = tripIdsByStopId;
  }

  static async load(directory: string): Promise<TisseoGtfsService> {
    const gtfsDirectory = resolve(directory);
    const [stopRows, routeRows, tripRows, stopTimeRows] = await Promise.all([
      readGtfsFile(gtfsDirectory, "stops.txt"),
      readGtfsFile(gtfsDirectory, "routes.txt"),
      readGtfsFile(gtfsDirectory, "trips.txt"),
      readGtfsFile(gtfsDirectory, "stop_times.txt"),
    ]);

    requireColumns("stops.txt", stopRows, ["stop_id", "stop_name", "stop_lat", "stop_lon"]);
    requireColumns("routes.txt", routeRows, ["route_id", "route_short_name", "route_long_name", "route_type"]);
    requireColumns("trips.txt", tripRows, ["route_id", "trip_id"]);
    requireColumns("stop_times.txt", stopTimeRows, ["trip_id", "stop_id"]);

    const stops = stopRows.map((row) => {
      const latitude = Number(row.stop_lat);
      const longitude = Number(row.stop_lon);
      if (!row.stop_id || !row.stop_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new GtfsValidationError(`stops.txt contains an invalid stop row for '${row.stop_id ?? "unknown"}'.`);
      }
      return { id: row.stop_id, name: row.stop_name, coordinates: { latitude, longitude } };
    });

    const routesById = new Map<string, GtfsLine>();
    for (const row of routeRows as unknown as GtfsRouteRow[]) {
      if (!row.route_id) throw new GtfsValidationError("routes.txt contains an empty route_id.");
      routesById.set(row.route_id, {
        id: row.route_id,
        shortName: row.route_short_name,
        longName: row.route_long_name,
        type: row.route_type,
      });
    }

    const routeIdByTripId = new Map<string, string>();
    for (const row of tripRows as unknown as GtfsTripRow[]) {
      if (!row.trip_id || !routesById.has(row.route_id)) {
        throw new GtfsValidationError(`trips.txt references an invalid trip or route '${row.trip_id}'.`);
      }
      routeIdByTripId.set(row.trip_id, row.route_id);
    }

    const tripIdsByStopId = new Map<string, Set<string>>();
    for (const row of stopTimeRows as unknown as GtfsStopTimeRow[]) {
      if (!row.stop_id || !routeIdByTripId.has(row.trip_id)) continue;
      const tripIds = tripIdsByStopId.get(row.stop_id) ?? new Set<string>();
      tripIds.add(row.trip_id);
      tripIdsByStopId.set(row.stop_id, tripIds);
    }

    return new TisseoGtfsService(stops, routesById, routeIdByTripId, tripIdsByStopId);
  }

  searchStops(query: string, limit = 20): readonly GtfsStop[] {
    const normalizedQuery = normalize(query);
    if (normalizedQuery.length < 2) return [];
    return this.stops
      .filter((stop) => normalize(stop.name).includes(normalizedQuery))
      .slice(0, Math.min(Math.max(limit, 1), 100));
  }

  findNearbyStops(coordinates: Coordinates, radiusMeters = 500, limit = 20): readonly GtfsStop[] {
    if (radiusMeters <= 0) return [];
    return this.stops
      .map((stop) => ({ stop, distance: distanceMeters(coordinates, stop.coordinates) }))
      .filter(({ distance }) => distance <= radiusMeters)
      .sort((first, second) => first.distance - second.distance)
      .slice(0, Math.min(Math.max(limit, 1), 100))
      .map(({ stop }) => stop);
  }

  getLinesServingStop(stopId: string): readonly GtfsLine[] {
    const routeIds = new Set<string>();
    for (const tripId of this.tripIdsByStopId.get(stopId) ?? []) {
      const routeId = this.routeIdByTripId.get(tripId);
      if (routeId) routeIds.add(routeId);
    }
    return [...routeIds]
      .map((routeId) => this.routesById.get(routeId))
      .filter((line): line is GtfsLine => line !== undefined)
      .sort((first, second) => first.shortName.localeCompare(second.shortName, "fr"));
  }
}
