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
  kind: "station" | "stop" | "public-place";
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
  distanceMeters: number;
  lineName?: string;
  geometry?: JourneyGeometry;
}

export interface JourneyOption {
  id: string;
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
