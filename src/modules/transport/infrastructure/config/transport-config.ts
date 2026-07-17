import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const transportConfigSchema = z
  .object({
    TRANSPORT_PROVIDER: z.enum(["demo", "tisseo"]).default("demo"),
    TISSEO_API_KEY: optionalTrimmedString,
    TISSEO_GTFS_PATH: optionalTrimmedString,
  })
  .superRefine((config, context) => {
    if (config.TRANSPORT_PROVIDER === "tisseo" && !config.TISSEO_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["TISSEO_API_KEY"],
        message: "TISSEO_API_KEY is required when TRANSPORT_PROVIDER=tisseo.",
      });
    }
  });

export type TransportConfig = z.infer<typeof transportConfigSchema>;

export function parseTransportConfig(environment: NodeJS.ProcessEnv): TransportConfig {
  return transportConfigSchema.parse(environment);
}
