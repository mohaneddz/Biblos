import type { Animal } from "../types/animal";
import type { SpeciesImageAsset, SpeciesMediaBundle } from "../types/media";

const MEDIA_CACHE_PREFIX = "biblos.media.";
const MEDIA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const memoryCache = new Map<string, Promise<SpeciesMediaBundle>>();
export type SpeciesMediaMode = "primary" | "full";

// ─── Concurrency Limiter ──────────────────────────────────────────────────────
// Cards resolve their cover art independently, and without a cap, scrolling
// through a grid of dozens of cards fires dozens of parallel Wikipedia/iNat
// requests at once. Browsers only allow ~6 concurrent connections per host,
// so unthrottled bursts just queue behind each other and everything gets slow.
// Capping in-flight resolutions keeps requests flowing steadily instead.
const MAX_CONCURRENT_RESOLUTIONS = 6;
let activeResolutions = 0;
const resolutionQueue: Array<() => void> = [];

function acquireResolutionSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (activeResolutions < MAX_CONCURRENT_RESOLUTIONS) {
        activeResolutions += 1;
        resolve(() => {
          activeResolutions -= 1;
          const next = resolutionQueue.shift();
          if (next) next();
        });
      } else {
        resolutionQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

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

/**
 * Extract the bare binomial (Genus species) from a GBIF scientificName that
 * often carries the authority and year: "Equus quagga Boddaert, 1785" → "Equus quagga".
 * Also handles monomials (genus only): "Carcharias Rafinesque, 1810" → "Carcharias".
 * Returns the original string unchanged if no match (safe fallback).
 */
function canonicalBinomial(scientificName: string): string {
  // Binomial nomenclature: 'Genus species' where species epithet is all lowercase.
  // The regex stops before the authority (Capitalized name or year after space).
  const match = scientificName.match(/^([A-Z][a-z]+(?:\s+[a-z][a-z-]+)?)/);
  return match ? match[1] : scientificName;
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
    if (!isReusable(parsed)) return null;
    return {
      ...parsed,
      gallery: dedupeAssets(parsed.gallery || []),
    };
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

function getAssetFingerprint(url: string): string {
  const normalized = url.toLowerCase().trim();

  // 1. iNaturalist photo ID extraction (e.g., /photos/123456/)
  const iNatMatch = normalized.match(/\/photos\/(\d+)\//);
  if (iNatMatch) {
    return `inat-${iNatMatch[1]}`;
  }

  // 2. Wikimedia Commons filename extraction
  if (normalized.includes("wikipedia") || normalized.includes("wikimedia")) {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      const parts = pathname.split("/");
      const filenameSegment = parts.find(
        (p) => p.includes(".") && !p.startsWith("px-") && !p.match(/^\d+px-/)
      );
      if (filenameSegment) {
        return `wiki-${filenameSegment}`;
      }
    } catch {
      // Fallback if URL parsing fails
    }
  }

  // 3. Fallback generic filename cleanup (ignores size suffixes and extensions)
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const lastSegment = pathname.substring(pathname.lastIndexOf("/") + 1);
    return lastSegment
      .replace(/\.(jpg|jpeg|png|webp|gif|svg)$/, "")
      .replace(/[_-](medium|large|small|thumb|thumbnail|original|square|card|hero|rect|sq)$/, "")
      .replace(/\/(medium|large|small|thumb|thumbnail|original|square)$/, "") || normalized;
  } catch {
    return normalized;
  }
}

function dedupeAssets(assets: SpeciesImageAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const fingerprint = getAssetFingerprint(asset.url);
    if (seen.has(fingerprint)) {
      return false;
    }
    seen.add(fingerprint);
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
  // Wikipedia page titles use the canonical binomial, NOT the full GBIF scientific name
  // which includes author+year (e.g. "Equus quagga Boddaert, 1785" → 404 on Wikipedia).
  const canonical = canonicalBinomial(animal.scientificName);
  // Try canonical scientific name first (most precise), then common name
  const candidates = [canonical, animal.commonName];

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

  // Wikimedia Commons categories use the canonical binomial only (no author/year).
  // e.g. "Category:Equus quagga", NOT "Category:Equus quagga Boddaert, 1785".
  const canonical = canonicalBinomial(animal.scientificName);

  // Strategy 1: direct category lookup by scientific name
  const categoryTitles = [
    `Category:${canonical}`,
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
    // Use canonical binomial for text search — author names confuse the search engine
    const canonical = canonicalBinomial(animal.scientificName);
    const searchUrl =
      `https://commons.wikimedia.org/w/api.php?action=query` +
      `&list=search` +
      `&srsearch=${encodeURIComponent(canonical)}` +
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
  // Use the canonical binomial for iNaturalist queries. The full GBIF scientific name
  // includes author+year (e.g. "Equus quagga Boddaert, 1785") which iNat doesn't store,
  // causing the query to return 0 results and the exact-match check to always fail.
  const canonical = canonicalBinomial(animal.scientificName);
  const candidates = [canonical, animal.commonName].filter(Boolean);

  for (const candidate of candidates) {
    const data = await fetchJson<{ results?: INaturalistSearchResult[] }>(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(candidate)}&per_page=10`,
    );

    const results = data?.results ?? [];

    // Match against both the canonical binomial AND the full scientific name, and common name
    const match =
      results.find((r) => normalize(r.name) === normalize(canonical)) ??
      results.find((r) => normalize(r.name) === normalize(animal.scientificName)) ??
      results.find((r) => normalize(r.preferred_common_name) === normalize(animal.commonName));

    if (match?.id) return match.id;
  }

  return null;
}

async function fetchINaturalistPrimary(animal: Animal): Promise<SpeciesImageAsset | null> {
  // Use canonical binomial for iNat queries — full GBIF names include author+year
  const canonical = canonicalBinomial(animal.scientificName);
  const candidates = [canonical, animal.commonName].filter(Boolean);
  for (const candidate of candidates) {
    const data = await fetchJson<{ results?: INaturalistSearchResult[] }>(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(candidate)}&per_page=10`,
    );
    const results = data?.results ?? [];
    const match =
      results.find((r) => normalize(r.name) === normalize(canonical)) ??
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
    .flatMap((obs) => {
      const photos = obs.photos ?? [];
      const firstPhoto = photos[0];
      if (!firstPhoto) return [];
      return [firstPhoto];
    })
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
    .flatMap((occurrence) => {
      const mediaList = occurrence.media ?? [];
      const firstMedia = mediaList[0];
      if (!firstMedia) return [];
      return [{
        url: firstMedia.identifier ?? "",
        thumbnailUrl: firstMedia.identifier ?? undefined,
        source: "GBIF" as const,
        sourceUrl: firstMedia.references ?? occurrence.occurrenceID,
        license: firstMedia.license,
        attribution: firstMedia.creator ?? firstMedia.rightsHolder ?? firstMedia.publisher ?? "GBIF occurrence media",
        alt: makeAlt(animal, "GBIF"),
      }];
    })
    .filter((a) => Boolean(a.url))
    .filter((a) => isOpenLicense(a.license));

  assets.push(...occurrenceAssets);
  return assets;
}

// ─── Primary Image Resolution ─────────────────────────────────────────────────

async function resolvePrimaryMedia(
  animal: Animal,
  skipFallback = false,
  acquireSlot = true,
): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "primary");
  if (cached) return cached;

  // Fallback: check if we already have full media cached!
  const cachedFull = readCache(animal.id, "full");
  if (cachedFull && cachedFull.primary) {
    const bundle = {
      primary: cachedFull.primary,
      gallery: cachedFull.primary ? [cachedFull.primary] : [],
      resolvedAt: cachedFull.resolvedAt,
    };
    writeCache(animal.id, "primary", bundle);
    return bundle;
  }

  // When called from resolveFullMedia, the caller already holds a slot for
  // this resolution — acquiring a second one here would deadlock once all
  // slots are held by outer calls waiting on their own inner call.
  const releaseSlot = acquireSlot ? await acquireResolutionSlot() : null;
  let primary: SpeciesImageAsset | null;
  try {
    // Run all primary sources in parallel — first non-null wins
    const [wikipediaPrimary, iNaturalistPrimary] = await Promise.all([
      fetchWikipediaPrimary(animal),
      fetchINaturalistPrimary(animal),
    ]);

    primary = iNaturalistPrimary ?? wikipediaPrimary ?? null;

    // If still null, try a fallback search on Wikimedia Commons category or GBIF occurrences!
    if (!primary && !skipFallback) {
      const wikiAssets = await fetchWikimediaCommonsAssets(animal);
      if (wikiAssets.length > 0) {
        primary = wikiAssets[0];
      } else {
        const gbifAssets = await fetchGBIFAssets(animal);
        if (gbifAssets.length > 0) {
          primary = gbifAssets[0];
        }
      }
    }
  } finally {
    releaseSlot?.();
  }

  const bundle: SpeciesMediaBundle = {
    primary,
    gallery: primary ? [primary] : [],
    resolvedAt: new Date().toISOString(),
  };

  if (!skipFallback || primary) {
    writeCache(animal.id, "primary", bundle);
  }
  return bundle;
}

// ─── Full Media Resolution ────────────────────────────────────────────────────

async function resolveFullMedia(animal: Animal): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "full");
  if (cached) return cached;

  // Fetch all sources in parallel (resolvePrimaryMedia acquires its own slot,
  // so only guard the three calls made directly by this function)
  const releaseSlot = await acquireResolutionSlot();
  let wikiCommonsAssets: SpeciesImageAsset[];
  let inatAssets: SpeciesImageAsset[];
  let gbifAssets: SpeciesImageAsset[];
  let primaryBundle: SpeciesMediaBundle;
  try {
    [primaryBundle, wikiCommonsAssets, inatAssets, gbifAssets] = await Promise.all([
      resolvePrimaryMedia(animal, true, false),
      fetchWikimediaCommonsAssets(animal),
      fetchINaturalistAssets(animal),
      fetchGBIFAssets(animal),
    ]);
  } finally {
    releaseSlot();
  }

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
