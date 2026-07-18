import type { ZodError } from "zod";

const defaultValidationMessage = "Les informations saisies sont invalides.";

export function getValidationErrorMessage(error: ZodError): string {
  const firstReadableMessage = error.issues.find(
    (issue) => issue.message.trim().length > 0,
  )?.message;

  return firstReadableMessage ?? defaultValidationMessage;
}
