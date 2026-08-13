export const TRANSPORT_MODES = [
  "walk",
  "bike",
  "bus",
  "metro",
  "tram",
  "train",
] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Place {
  id: string;
  name: string;
  kind: "station" | "stop" | "public-place" | "current-location";
  coordinates: Coordinates;
}

export interface SearchPlacesRequest {
  query: string;
  limit?: number;
}

export interface JourneyRequest {
  originId: string;
  destinationId: string;
  departureAt?: Date;
  allowedModes?: readonly TransportMode[];
  maxWalkingMinutes?: number;
  reducedMobility?: boolean;
  origin?: Place;
  destination?: Place;
}

export interface JourneyGeometry {
  type: "LineString";
  coordinates: readonly [longitude: number, latitude: number][];
}

export interface JourneyLeg {
  id: string;
  mode: TransportMode;
  from: Place;
  to: Place;
  durationMinutes: number;
  durationSeconds?: number;
  distanceMeters: number;
  departureAt?: Date;
  arrivalAt?: Date;
  lineName?: string;
  direction?: string;
  stopCount?: number;
  accessibility?: string;
  geometry?: JourneyGeometry;
}

export interface JourneyOption {
  id: string;
  departureAt?: Date;
  arrivalAt?: Date;
  durationMinutes: number;
  distanceMeters: number;
  transfers: number;
  legs: readonly JourneyLeg[];
  isRealTime: boolean;
}

export interface TransportProviderDescriptor {
  id: string;
  displayName: string;
  isDemo: boolean;
  isRealTime: boolean;
  notice?: string;
}
