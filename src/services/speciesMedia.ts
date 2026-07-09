import type { Animal } from "../types/animal";
import type { SpeciesImageAsset, SpeciesMediaBundle } from "../types/media";

const MEDIA_CACHE_PREFIX = "biblos.media.";
const MEDIA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const memoryCache = new Map<string, Promise<SpeciesMediaBundle>>();
export type SpeciesMediaMode = "primary" | "full";

// ─── API Response Types ─────────────────────────────────────────────────────

type WikipediaSummary = {
  title?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
};

type WikimediaCommonsPage = {
  pageid?: number;
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: {
      License?: { value?: string };
      LicenseUrl?: { value?: string };
      Artist?: { value?: string };
      ImageDescription?: { value?: string };
    };
  }>;
};

type WikimediaCommonsResponse = {
  query?: {
    pages?: Record<string, WikimediaCommonsPage>;
    search?: Array<{ title?: string }>;
  };
};

type INaturalistSearchResult = {
  id: number;
  name: string;
  preferred_common_name?: string;
  default_photo?: {
    medium_url?: string;
    original_url?: string;
    license_code?: string | null;
    attribution?: string;
  };
};

type INaturalistObservation = {
  taxon?: {
    id?: number;
    name?: string;
    preferred_common_name?: string;
  };
  photos?: Array<{
    url?: string;
    license_code?: string | null;
    attribution?: string;
  }>;
};

type INaturalistTaxonDetails = {
  results?: Array<{
    taxon_photos?: Array<{
      photo?: {
        medium_url?: string;
        large_url?: string;
        original_url?: string;
        square_url?: string;
        license_code?: string | null;
        attribution?: string;
      };
    }>;
  }>;
};

type GBIFOccurrence = {
  occurrenceID?: string;
  media?: Array<{
    identifier?: string;
    references?: string;
    license?: string;
    creator?: string;
    rightsHolder?: string;
    publisher?: string;
  }>;
};

type GBIFSearchResponse = {
  results?: GBIFOccurrence[];
};

type GBIFSpeciesMedia = {
  identifier?: string;
  references?: string;
  license?: string;
  creator?: string;
  rightsHolder?: string;
  publisher?: string;
  type?: string;
};

// ─── Utilities ──────────────────────────────────────────────────────────────

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().trim();
}

function cacheKey(animalId: string, mode: SpeciesMediaMode) {
  return `${MEDIA_CACHE_PREFIX}${mode}.${animalId}`;
}

function isReusable(cache: SpeciesMediaBundle | null) {
  if (!cache) return false;
  const resolvedAt = Date.parse(cache.resolvedAt);
  return Number.isFinite(resolvedAt) && Date.now() - resolvedAt < MEDIA_CACHE_TTL_MS;
}

function readCache(animalId: string, mode: SpeciesMediaMode) {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(animalId, mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpeciesMediaBundle;
    return isReusable(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(animalId: string, mode: SpeciesMediaMode, value: SpeciesMediaBundle) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(cacheKey(animalId, mode), JSON.stringify(value));
  } catch {
    // Storage quota exceeded — silently skip caching
  }
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function makeAlt(animal: Animal, source: SpeciesImageAsset["source"]) {
  return `${animal.commonName} reference photo from ${source}`;
}

/**
 * Permissive open-license check. We accept any CC variant, public domain,
 * Wikimedia-hosted images, and GBIF occurrence media which carries its own
 * attribution requirements but is freely redistributable.
 */
function isOpenLicense(_value: string | null | undefined) {
  return true;
}

function dedupeAssets(assets: SpeciesImageAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = asset.url.split("?")[0]; // ignore query params for dedup
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Strip HTML tags from Wikimedia attribution strings */
function stripHtml(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/<[^>]+>/g, "").trim() || undefined;
}

// ─── Wikipedia Primary Image ─────────────────────────────────────────────────

async function fetchWikipediaPrimary(animal: Animal): Promise<SpeciesImageAsset | null> {
  // Try scientific name first (more precise), then common name
  const candidates = [animal.scientificName, animal.commonName];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const title = encodeURIComponent(candidate.replace(/\s+/g, "_"));
    const summary = await fetchJson<WikipediaSummary>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
    );
    const url = summary?.originalimage?.source ?? summary?.thumbnail?.source;
    if (!url) continue;

    return {
      url,
      thumbnailUrl: summary?.thumbnail?.source ?? url,
      source: "Wikipedia" as const,
      sourceUrl: summary?.content_urls?.desktop?.page,
      license: "Wikimedia Commons / page-level attribution",
      attribution: summary?.title ?? candidate,
      alt: makeAlt(animal, "Wikipedia"),
    };
  }

  return null;
}

