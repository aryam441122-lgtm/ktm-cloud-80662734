import { createFileRoute } from "@tanstack/react-router";
import { json, options204 } from "@/lib/steam-catalogue";
import {
  getSourceGames,
  readSourceIds,
  resolveAppIds,
} from "@/lib/source-catalogue";
import { resolveAssets } from "@/lib/steam-images";
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

          const edges = await Promise.all(
            page.map(async (game, index) => {
              const appId = appIds[index] ?? null;
              const fallbackId = game.normalized.replace(/\s+/g, "-");
              const assets = await resolveAssets(
                origin,
                appId,
                game.title,
                [game.sourceName],
                fallbackId
              );

              return {
                id: `steam:${assets.objectId}`,
                objectId: assets.objectId,
                title: game.title,
                shop: "steam",
                genres: [],
                releaseYear: null,
                libraryImageUrl: assets.libraryImageUrl,
                coverImageUrl: assets.coverImageUrl,
                iconUrl: assets.iconUrl,
                libraryHeroImageUrl: assets.libraryHeroImageUrl,
                downloadSources: [game.sourceName],
              };
            })
          );

          return json({ count: games.length, edges });
        } catch {
          return json({ count: 0, edges: [] });
        }
      },
    },
  },
});
