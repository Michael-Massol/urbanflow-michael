export class TransportConfigurationError extends Error {
  override readonly name = "TransportConfigurationError";
}

export type TransportProviderErrorCode =
  | "authentication"
  | "rate-limit"
  | "timeout"
  | "unavailable"
  | "invalid-response";

export class TransportProviderError extends Error {
  override readonly name = "TransportProviderError";
  readonly code: TransportProviderErrorCode;
  readonly status: number | undefined;

  constructor(code: TransportProviderErrorCode, status?: number) {
    super(`Transport provider failure: ${code}.`);
    this.code = code;
    this.status = status;
  }
}

export class JourneyNotSupportedError extends Error {
  override readonly name = "JourneyNotSupportedError";
}

export class GtfsDataUnavailableError extends Error {
  override readonly name = "GtfsDataUnavailableError";
}

export class GtfsValidationError extends Error {
  override readonly name = "GtfsValidationError";
}