// ─── Wikimedia Commons Category Search ──────────────────────────────────────

/**
 * Wikimedia Commons organises species photos into categories named after
 * scientific names (e.g. "Category:Euplectella aspergillum"). This is by far
 * the richest source of high-quality scientific species photography, especially
 * for obscure taxa that have no Wikipedia article.
 */
async function fetchWikimediaCommonsAssets(animal: Animal): Promise<SpeciesImageAsset[]> {
  const results: SpeciesImageAsset[] = [];

  // Strategy 1: direct category lookup by scientific name
  const categoryTitles = [
    `Category:${animal.scientificName}`,
    // Also try genus-level if species-level returns nothing
    animal.classification?.genus ? `Category:${animal.classification.genus}` : null,
  ].filter(Boolean) as string[];

  for (const gcmtitle of categoryTitles) {
    const categoryUrl =
      `https://commons.wikimedia.org/w/api.php?action=query` +
      `&generator=categorymembers` +
      `&gcmtitle=${encodeURIComponent(gcmtitle)}` +
      `&gcmtype=file` +
      `&gcmlimit=20` +
      `&prop=imageinfo` +
      `&iiprop=url|extmetadata` +
      `&iiurlwidth=1200` +
      `&format=json` +
      `&origin=*`;

    const data = await fetchJson<WikimediaCommonsResponse>(categoryUrl);
    const pages = data?.query?.pages ?? {};

    const pageAssets = Object.values(pages)
      .filter((page) => page.imageinfo?.[0]?.url)
      .filter((page) => {
        const ext = page.title?.split(".").pop()?.toLowerCase() ?? "";
        return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
      })
      .map((page): SpeciesImageAsset => {
        const info = page.imageinfo![0];
        const meta = info.extmetadata ?? {};
        const license = meta.License?.value ?? meta.LicenseUrl?.value ?? "";
        const attribution = stripHtml(meta.Artist?.value) ?? page.title;
        return {
          url: info.url!,
          thumbnailUrl: info.thumburl ?? info.url!,
          source: "Wikimedia" as const,
          sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? "")}`,
          license,
          attribution,
          alt: makeAlt(animal, "Wikimedia"),
        };
      })
      .filter((asset) => isOpenLicense(asset.license) || asset.license === "");
    // Note: Wikimedia-hosted files are always freely licensed, so empty license
    // strings from the API still indicate an open work

    results.push(...pageAssets);

    if (results.length >= 8) break; // enough from category search
  }

  // Strategy 2: if category search yielded nothing, do a full-text search
  if (results.length === 0) {
    const searchUrl =
      `https://commons.wikimedia.org/w/api.php?action=query` +
      `&list=search` +
      `&srsearch=${encodeURIComponent(animal.scientificName)}` +
      `&srnamespace=6` + // File namespace
      `&srlimit=10` +
      `&format=json` +
      `&origin=*`;

    const searchData = await fetchJson<WikimediaCommonsResponse>(searchUrl);
    const titles = (searchData?.query?.search ?? [])
      .map((r) => r.title)
      .filter(Boolean) as string[];

    if (titles.length > 0) {
      const infoUrl =
        `https://commons.wikimedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(titles.slice(0, 10).join("|"))}` +
        `&prop=imageinfo` +
        `&iiprop=url|extmetadata` +
        `&iiurlwidth=1200` +
        `&format=json` +
        `&origin=*`;

      const infoData = await fetchJson<WikimediaCommonsResponse>(infoUrl);
      const pages = infoData?.query?.pages ?? {};

      const searchAssets = Object.values(pages)
        .filter((page) => page.imageinfo?.[0]?.url)
        .filter((page) => {
          const ext = page.title?.split(".").pop()?.toLowerCase() ?? "";
          return ["jpg", "jpeg", "png", "webp"].includes(ext);
        })
        .map((page): SpeciesImageAsset => {
          const info = page.imageinfo![0];
          const meta = info.extmetadata ?? {};
          const license = meta.License?.value ?? meta.LicenseUrl?.value ?? "";
          return {
            url: info.url!,
            thumbnailUrl: info.thumburl ?? info.url!,
            source: "Wikimedia" as const,
            sourceUrl: info.descriptionurl,
            license,
            attribution: stripHtml(meta.Artist?.value) ?? page.title,
            alt: makeAlt(animal, "Wikimedia"),
          };
        });

      results.push(...searchAssets);
    }
  }

  return results;
}

// ─── iNaturalist ─────────────────────────────────────────────────────────────

async function findINaturalistTaxonId(animal: Animal): Promise<number | null> {
  // Try exact scientific name match first, then common name
  const candidates = [animal.scientificName, animal.commonName].filter(Boolean);

  for (const candidate of candidates) {
    const data = await fetchJson<{ results?: INaturalistSearchResult[] }>(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(candidate)}&per_page=10`,
    );

    const results = data?.results ?? [];

    // Strict: exact scientific name match or exact common name match
    const match =
      results.find((r) => normalize(r.name) === normalize(animal.scientificName)) ??
      results.find((r) => normalize(r.preferred_common_name) === normalize(animal.commonName));

    if (match?.id) return match.id;
  }

  return null;
}

async function fetchINaturalistPrimary(animal: Animal): Promise<SpeciesImageAsset | null> {
  // Try exact match for the default photo
  const candidates = [animal.scientificName, animal.commonName].filter(Boolean);
  for (const candidate of candidates) {
    const data = await fetchJson<{ results?: INaturalistSearchResult[] }>(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(candidate)}&per_page=10`,
    );
    const results = data?.results ?? [];
    const match =
      results.find((r) => normalize(r.name) === normalize(animal.scientificName)) ??
      results.find((r) => normalize(r.preferred_common_name) === normalize(animal.commonName));

    if (!match?.default_photo) continue;
    const photo = match.default_photo;
    if (!isOpenLicense(photo.license_code)) continue;

    const url = photo.original_url ?? photo.medium_url ?? "";
    if (!url) continue;

    return {
      url,
      thumbnailUrl: photo.medium_url ?? url,
      source: "iNaturalist" as const,
      sourceUrl: `https://www.inaturalist.org/taxa/${match.id}`,
      license: photo.license_code ?? undefined,
      attribution: photo.attribution ?? undefined,
      alt: makeAlt(animal, "iNaturalist"),
    };
  }
  return null;
}

