import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function publicOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (isDevelopment && url.protocol === "http:")
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}

const supabaseOrigin = publicOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const mapStyleOrigin = publicOrigin(process.env.NEXT_PUBLIC_MAP_STYLE_URL);
const publicOrigins = [...new Set([supabaseOrigin, mapStyleOrigin].filter((value): value is string => Boolean(value)))];
const websocketOrigins = supabaseOrigin
  ? [supabaseOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:")]
  : [];
const externalSources = publicOrigins.length > 0 ? ` ${publicOrigins.join(" ")}` : "";
const websocketSources = websocketOrigins.length > 0 ? ` ${websocketOrigins.join(" ")}` : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${externalSources}`,
  `font-src 'self' data:${externalSources}`,
  `connect-src 'self'${externalSources}${websocketSources}${isDevelopment ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.196"],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(isDevelopment ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
