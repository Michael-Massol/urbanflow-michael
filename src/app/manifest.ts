import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UrbanFlow Mobility",
    short_name: "UrbanFlow",
    id: "/",
    description: "Mobilité urbaine intelligente et durable à Toulouse.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b6b53",
    theme_color: "#0b6b53",
    orientation: "portrait-primary",
    categories: ["navigation", "travel"],
    shortcuts: [
      {
        name: "Planifier un trajet",
        short_name: "Planifier",
        description: "Ouvrir le planificateur multimodal UrbanFlow.",
        url: "/planifier",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
