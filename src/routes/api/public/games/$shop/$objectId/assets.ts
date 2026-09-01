import { createFileRoute } from "@tanstack/react-router";
import { json, options204 } from "@/lib/steam-catalogue";
import { resolveAssets } from "@/lib/steam-images";

export const Route = createFileRoute("/api/public/games/$shop/$objectId/assets")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      GET: async ({ request, params }) => {
        const { shop, objectId } = params;
        const url = new URL(request.url);
        const titleParam = url.searchParams.get("title") ?? "";

        if (shop !== "steam") return json(null);

        // Source-only entries have a slug objectId instead of a Steam appid.
        if (!/^\d+$/.test(objectId)) {
          const title = titleParam || objectId.replace(/-/g, " ");
          return json(await resolveAssets(url.origin, null, title, [], objectId));
        }

        return json(await resolveAssets(url.origin, objectId, titleParam));
      },
    },
  },
});
