const SENSITIVE_QUERY_PARAMETERS = new Set(["key", "token", "api_key"]);

export interface GeometryObservation {
  path: string;
  kind: "coordinate-pair" | "coordinate-sequence" | "encoded-string";
  points?: number;
}

export interface PayloadSummary {
  rootType: string;
  rootKeys: string[];
  arrayLengths: Record<string, number>;
  geometry: GeometryObservation[];
}

export function sanitizeUrl(input: string): string {
  const url = new URL(input);
  for (const parameter of SENSITIVE_QUERY_PARAMETERS) {
    if (url.searchParams.has(parameter)) {
      url.searchParams.set(parameter, "<redacted>");
    }
  }
  return url.toString();
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function looksLikeCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1])
  );
}

export function summarizePayload(payload: unknown): PayloadSummary {
  const arrayLengths: Record<string, number> = {};
  const geometry: GeometryObservation[] = [];
  const visited = new WeakSet<object>();

  function visit(value: unknown, path: string): void {
    if (typeof value === "string") {
      if (/polyline|geometry|shape|\.wkt$/i.test(path) && value.length > 5) {
        geometry.push({ path, kind: "encoded-string" });
      }
      return;
    }

    if (value === null || typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      arrayLengths[path] = value.length;
      if (looksLikeCoordinatePair(value)) {
        geometry.push({ path, kind: "coordinate-pair" });
        return;
      }
      if (value.length > 0 && value.every(looksLikeCoordinatePair)) {
        geometry.push({ path, kind: "coordinate-sequence", points: value.length });
        return;
      }
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, path === "$" ? `$.${key}` : `${path}.${key}`);
    }
  }

  visit(payload, "$" );

  return {
    rootType: Array.isArray(payload) ? "array" : payload === null ? "null" : typeof payload,
    rootKeys:
      payload !== null && typeof payload === "object" && !Array.isArray(payload)
        ? Object.keys(payload).sort()
        : [],
    arrayLengths,
    geometry,
  };
}