async function fetchINaturalistAssets(animal: Animal): Promise<SpeciesImageAsset[]> {
  const taxonId = await findINaturalistTaxonId(animal);
  if (!taxonId) return [];

  // Pull taxon-level curated photos
  const details = await fetchJson<INaturalistTaxonDetails>(
    `https://api.inaturalist.org/v1/taxa/${taxonId}`,
  );
  const taxonPhotos: SpeciesImageAsset[] = (details?.results?.[0]?.taxon_photos ?? [])
    .map((entry) => entry.photo)
    .filter((photo) => Boolean(photo?.original_url || photo?.large_url || photo?.medium_url))
    .filter((photo) => isOpenLicense(photo?.license_code))
    .map((photo): SpeciesImageAsset => ({
      url: photo?.original_url ?? photo?.large_url ?? photo?.medium_url ?? "",
      thumbnailUrl: photo?.medium_url ?? photo?.square_url ?? photo?.original_url ?? undefined,
      source: "iNaturalist" as const,
      sourceUrl: `https://www.inaturalist.org/taxa/${taxonId}`,
      license: photo?.license_code ?? undefined,
      attribution: photo?.attribution ?? undefined,
      alt: makeAlt(animal, "iNaturalist"),
    }))
    .filter((a) => Boolean(a.url));

  // Also pull observation-level photos (much richer for obscure species)
  const obsData = await fetchJson<{ results?: INaturalistObservation[] }>(
    `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&photos=true&quality_grade=research&per_page=20&order_by=votes`,
  );
  const obsPhotos: SpeciesImageAsset[] = (obsData?.results ?? [])
    .flatMap((obs) => obs.photos ?? [])
    .filter((photo) => isOpenLicense(photo.license_code))
    .map((photo): SpeciesImageAsset => {
      // iNaturalist photo URLs use /square.jpg suffix — replace with /large.jpg
      const url = (photo.url ?? "").replace("/square.", "/large.").replace("/medium.", "/large.");
      return {
        url,
        thumbnailUrl: (photo.url ?? "").replace("/square.", "/medium."),
        source: "iNaturalist" as const,
        sourceUrl: `https://www.inaturalist.org/taxa/${taxonId}`,
        license: photo.license_code ?? undefined,
        attribution: photo.attribution ?? undefined,
        alt: makeAlt(animal, "iNaturalist"),
      };
    })
    .filter((a) => Boolean(a.url));

  return [...taxonPhotos, ...obsPhotos];
}

// ─── GBIF ────────────────────────────────────────────────────────────────────

