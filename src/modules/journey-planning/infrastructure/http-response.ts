import { ZodError } from "zod";
import { JourneyNotSupportedError, TransportConfigurationError } from "../../transport/domain/errors.ts";
import type { ActionResult } from "../domain/models.ts";

export function toSafeErrorResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues
        .filter((issue) => issue.path.length > 0)
        .map((issue) => [String(issue.path[0]), issue.message]),
    );
    return {
      status: "error",
      message: error.issues[0]?.message ?? "Les critères sont invalides.",
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    };
  }
  if (error instanceof JourneyNotSupportedError) {
    return { status: "error", message: "Aucun trajet de démonstration n’est disponible pour cette recherche." };
  }
  if (error instanceof TransportConfigurationError) {
    return { status: "error", message: "Le fournisseur de transport est mal configuré." };
  }
  return { status: "error", message: "Le service de transport est temporairement indisponible." };
}

export const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" } as const;
