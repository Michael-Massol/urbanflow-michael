import type { TransportProvider } from "../../transport/domain/transport-provider.ts";
import { searchPlacesInputSchema } from "../domain/schemas.ts";
import type { JourneyPlace } from "../domain/models.ts";
import { toJourneyPlace } from "./transport-mappers.ts";

export async function searchPlaces(
  provider: TransportProvider,
  input: unknown,
): Promise<JourneyPlace[]> {
  const validated = searchPlacesInputSchema.parse(input);
  const places = await provider.searchPlaces(validated);
  return places.slice(0, validated.limit).map((place) => toJourneyPlace(place, provider.descriptor.id));
}