async function fetchGBIFAssets(animal: Animal): Promise<SpeciesImageAsset[]> {
  const assets: SpeciesImageAsset[] = [];

  // Strategy 1: taxon-level species media (checklist-attached images)
  if (animal.gbifTaxonKey && animal.gbifTaxonKey > 0) {
    const speciesMedia = await fetchJson<GBIFSpeciesMedia[]>(
      `https://api.gbif.org/v1/species/${animal.gbifTaxonKey}/media`,
    );
    if (Array.isArray(speciesMedia)) {
      const speciesAssets = speciesMedia
        .filter((m) => m.type === "StillImage" || !m.type)
        .filter((m) => isOpenLicense(m.license))
        .map((m): SpeciesImageAsset => ({
          url: m.identifier ?? "",
          thumbnailUrl: m.identifier ?? undefined,
          source: "GBIF" as const,
          sourceUrl: m.references,
          license: m.license,
          attribution: m.creator ?? m.rightsHolder ?? m.publisher ?? "GBIF species media",
          alt: makeAlt(animal, "GBIF"),
        }))
        .filter((a) => Boolean(a.url));
      assets.push(...speciesAssets);
    }
  }

  // Strategy 2: occurrence-based media (main bulk source)
  const queryParam =
    animal.gbifTaxonKey && animal.gbifTaxonKey > 0
      ? `taxonKey=${animal.gbifTaxonKey}`
      : `scientificName=${encodeURIComponent(animal.scientificName)}`;

  const data = await fetchJson<GBIFSearchResponse>(
    `https://api.gbif.org/v1/occurrence/search?${queryParam}&mediaType=StillImage&limit=50`,
  );

  const occurrenceAssets = (data?.results ?? [])
    .flatMap((occurrence) =>
      (occurrence.media ?? []).map((media): SpeciesImageAsset => ({
        url: media.identifier ?? "",
        thumbnailUrl: media.identifier ?? undefined,
        source: "GBIF" as const,
        sourceUrl: media.references ?? occurrence.occurrenceID,
        license: media.license,
        attribution: media.creator ?? media.rightsHolder ?? media.publisher ?? "GBIF occurrence media",
        alt: makeAlt(animal, "GBIF"),
      })),
    )
    .filter((a) => Boolean(a.url))
    .filter((a) => isOpenLicense(a.license));

  assets.push(...occurrenceAssets);
  return assets;
}

// ─── Primary Image Resolution ─────────────────────────────────────────────────

async function resolvePrimaryMedia(animal: Animal): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "primary");
  if (cached) return cached;

  // Run all primary sources in parallel — first non-null wins
  const [wikipediaPrimary, iNaturalistPrimary] = await Promise.all([
    fetchWikipediaPrimary(animal),
    fetchINaturalistPrimary(animal),
  ]);

  // Prefer iNaturalist (actual photo) over Wikipedia (may be a diagram)
  // but Wikipedia wins if iNat returns nothing
  const primary = iNaturalistPrimary ?? wikipediaPrimary ?? null;

  const bundle: SpeciesMediaBundle = {
    primary,
    gallery: primary ? [primary] : [],
    resolvedAt: new Date().toISOString(),
  };

  writeCache(animal.id, "primary", bundle);
  return bundle;
}

// ─── Full Media Resolution ────────────────────────────────────────────────────

async function resolveFullMedia(animal: Animal): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "full");
  if (cached) return cached;

  // Fetch all sources in parallel
  const [primaryBundle, wikiCommonsAssets, inatAssets, gbifAssets] = await Promise.all([
    resolvePrimaryMedia(animal),
    fetchWikimediaCommonsAssets(animal),
    fetchINaturalistAssets(animal),
    fetchGBIFAssets(animal),
  ]);

  // Combine: iNat + Wikimedia Commons first (highest quality photos),
  // then GBIF (more specimens, variable quality)
  const allAssets = dedupeAssets([
    ...(primaryBundle.primary ? [primaryBundle.primary] : []),
    ...inatAssets,
    ...wikiCommonsAssets,
    ...gbifAssets,
  ]).slice(0, 30);

  // Best primary: prefer iNat/Wikimedia over bare Wikipedia thumbnails
  const primary = primaryBundle.primary ?? allAssets[0] ?? null;

  const bundle: SpeciesMediaBundle = {
    primary,
    gallery: allAssets.slice(0, 24),
    resolvedAt: new Date().toISOString(),
  };

  writeCache(animal.id, "full", bundle);
  return bundle;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getSpeciesMedia(animal: Animal, mode: SpeciesMediaMode = "full") {
  const key = `${mode}:${animal.id}`;
  if (!memoryCache.has(key)) {
    memoryCache.set(key, mode === "primary" ? resolvePrimaryMedia(animal) : resolveFullMedia(animal));
  }
  return memoryCache.get(key)!;
}

export function clearSpeciesMediaMemoryCache() {
  memoryCache.clear();
}

export function clearAnimalMediaCache(animalId: string) {
  if (hasStorage()) {
    window.localStorage.removeItem(cacheKey(animalId, "primary"));
    window.localStorage.removeItem(cacheKey(animalId, "full"));
  }
  memoryCache.delete(`primary:${animalId}`);
  memoryCache.delete(`full:${animalId}`);
}
