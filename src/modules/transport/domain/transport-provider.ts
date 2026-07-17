import type {
  JourneyOption,
  JourneyRequest,
  Place,
  SearchPlacesRequest,
  TransportProviderDescriptor,
} from "./models.ts";

export interface TransportProvider {
  readonly descriptor: TransportProviderDescriptor;
  searchPlaces(request: SearchPlacesRequest): Promise<readonly Place[]>;
  planJourney(request: JourneyRequest): Promise<readonly JourneyOption[]>;
}
