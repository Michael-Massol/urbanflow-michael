import { z } from "zod";
import { journeyModes } from "./models.ts";

export const journeyPlaceSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1),
  type: z.enum(["stop", "address", "point_of_interest", "current_location"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.string().min(1),
  context: z.string().trim().min(1).optional(),
});

export const searchPlacesInputSchema = z.object({
  query: z.string().trim().min(2, "Saisissez au moins 2 caractères."),
  limit: z.coerce.number().int().min(1).max(10).default(6),
});

export const planJourneyInputSchema = z.object({
  origin: journeyPlaceSchema,
  destination: journeyPlaceSchema,
  departureAt: z.iso.datetime({ offset: true }),
  preferredModes: z.array(z.enum(journeyModes)).default([]),
  avoidedModes: z.array(z.enum(journeyModes)).default([]),
  maxWalkingMinutes: z.number().int().min(0).max(120).default(20),
  reducedMobility: z.boolean().default(false),
}).superRefine((criteria, context) => {
  if (criteria.origin.id === criteria.destination.id) {
    context.addIssue({ code: "custom", path: ["destination"], message: "Le départ et l’arrivée doivent être différents." });
  }
  const avoided = new Set(criteria.avoidedModes);
  if (criteria.preferredModes.some((mode) => avoided.has(mode))) {
    context.addIssue({ code: "custom", path: ["avoidedModes"], message: "Un mode ne peut pas être préféré et évité." });
  }
});
