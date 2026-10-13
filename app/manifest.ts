import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trainvy — Treinos & Performance",
    short_name: "Trainvy",
    description:
      "O app definitivo para periodização, treinos e tracking de musculação com IA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Treino do Dia",
        short_name: "Treino",
        url: "/",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Planejamento",
        short_name: "Planejamento",
        url: "/planning",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Histórico",
        short_name: "Histórico",
        url: "/history",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Evolução e Estatísticas",
        short_name: "Evolução",
        url: "/stats",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    categories: ["fitness", "sports", "health"],
  };
}
