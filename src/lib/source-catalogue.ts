// Builds catalogue entries from the user's download sources (not Steam's featured list).
import { SOURCES, loadSource, normalizeTitle, type RepackEntry } from "./repack-index";

export interface SourceGame {
  key: string;
  sourceName: string;
  title: string;
  cleanTitle: string;
  normalized: string;
  uploadDate: string | null;
}

/** Deterministic id (same algorithm the app and /download-sources use). */
const idFromUrl = async (url: string) => {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(url));
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

const sourceIdCache = new Map<string, string[]>();

/** Every id form a client may hold for a given source key. */
const idsForSource = async (origin: string, key: string, path: string) => {
  const cacheKey = `${origin}|${key}`;
  const cached = sourceIdCache.get(cacheKey);
  if (cached) return cached;

  const urls = path.startsWith("http")
    ? [path]
    : [`${origin}${path}`, `https://ktm-cloud.lovable.app${path}`];

  const ids = [key, ...(await Promise.all(urls.map(idFromUrl)))];
  sourceIdCache.set(cacheKey, ids);
  return ids;
};

/** Strips repack noise so titles map back to real game names. */
export const cleanGameTitle = (raw: string) =>
  raw
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/\bfree\s+download\b.*$/i, " ")
    .replace(/\bbuild\s+\d+.*$/i, " ")
    .replace(/\bv?\d+(\.\d+)+.*$/i, " ")
    .replace(/[-–—:]?\s*\+\s*\d+\s*dlcs?.*$/i, " ")
    .replace(/\ball\s+dlcs?\b.*$/i, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * Collects all games available in the given download sources.
 * `sourceIds` empty array => the user removed every source => no games.
 */
export const getSourceGames = async (
  origin: string,
  sourceIds?: string[] | null
): Promise<SourceGame[]> => {
  let selected = SOURCES;

  if (Array.isArray(sourceIds)) {
    if (sourceIds.length === 0) return [];

    const wanted = new Set(sourceIds.map((id) => String(id).toLowerCase()));
    const matches = await Promise.all(
      SOURCES.map(async (source) => {
        const ids = await idsForSource(origin, source.key, source.path);
        return ids.some((id) => wanted.has(id.toLowerCase())) ? source : null;
      })
    );
    selected = matches.filter((s): s is (typeof SOURCES)[number] => s !== null);

    if (selected.length === 0) return [];
  }

  const lists = await Promise.all(
    selected.map((s) =>
      loadSource(origin, s.key, s.path).catch(() => [] as RepackEntry[])
    )
  );

  const seen = new Set<string>();
  const games: SourceGame[] = [];

  for (const list of lists) {
    for (const entry of list) {
      const cleanTitle = cleanGameTitle(entry.title) || entry.title;
      const normalized = normalizeTitle(cleanTitle);
      if (normalized.length < 2 || seen.has(normalized)) continue;
      seen.add(normalized);
      games.push({
        key: entry.downloadSourceId,
        sourceName: entry.downloadSourceName,
        title: cleanTitle,
        cleanTitle,
        normalized,
        uploadDate: entry.uploadDate,
      });
    }
  }

  games.sort((a, b) => (b.uploadDate ?? "").localeCompare(a.uploadDate ?? ""));
  return games;
};

const appIdCache = new Map<string, string | null>();

const searchSteamStore = async (term: string) => {
  const res = await fetch(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      term
    )}&cc=us&l=en`
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { items?: { id: number; name: string }[] };
  return body.items ?? [];
};

/** Progressively simpler variants so odd repack titles still match Steam. */
const titleVariants = (title: string): string[] => {
  const variants = [title];
  const dash = title.split(/\s+[–—:-]\s+/)[0];
  if (dash && dash !== title) variants.push(dash);
  const noVr = title.replace(/\s+VR$/i, "");
  if (noVr !== title) variants.push(noVr);
  const words = title.split(/\s+/);
  if (words.length > 3) variants.push(words.slice(0, 3).join(" "));
  return [...new Set(variants.filter((v) => v.trim().length > 1))];
};

/** Resolves a Steam appid for a title so covers/hero images render. */
export const resolveSteamAppId = async (title: string): Promise<string | null> => {
  const key = normalizeTitle(title);
  if (appIdCache.has(key)) return appIdCache.get(key) ?? null;

  try {
    for (const variant of titleVariants(title)) {
      const items = await searchSteamStore(variant);
      if (!items.length) continue;
      const exact = items.find((i) => normalizeTitle(i.name) === key);
      const chosen = exact ?? items[0];
      if (chosen) {
        const id = String(chosen.id);
        appIdCache.set(key, id);
        return id;
      }
    }
    appIdCache.set(key, null);
    return null;
  } catch {
    appIdCache.set(key, null);
    return null;
  }
};


export const resolveAppIds = async (titles: string[]) =>
  Promise.all(titles.map((t) => resolveSteamAppId(t)));

export const readSourceIds = (value: unknown): string[] | null =>
  Array.isArray(value) ? value.map((v) => String(v)) : null;
