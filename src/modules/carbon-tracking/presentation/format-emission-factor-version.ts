const TECHNICAL_VERSION_PREFIX = "urbanflow-ademe-";

export function formatEmissionFactorVersion(version: string): string {
  const readableVersion = version.startsWith(TECHNICAL_VERSION_PREFIX)
    ? version.slice(TECHNICAL_VERSION_PREFIX.length)
    : version;

  return `ADEME — version ${readableVersion}`;
}
