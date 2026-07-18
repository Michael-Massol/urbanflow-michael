export const journeyModes = ["walking", "metro", "tram", "bus", "bike", "train"] as const;
export type JourneyMode = (typeof journeyModes)[number];

export type PlaceType = "stop" | "address" | "point_of_interest" | "current_location";

export interface JourneyPlace {
  id: string;
  label: string;
  type: PlaceType;
  latitude: number;
  longitude: number;
  source: string;
  context?: string | undefined;
}

export interface JourneySearchCriteria {
  origin: JourneyPlace;
  destination: JourneyPlace;
  departureAt: string;
  preferredModes: JourneyMode[];
  avoidedModes: JourneyMode[];
  maxWalkingMinutes: number;
  reducedMobility: boolean;
}

export interface JourneyGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface JourneySegment {
  id: string;
  mode: JourneyMode;
  origin: JourneyPlace;
  destination: JourneyPlace;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  distanceMeters?: number;
  lineName?: string;
  direction?: string;
  stopCount?: number;
  geometry?: JourneyGeometry;
  accessibility?: string;
}

export interface Journey {
  id: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  walkingMinutes: number;
  transferCount: number;
  modes: JourneyMode[];
  segments: JourneySegment[];
  geometry?: JourneyGeometry;
  provider: string;
  realtime: boolean;
  notice?: string;
}

export type JourneySort = "recommended" | "fastest" | "least-walking" | "fewest-transfers";

export interface JourneyPlanResult {
  journeys: Journey[];
  notice?: string;
  isDemo: boolean;
  isRealTime: boolean;
}

export type ActionResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };
