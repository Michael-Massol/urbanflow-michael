import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b6b53", color: "white", fontSize: 172, fontWeight: 800, letterSpacing: -12 }}>UF</div>,
    { width: 512, height: 512 },
  );
}
