import { createFileRoute } from "@tanstack/react-router";
import { buildSteamAssets, json, options204, searchSteam } from "@/lib/steam-catalogue";

export const Route = createFileRoute("/api/public/catalogue/search/suggestions")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = (url.searchParams.get("query") ?? "").trim();
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 5) || 5, 20);

        if (query.length < 2) return json([]);

        try {
          const items = await searchSteam(query);
          return json(
            items.slice(0, limit).map((item) => {
              const assets = buildSteamAssets(String(item.id), item.name);
              return {
                title: item.name,
                objectId: String(item.id),
                shop: "steam",
                iconUrl: assets.iconUrl,
              };
            })
          );
        } catch {
          return json([]);
        }
      },
    },
  },
});
