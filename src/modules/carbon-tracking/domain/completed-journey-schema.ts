import { z } from "zod";
import { journeyModes } from "../../journey-planning/domain/models.ts";
import { journeyGeometrySchema, journeyPlaceSchema } from "../../journey-planning/domain/schemas.ts";

const segmentSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(journeyModes),
  origin: journeyPlaceSchema,
  destination: journeyPlaceSchema,
  departureAt: z.iso.datetime({ offset: true }),
  arrivalAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative(),
  lineName: z.string().optional(),
  direction: z.string().optional(),
  stopCount: z.number().int().nonnegative().optional(),
  geometry: journeyGeometrySchema.optional(),
  accessibility: z.string().optional(),
});

export const completedJourneyInputSchema = z.object({
  id: z.string().min(1),
  departureAt: z.iso.datetime({ offset: true }),
  arrivalAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().positive(),
  walkingMinutes: z.number().int().nonnegative(),
  transferCount: z.number().int().nonnegative(),
  modes: z.array(z.enum(journeyModes)).min(1),
  segments: z.array(segmentSchema).min(1),
  geometry: journeyGeometrySchema.optional(),
  provider: z.string().min(1),
  realtime: z.boolean(),
  notice: z.string().optional(),
});
