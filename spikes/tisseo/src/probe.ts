import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sanitizeUrl, summarizePayload, type PayloadSummary } from "./analysis.ts";

const apiKey = process.env.TISSEO_API_KEY?.trim();
const baseUrl = (process.env.TISSEO_API_BASE_URL ?? "https://api.tisseo.fr/v2").replace(/\/$/, "");
const timeoutMs = 12_000;

interface ProbeCase {
  name: string;
  endpoint: "places.json" | "journeys.json";
  params: Record<string, string>;
  authentication: "none" | "invalid" | "configured";
}

interface ProbeResult {
  name: string;
  requestUrl: string;
  authentication: ProbeCase["authentication"];
  status: number | null;
  contentType: string | null;
  durationMs: number;
  rateLimitHeaders: Record<string, string>;
  bodyKind: "json" | "text" | "unavailable";
  textPreview?: string;
  payloadSummary?: PayloadSummary;
  transportError?: string;
}

const cases: ProbeCase[] = [
  {
    name: "places-without-key",
    endpoint: "places.json",
    params: { term: "capitole", number: "2" },
    authentication: "none",
  },
  {
    name: "places-with-invalid-key",
    endpoint: "places.json",
    params: { term: "capitole", number: "2" },
    authentication: "invalid",
  },
];

if (apiKey) {
  cases.push(
    {
      name: "places-success",
      endpoint: "places.json",
      params: { term: "capitole", number: "5" },
      authentication: "configured",
    },
    {
      name: "places-short-term-behavior",
      endpoint: "places.json",
      params: { term: "ca", number: "2" },
      authentication: "configured",
    },
    {
      name: "places-missing-search-error",
      endpoint: "places.json",
      params: {},
      authentication: "configured",
    },
    {
      name: "journey-toulouse-success",
      endpoint: "journeys.json",
      params: {
        departurePlace: "capitole toulouse",
        arrivalPlace: "marengo sncf toulouse",
        number: "2",
        displayWording: "1",
      },
      authentication: "configured",
    },
    {
      name: "journey-missing-arrival-error",
      endpoint: "journeys.json",
      params: { departurePlace: "capitole toulouse", number: "1" },
      authentication: "configured",
    },
  );
}

function buildUrl(probeCase: ProbeCase): URL {
  const url = new URL(`${baseUrl}/${probeCase.endpoint}`);
  Object.entries(probeCase.params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (probeCase.authentication === "invalid") url.searchParams.set("key", "urbanflow-invalid-spike-key");
  if (probeCase.authentication === "configured" && apiKey) url.searchParams.set("key", apiKey);
  return url;
}

function rateLimitHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of headers.entries()) {
    if (/rate|quota|retry-after/i.test(name)) result[name] = value;
  }
  return result;
}

async function runCase(probeCase: ProbeCase): Promise<ProbeResult> {
  const url = buildUrl(probeCase);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json", "User-Agent": "UrbanFlow-Tisseo-Spike/1.0" },
    });
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    let parsed: unknown;
    if (contentType?.toLowerCase().includes("json")) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }

    return {
      name: probeCase.name,
      requestUrl: sanitizeUrl(url.toString()),
      authentication: probeCase.authentication,
      status: response.status,
      contentType,
      durationMs: Math.round(performance.now() - startedAt),
      rateLimitHeaders: rateLimitHeaders(response.headers),
      bodyKind: parsed === undefined ? "text" : "json",
      ...(parsed === undefined
        ? { textPreview: text.slice(0, 160) }
        : { payloadSummary: summarizePayload(parsed) }),
    };
  } catch (error) {
    return {
      name: probeCase.name,
      requestUrl: sanitizeUrl(url.toString()),
      authentication: probeCase.authentication,
      status: null,
      contentType: null,
      durationMs: Math.round(performance.now() - startedAt),
      rateLimitHeaders: {},
      bodyKind: "unavailable",
      transportError: error instanceof Error ? error.message : "Unknown transport error",
    };
  }
}

const results: ProbeResult[] = [];
for (const probeCase of cases) {
  results.push(await runCase(probeCase));
}

const output = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  configuredKeyPresent: Boolean(apiKey),
  privacy: "No raw successful payload, coordinates, address, or API key is stored.",
  results,
};

const artifactsDirectory = resolve("artifacts");
await mkdir(artifactsDirectory, { recursive: true });
await writeFile(resolve(artifactsDirectory, "latest-probe.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.table(
  results.map(({ name, status, bodyKind, durationMs, transportError }) => ({
    name,
    status,
    bodyKind,
    durationMs,
    error: transportError ?? "",
  })),
);
console.log(`An anonymized structural report was written to ${artifactsDirectory}.`);
if (!apiKey) {
  console.log("TISSEO_API_KEY is absent: authenticated place, journey, and geometry checks were skipped.");
}
