// Resolves reliable artwork URLs for Steam apps.
//
// Newer Steam apps no longer expose the classic
// cdn.cloudflare.steamstatic.com/steam/apps/<id>/<asset>.jpg files: their
// assets live under hashed store_item_assets paths. The only reliable way to
// get them is the appdetails endpoint, so we read it once per app and cache
// the result. Anything we cannot resolve falls back to a generated placeholder
// so the UI never renders a broken image.

const CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

export interface SteamImages {
  header: string | null;
  capsule: string | null;
  background: string | null;
  name: string | null;
}

const cache = new Map<string, { at: number; value: SteamImages }>();
const TTL = 1000 * 60 * 60 * 24;

const fetchAppDetails = async (appId: string): Promise<SteamImages> => {
  const res = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`
  );
  if (!res.ok) throw new Error(`appdetails ${res.status}`);

  const body = (await res.json()) as Record<
    string,
    {
      success?: boolean;
      data?: {
        name?: string;
        header_image?: string;
        capsule_image?: string;
        background_raw?: string;
      };
    }
  >;

  const data = body?.[appId]?.data;

  return {
    header: data?.header_image ?? null,
    capsule: data?.capsule_image ?? null,
    background: data?.background_raw ?? null,
    name: data?.name ?? null,
  };
};

export const getSteamImages = async (appId: string): Promise<SteamImages> => {
  const cached = cache.get(appId);
  if (cached && Date.now() - cached.at < TTL) return cached.value;

  let value: SteamImages;
  try {
    value = await fetchAppDetails(appId);
  } catch {
    value = { header: null, capsule: null, background: null, name: null };
  }

  cache.set(appId, { at: Date.now(), value });
  return value;
};

/** Local SVG placeholder so a game always shows something readable. */
export const placeholderUrl = (
  origin: string,
  title: string,
  shape: "cover" | "library" | "hero" | "icon" = "cover"
) =>
  `${origin}/api/public/placeholder?title=${encodeURIComponent(
    title.slice(0, 60)
  )}&shape=${shape}`;

export interface ResolvedAssets {
  objectId: string;
  shop: string;
  title: string;
  iconUrl: string | null;
  libraryHeroImageUrl: string | null;
  libraryImageUrl: string | null;
  logoImageUrl: string | null;
  logoPosition: string | null;
  coverImageUrl: string | null;
  downloadSources: string[];
}

/**
 * Builds an asset bundle for a game.
 * `appId` may be null (title never matched a Steam app) — placeholders are
 * used so covers/banners still render.
 */
export const resolveAssets = async (
  origin: string,
  appId: string | null,
  title: string,
  downloadSources: string[] = [],
  fallbackObjectId?: string
): Promise<ResolvedAssets> => {
  if (!appId) {
    const cover = placeholderUrl(origin, title, "cover");
    return {
      objectId: fallbackObjectId ?? title,
      shop: "steam",
      title,
      iconUrl: cover,
      libraryHeroImageUrl: placeholderUrl(origin, title, "hero"),
      libraryImageUrl: placeholderUrl(origin, title, "library"),
      logoImageUrl: null,
      logoPosition: null,
      coverImageUrl: cover,
      downloadSources,
    };
  }

  const images = await getSteamImages(appId);

  // Classic CDN assets exist for the vast majority of older apps; when the
  // app only publishes hashed store assets we reuse the header/capsule.
  // Classic apps serve /steam/apps/<id>/<asset>.jpg; newer apps only publish
  // hashed store_item_assets paths where library_*/logo assets do not exist.
  const usesClassicCdn =
    !images.header || !images.header.includes("/store_item_assets/");
  const header = images.header ?? `${CDN}/${appId}/header.jpg`;
  const hero = usesClassicCdn
    ? `${CDN}/${appId}/library_hero.jpg`
    : (images.background ?? header);
  const library = usesClassicCdn ? `${CDN}/${appId}/library_600x900.jpg` : header;

  return {
    objectId: appId,
    shop: "steam",
    title: images.name || title,
    iconUrl: images.capsule ?? `${CDN}/${appId}/capsule_231x87.jpg`,
    libraryHeroImageUrl: hero,
    libraryImageUrl: library,
    logoImageUrl: usesClassicCdn ? `${CDN}/${appId}/logo.png` : null,
    logoPosition: null,
    coverImageUrl: header,
    downloadSources,
  };
};
