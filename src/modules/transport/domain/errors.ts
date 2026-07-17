export class TransportConfigurationError extends Error {
  override readonly name = "TransportConfigurationError";
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
