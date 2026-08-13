import { z } from "zod";

const numericValue = z.union([z.number(), z.string().trim().min(1)]).transform((value, context) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    context.addIssue({ code: "custom", message: "Expected a finite numeric value." });
    return z.NEVER;
  }
  return parsed;
});

const wordingSchema = z.object({ text: z.string().optional() }).passthrough();

const locationSchema = z.object({
  latitude: numericValue,
  longitude: numericValue,
  streetName: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  city: z.string().optional(),
}).passthrough();

const addressContainerSchema = z.object({
  connectionPlace: locationSchema.optional(),
  address: locationSchema.optional(),
}).passthrough();

export const tisseoPlacesResponseSchema = z.object({
  expirationDate: z.string().optional(),
  placesList: z.object({
    place: z.array(z.object({
      id: z.string().min(1),
      key: z.string().optional(),
      label: z.string().min(1),
      className: z.string().min(1),
      category: z.string().optional(),
      network: z.string().optional(),
      x: numericValue,
      y: numericValue,
    }).passthrough()).default([]),
  }).passthrough(),
}).passthrough();

const streetSchema = z.object({
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  duration: z.string().min(1),
  length: numericValue.optional(),
  roadMode: z.string().optional(),
  startAddress: addressContainerSchema.optional(),
  endAddress: addressContainerSchema.optional(),
  text: wordingSchema.optional(),
  wkt: z.string().optional(),
}).passthrough();

const stopSchema = z.object({
  connectionPlace: locationSchema.optional(),
  latitude: numericValue.optional(),
  longitude: numericValue.optional(),
  name: z.string().optional(),
  firstTime: z.string().optional(),
  lastTime: z.string().optional(),
  text: wordingSchema.optional(),
  wkt: z.string().optional(),
}).passthrough();

const transportModeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
}).passthrough();

const lineSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  transportMode: transportModeSchema,
}).passthrough();

const serviceSchema = z.object({
  firstDepartureTime: z.string().optional(),
  firstArrivalTime: z.string().optional(),
  duration: z.string().min(1),
  destinationStop: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    line: lineSchema,
  }).passthrough(),
  text: wordingSchema.optional(),
  wkt: z.string().optional(),
  realTime: z.union([z.string(), z.number(), z.boolean()]).optional(),
}).passthrough();

export const tisseoJourneyChunkSchema = z.object({
  street: streetSchema.optional(),
  stop: stopSchema.optional(),
  service: serviceSchema.optional(),
}).refine((chunk) => Boolean(chunk.street || chunk.stop || chunk.service), {
  message: "Unsupported Tisséo journey chunk.",
});

export const tisseoJourneysResponseSchema = z.object({
  expirationDate: z.string().optional(),
  routePlannerResult: z.object({
    query: z.unknown().optional(),
    journeys: z.array(z.object({
      journey: z.object({
        arrivalDateTime: z.string().min(1),
        departureDateTime: z.string().min(1),
        duration: z.string().min(1),
        co2_emissions: z.union([z.string(), z.number()]).optional(),
        realTime: z.union([z.string(), z.number(), z.boolean()]).optional(),
        chunks: z.array(tisseoJourneyChunkSchema).min(1),
      }).passthrough(),
    }).passthrough()).default([]),
  }).passthrough(),
}).passthrough();

export type TisseoPlaceDto = z.infer<typeof tisseoPlacesResponseSchema>["placesList"]["place"][number];
export type TisseoJourneyDto = z.infer<typeof tisseoJourneysResponseSchema>["routePlannerResult"]["journeys"][number]["journey"];
export type TisseoJourneyChunkDto = z.infer<typeof tisseoJourneyChunkSchema>;
