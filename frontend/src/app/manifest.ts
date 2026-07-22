import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MediMate — Medication Companion",
    short_name: "MediMate",
    description:
      "Privacy-first AI medication companion. Scan pills, check interactions, track schedules — fully offline.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e1a",
    theme_color: "#14b8a6",
    categories: ["health", "medical", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Scan Pill",
        url: "/scan",
        description: "Open the pill bottle scanner",
      },
      {
        name: "Today's Schedule",
        url: "/schedule",
        description: "View today's medication schedule",
      },
      {
        name: "Journal",
        url: "/journal",
        description: "Log how you're feeling",
      },
    ],
  };
}
