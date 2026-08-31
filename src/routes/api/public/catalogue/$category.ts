import { createFileRoute } from "@tanstack/react-router";
import { buildSteamAssets, json, options204 } from "@/lib/steam-catalogue";
import { getSourceGames, resolveAppIds } from "@/lib/source-catalogue";

export const Route = createFileRoute("/api/public/catalogue/$category")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const take = Math.min(Number(url.searchParams.get("take") ?? 12) || 12, 50);
        const skip = Math.max(Number(url.searchParams.get("skip") ?? 0) || 0, 0);

        const rawIds = url.searchParams.getAll("downloadSourceIds");
        const sourceIds = rawIds.length > 0 ? rawIds : null;

        try {
          const games = await getSourceGames(url.origin, sourceIds);
          const page = games.slice(skip, skip + take);
          const appIds = await resolveAppIds(page.map((g) => g.title));

          return json(
            page.map((game, index) => {
              const appId = appIds[index];
              if (!appId) {
                return {
                  objectId: game.normalized.replace(/\s+/g, "-"),
                  shop: "steam",
                  title: game.title,
                  iconUrl: null,
                  libraryHeroImageUrl: null,
                  libraryImageUrl: null,
                  logoImageUrl: null,
                  logoPosition: null,
                  coverImageUrl: null,
                  downloadSources: [game.sourceName],
                };
              }
              return buildSteamAssets(appId, game.title, [game.sourceName]);
            })
          );
        } catch {
          return json([]);
        }
      },
    },
  },
});
