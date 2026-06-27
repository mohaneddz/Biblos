import type { Animal } from "../types/animal";
import type { SpeciesImageAsset, SpeciesMediaBundle } from "../types/media";

const MEDIA_CACHE_PREFIX = "biblos.media.";
const MEDIA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const memoryCache = new Map<string, Promise<SpeciesMediaBundle>>();
export type SpeciesMediaMode = "primary" | "full";

type WikipediaSummary = {
  title?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
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
    attribution_name?: string;
  };
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
        attribution_name?: string;
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
  if (!cache) {
    return false;
  }

  const resolvedAt = Date.parse(cache.resolvedAt);
  return Number.isFinite(resolvedAt) && Date.now() - resolvedAt < MEDIA_CACHE_TTL_MS;
}

function readCache(animalId: string, mode: SpeciesMediaMode) {
  if (!hasStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(animalId, mode));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SpeciesMediaBundle;
    return isReusable(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(animalId: string, mode: SpeciesMediaMode, value: SpeciesMediaBundle) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(cacheKey(animalId, mode), JSON.stringify(value));
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

function wikipediaCandidates(animal: Animal) {
  const scientificLooksCanonical =
    !normalize(animal.scientificName).includes("spp.") &&
    !normalize(animal.scientificName).includes("various");

  return scientificLooksCanonical ? [animal.commonName, animal.scientificName] : [animal.commonName];
}

function makeAlt(animal: Animal, source: SpeciesImageAsset["source"]) {
  return `${animal.commonName} reference photo from ${source}`;
}

function isOpenLicense(value: string | null | undefined) {
  const license = normalize(value);
  if (!license) {
    return false;
  }

  return (
    license.includes("creativecommons.org") ||
    license.includes("cc-by") ||
    license.includes("cc0") ||
    license.includes("public domain") ||
    license.includes("publicdomain")
  );
}

function dedupeAssets(assets: SpeciesImageAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.url)) {
      return false;
    }
    seen.add(asset.url);
    return true;
  });
}

async function fetchWikipediaPrimary(animal: Animal) {
  const candidates = wikipediaCandidates(animal);

  for (const candidate of candidates) {
    const title = encodeURIComponent(candidate.replace(/\s+/g, "_"));
    const summary = await fetchJson<WikipediaSummary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
    const url = summary?.originalimage?.source ?? summary?.thumbnail?.source;
    if (!url) {
      continue;
    }

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

async function findINaturalistMatch(animal: Animal) {
  const candidates = [animal.scientificName, animal.commonName];
  let match: INaturalistSearchResult | undefined;

  for (const candidate of candidates) {
    const data = await fetchJson<{ results?: INaturalistSearchResult[] }>(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(candidate)}&per_page=10`,
    );

    const results = data?.results ?? [];
    match =
      results.find((result) => normalize(result.name) === normalize(animal.scientificName)) ??
      results.find((result) => normalize(result.preferred_common_name) === normalize(animal.commonName)) ??
      results[0];

    if (match) {
      break;
    }
  }

  if (!match?.id) {
    return null;
  }

  return match;
}

async function fetchINaturalistPrimary(animal: Animal) {
  const match = await findINaturalistMatch(animal);
  const defaultPhoto = match?.default_photo;

  if (!match?.id || !defaultPhoto || !isOpenLicense(defaultPhoto.license_code)) {
    return null;
  }

  return {
    url: defaultPhoto.original_url ?? defaultPhoto.medium_url ?? "",
    thumbnailUrl: defaultPhoto.medium_url ?? defaultPhoto.original_url ?? undefined,
    source: "iNaturalist" as const,
    sourceUrl: `https://www.inaturalist.org/taxa/${match.id}`,
    license: defaultPhoto.license_code ?? undefined,
    attribution: defaultPhoto.attribution ?? defaultPhoto.attribution_name ?? undefined,
    alt: makeAlt(animal, "iNaturalist"),
  };
}

async function fetchINaturalistAssets(animal: Animal) {
  const match = await findINaturalistMatch(animal);
  if (!match?.id) {
    return [];
  }

  const details = await fetchJson<INaturalistTaxonDetails>(`https://api.inaturalist.org/v1/taxa/${match.id}`);
  const photos = details?.results?.[0]?.taxon_photos ?? [];

  return photos
    .map((entry) => entry.photo)
    .filter((photo) => Boolean(photo?.original_url || photo?.large_url || photo?.medium_url))
    .filter((photo) => isOpenLicense(photo?.license_code))
    .map((photo) => ({
      url: photo?.original_url ?? photo?.large_url ?? photo?.medium_url ?? "",
      thumbnailUrl: photo?.medium_url ?? photo?.square_url ?? photo?.original_url ?? undefined,
      source: "iNaturalist" as const,
      sourceUrl: `https://www.inaturalist.org/taxa/${match?.id}`,
      license: photo?.license_code ?? undefined,
      attribution: photo?.attribution ?? photo?.attribution_name ?? undefined,
      alt: makeAlt(animal, "iNaturalist"),
    }))
    .filter((asset) => Boolean(asset.url));
}

async function fetchGBIFAssets(animal: Animal) {
  const data = await fetchJson<GBIFSearchResponse>(
    `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(animal.scientificName)}&mediaType=StillImage&limit=8`,
  );

  return (data?.results ?? [])
    .flatMap((occurrence) =>
      (occurrence.media ?? []).map((media) => ({
        url: media.identifier ?? "",
        thumbnailUrl: media.identifier ?? undefined,
        source: "GBIF" as const,
        sourceUrl: media.references ?? occurrence.occurrenceID,
        license: media.license,
        attribution: media.creator ?? media.rightsHolder ?? media.publisher ?? "GBIF occurrence media",
        alt: makeAlt(animal, "GBIF"),
      })),
    )
    .filter((asset) => Boolean(asset.url))
    .filter((asset) => isOpenLicense(asset.license));
}

async function resolvePrimaryMedia(animal: Animal): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "primary");
  if (cached) {
    return cached;
  }

  const [wikipediaPrimary, iNaturalistPrimary] = await Promise.all([
    fetchWikipediaPrimary(animal),
    fetchINaturalistPrimary(animal),
  ]);

  const primary = wikipediaPrimary ?? iNaturalistPrimary ?? null;
  const bundle: SpeciesMediaBundle = {
    primary,
    gallery: primary ? [primary] : [],
    resolvedAt: new Date().toISOString(),
  };

  writeCache(animal.id, "primary", bundle);
  return bundle;
}

async function resolveFullMedia(animal: Animal): Promise<SpeciesMediaBundle> {
  const cached = readCache(animal.id, "full");
  if (cached) {
    return cached;
  }

  const primaryBundle = await resolvePrimaryMedia(animal);
  const [inatAssets, gbifAssets] = await Promise.all([
    fetchINaturalistAssets(animal),
    fetchGBIFAssets(animal),
  ]);

  const gallery = dedupeAssets([...(primaryBundle.primary ? [primaryBundle.primary] : []), ...inatAssets, ...gbifAssets]).slice(0, 6);
  const bundle: SpeciesMediaBundle = {
    primary: primaryBundle.primary ?? gallery[0] ?? null,
    gallery,
    resolvedAt: new Date().toISOString(),
  };

  writeCache(animal.id, "full", bundle);
  return bundle;
}

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
