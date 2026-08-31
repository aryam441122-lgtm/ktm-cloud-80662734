import { createFileRoute } from "@tanstack/react-router";
import { json, options204 } from "@/lib/steam-catalogue";

export const Route = createFileRoute("/api/public/catalogue/filters")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      GET: async () =>
        json({ platforms: [], genres: [], developers: [], publishers: [] }),
    },
  },
});
