import { z } from "zod";

export const transportModes = ["walking", "bike", "metro", "bus", "tram"] as const;
export type MobilityMode = (typeof transportModes)[number];

export const mobilityPreferencesSchema = z
  .object({
    preferredModes: z.array(z.enum(transportModes)).max(transportModes.length),
    avoidedModes: z.array(z.enum(transportModes)).max(transportModes.length),
    maxWalkingMinutes: z.number().int().min(0).max(120),
    reducedMobility: z.boolean(),
  })
  .superRefine((preferences, context) => {
    const avoided = new Set(preferences.avoidedModes);
    if (preferences.preferredModes.some((mode) => avoided.has(mode))) {
      context.addIssue({
        code: "custom",
        path: ["avoidedModes"],
        message: "Un mode ne peut pas être à la fois préféré et évité.",
      });
    }
  });

export interface MobilityPreferences {
  userId: string;
  preferredModes: MobilityMode[];
  avoidedModes: MobilityMode[];
  maxWalkingMinutes: number;
  reducedMobility: boolean;
  updatedAt: string;
}

export interface MobilityPreferencesRepository {
  findByUserId(userId: string): Promise<MobilityPreferences | null>;
  update(userId: string, preferences: Omit<MobilityPreferences, "userId" | "updatedAt">): Promise<MobilityPreferences>;
}

export const defaultMobilityPreferences = {
  preferredModes: [] as MobilityMode[],
  avoidedModes: [] as MobilityMode[],
  maxWalkingMinutes: 20,
  reducedMobility: false,
};
