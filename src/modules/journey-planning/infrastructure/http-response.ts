import { ZodError } from "zod";
import { JourneyNotSupportedError, TransportConfigurationError, TransportProviderError } from "../../transport/domain/errors.ts";
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
    return { status: "error", message: "Aucun itinéraire n’a été trouvé." };
  }
  if (error instanceof TransportConfigurationError) {
    return { status: "error", message: "Le fournisseur de transport est mal configuré." };
  }
  if (error instanceof TransportProviderError) {
    if (error.code === "authentication") {
      return { status: "error", message: "La configuration du fournisseur de transport est invalide." };
    }
    if (error.code === "invalid-response") {
      return { status: "error", message: "Le service Tisséo a retourné une réponse incompatible." };
    }
    return { status: "error", message: "Le service Tisséo est temporairement indisponible." };
  }
  return { status: "error", message: "Le service de transport est temporairement indisponible." };
}

export function safeErrorStatus(error: unknown): number {
  if (error instanceof ZodError || error instanceof JourneyNotSupportedError) return 400;
  if (error instanceof TransportProviderError && error.code === "invalid-response") return 502;
  if (error instanceof TransportProviderError || error instanceof TransportConfigurationError) return 503;
  return 500;
}

export const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" } as const;
