import { createFileRoute } from "@tanstack/react-router";
import { buildSteamAssets, json, options204 } from "@/lib/steam-catalogue";
import {
  getSourceGames,
  readSourceIds,
  resolveAppIds,
} from "@/lib/source-catalogue";
import { normalizeTitle } from "@/lib/repack-index";

export const Route = createFileRoute("/api/public/catalogue/search")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }

        const title =
          typeof body['title'] === "string" ? (body['title'] as string).trim() : "";
        const take = Math.min(Number(body['take'] ?? 24) || 24, 60);
        const skip = Math.max(Number(body['skip'] ?? 0) || 0, 0);
        const sourceIds = readSourceIds(body['downloadSourceIds']);

        try {
          const origin = new URL(request.url).origin;
          let games = await getSourceGames(origin, sourceIds);

          if (title.length > 0) {
            const target = normalizeTitle(title);
            games = games.filter((game) => game.normalized.includes(target));
          }

          const page = games.slice(skip, skip + take);
          const appIds = await resolveAppIds(page.map((g) => g.title));

          return json({
            count: games.length,
            edges: page.map((game, index) => {
              const appId = appIds[index];
              const objectId = appId ?? game.normalized.replace(/\s+/g, "-");
              const assets = appId ? buildSteamAssets(appId, game.title) : null;

              return {
                id: `steam:${objectId}`,
                objectId,
                title: game.title,
                shop: "steam",
                genres: [],
                releaseYear: null,
                libraryImageUrl: assets?.libraryImageUrl ?? null,
                coverImageUrl: assets?.coverImageUrl ?? null,
                downloadSources: [game.sourceName],
              };
            }),
          });
        } catch {
          return json({ count: 0, edges: [] });
        }
      },
    },
  },
});
