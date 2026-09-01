/**
 * Shared image fallback chains for library games.
 *
 * A lot of games (specially the ones coming from manually added download
 * sources) have no icon/cover stored locally, so the sidebar and the library
 * ended up rendering broken images. These helpers append the public Steam CDN
 * artwork (derived from the Steam app id) plus a generated placeholder so
 * there is always something to show.
 */

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";
const PLACEHOLDER_BASE = "https://ktm-cloud.lovable.app/api/public/placeholder";

export type GameImageKind = "icon" | "cover" | "hero";

export interface GameImageFallbackSource {
  objectId?: string | null;
  shop?: string | null;
  title?: string | null;
}

const isSteamAppId = (objectId: string | null | undefined) =>
  Boolean(objectId && /^\d+$/.test(objectId.trim()));

export function getSteamArtworkFallbacks(
  game: GameImageFallbackSource,
  kind: GameImageKind
): string[] {
  if (game.shop !== "steam" || !isSteamAppId(game.objectId)) return [];

  const appId = String(game.objectId).trim();

  if (kind === "icon") {
    return [
      `${STEAM_CDN}/${appId}/capsule_231x87.jpg`,
      `${STEAM_CDN}/${appId}/header.jpg`,
    ];
  }

  if (kind === "hero") {
    return [
      `${STEAM_CDN}/${appId}/library_hero.jpg`,
      `${STEAM_CDN}/${appId}/header.jpg`,
      `${STEAM_CDN}/${appId}/capsule_616x353.jpg`,
    ];
  }

  return [
    `${STEAM_CDN}/${appId}/library_600x900_2x.jpg`,
    `${STEAM_CDN}/${appId}/header.jpg`,
    `${STEAM_CDN}/${appId}/capsule_616x353.jpg`,
  ];
}

export function getPlaceholderImageUrl(
  game: GameImageFallbackSource,
  kind: GameImageKind
): string {
  const shape = kind === "hero" ? "hero" : kind === "icon" ? "icon" : "library";
  const title = (game.title ?? "Game").slice(0, 60);

  return `${PLACEHOLDER_BASE}?shape=${shape}&title=${encodeURIComponent(title)}`;
}

/** Full chain: preferred local sources -> Steam CDN artwork -> placeholder. */
export function buildGameImageFallbacks(
  game: GameImageFallbackSource,
  kind: GameImageKind,
  preferredSources: Array<string | null | undefined> = []
): string[] {
  const chain = [
    ...preferredSources,
    ...getSteamArtworkFallbacks(game, kind),
    getPlaceholderImageUrl(game, kind),
  ];

  return chain
    .map((source) => (typeof source === "string" ? source.trim() : ""))
    .filter(
      (source, index, array) =>
        source !== "" && array.indexOf(source) === index
    );
}
