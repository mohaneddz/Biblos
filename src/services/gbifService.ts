import type { Animal, ConservationStatus } from "../types/animal";
import type {
  GbifSearchItem,
  GbifSearchPayload,
  GbifSpeciesDetails,
  SpeciesSearchHit,
  SearchResponse,
} from "../types/speciesStore";
import { reportError } from "./errorReporter";

// ── Session-level stale-while-revalidate cache (GBIF suggest results) ────────

const GBIF_CACHE_PREFIX = "biblos:gbif:suggest:";
const GBIF_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type GbifCacheEntry = { hits: SpeciesSearchHit[]; ts: number };

function staleWhileRevalidate(
  key: string,
  fetcher: () => Promise<SpeciesSearchHit[]>,
  onResult: (hits: SpeciesSearchHit[]) => void,
) {
  try {
    const raw = sessionStorage.getItem(GBIF_CACHE_PREFIX + key);
    if (raw) {
      const entry = JSON.parse(raw) as GbifCacheEntry;
      onResult(entry.hits); // serve stale immediately
      if (Date.now() - entry.ts < GBIF_CACHE_TTL_MS) return; // still fresh — skip revalidation
    }
  } catch { /* ignore */ }

  fetcher().then((hits) => {
    try {
      sessionStorage.setItem(GBIF_CACHE_PREFIX + key, JSON.stringify({ hits, ts: Date.now() }));
    } catch { /* quota exceeded */ }
    onResult(hits);
  }).catch(() => { /* network error — stale served */ });
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if text consists of Latin/English letters, digits, and common punctuation (rejects Japanese, Thai, Cyrillic, Chinese, etc.) */
export function isLatinText(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  return !/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf\u0e00-\u0e7f\u0400-\u04ff\u0600-\u06ff\uac00-\ud7af]/u.test(text);
}

export function preferredCommonName(item: GbifSearchItem): string | null {
  // 1. Prefer explicit English vernacular names
  const engEntry = item.vernacularNames?.find(
    (entry) =>
      (entry.language?.toLowerCase() === "eng" || entry.language?.toLowerCase() === "en") &&
      entry.vernacularName?.trim() &&
      isLatinText(entry.vernacularName)
  );
  if (engEntry?.vernacularName?.trim()) {
    return engEntry.vernacularName.trim();
  }

  // 2. Top-level vernacularName if it is valid English/Latin text
  if (item.vernacularName?.trim() && isLatinText(item.vernacularName)) {
    return item.vernacularName.trim();
  }

  // 3. Any vernacularName entry that is valid English/Latin text
  const anyLatinEntry = item.vernacularNames?.find(
    (entry) => entry.vernacularName?.trim() && isLatinText(entry.vernacularName)
  );
  if (anyLatinEntry?.vernacularName?.trim()) {
    return anyLatinEntry.vernacularName.trim();
  }

  // Return null if all vernacular names are foreign non-Latin scripts
  return null;
}

export function toSearchHitFromGbif(item: GbifSearchItem, index = 0, query = ""): SpeciesSearchHit | null {
  const gbifTaxonKey = item.acceptedTaxonKey ?? item.taxonKey ?? item.key;
  const scientificName = item.scientificName?.trim();
  if (!gbifTaxonKey || !scientificName) {
    return null;
  }

  // Filter out any non-Animalia results (viruses, plants, fungi, bacteria)
  if (item.kingdom && item.kingdom.toLowerCase() !== "animalia") {
    return null;
  }

  // Filter out higher-rank taxonomic entries: GBIF returns GENUS, FAMILY, ORDER,
  // CLASS, PHYLUM, KINGDOM records which look like duplicate species in the UI.
  // We only want SPECIES and SUBSPECIES (or VARIETY/FORM for edge cases).
  const rank = (item.rank ?? "").toUpperCase();
  const ACCEPTABLE_RANKS = new Set(["SPECIES", "SUBSPECIES", "VARIETY", "FORM", "INFRASPECIFIC_NAME", ""]);
  if (rank && !ACCEPTABLE_RANKS.has(rank)) {
    return null;
  }

  const canonicalName = item.canonicalName?.trim() || scientificName;
  const commonName = preferredCommonName(item);

  const q = query.trim().toLowerCase();
  const cName = (commonName || "").toLowerCase();
  const sName = scientificName.toLowerCase();
  const canName = canonicalName.toLowerCase();

  let baseScore = Math.max(0, 100 - index);

  if (q) {
    if (cName) {
      if (cName === q) {
        baseScore += 2000;
      } else if (cName.startsWith(q) || cName.split(" ").some((word) => word.startsWith(q))) {
        baseScore += 1000;
      } else if (cName.includes(q)) {
        baseScore += 500;
      }
    }

    if (sName === q || canName === q) {
      baseScore += 800;
    } else if (sName.startsWith(q) || canName.startsWith(q)) {
      baseScore += 100;
    } else if (sName.includes(q) || canName.includes(q)) {
      baseScore += 10;
    }
  }

  const preferredLower = commonName?.toLowerCase();
  const aliases = (item.vernacularNames ?? [])
    .filter((entry) => entry.vernacularName?.trim() && entry.vernacularName.toLowerCase() !== preferredLower)
    .map((entry) => entry.vernacularName!.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 10);

  return {
    id: `gbif-${gbifTaxonKey}`,
    gbif_taxon_key: gbifTaxonKey,
    scientific_name: scientificName,
    canonical_name: canonicalName,
    common_name: commonName,
    aliases,
    inat_taxon_id: undefined,
    popularity_score: 0,
    rank: item.rank?.trim() || "SPECIES",
    kingdom: item.kingdom?.trim() ?? null,
    phylum: item.phylum?.trim() ?? null,
    class_name: item.class?.trim() ?? null,
    order_name: item.order?.trim() ?? null,
    family: item.family?.trim() ?? null,
    genus: item.genus?.trim() ?? null,
    source: "GBIF",
    updated_at: new Date().toISOString(),
    score: baseScore,
    match_reason: commonName ? "gbif_common_name" : "gbif_scientific_name",
    is_live_fallback: true,
  };
}

export function dedupeSearchHits(hits: SpeciesSearchHit[], query = "") {
  const deduped = new Map<string, SpeciesSearchHit>();
  // Secondary index: common_name → best hit, to collapse genus/family/species
  // entries that all share the same vernacular name (e.g. three "aye aye" records).
  const commonNameBest = new Map<string, SpeciesSearchHit>();

  const q = query.trim().toLowerCase();
  const qNorm = q.replace(/s$/, ""); // Normalize trailing s for plural matching

  for (const hit of hits) {
    const key = normalizeSearchText(hit.canonical_name || hit.scientific_name || hit.common_name || hit.id);
    
    let finalScore = hit.score;
    if (q) {
      const cName = (hit.common_name || "").toLowerCase();
      const cNameNorm = cName.replace(/s$/, "");
      const sName = (hit.scientific_name || "").toLowerCase();
      const canName = (hit.canonical_name || "").toLowerCase();

      if (cName) {
        if (cName === q || cNameNorm === qNorm) {
          finalScore += 2000;
        } else if (cName.startsWith(q) || cNameNorm.startsWith(qNorm) || cName.split(" ").some((word) => word.replace(/s$/, "").startsWith(qNorm))) {
          finalScore += 1000;
        } else if (cName.includes(q) || cNameNorm.includes(qNorm)) {
          finalScore += 500;
        }
      }

      if (sName === q || canName === q) {
        finalScore += 800;
      } else if (sName.startsWith(q) || canName.startsWith(q)) {
        finalScore += 10;
      }
    }

    const hitWithBoost = { ...hit, score: finalScore };
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, hitWithBoost);
    } else {
      const better =
        hitWithBoost.score > existing.score ||
        (hitWithBoost.score === existing.score && Boolean(hitWithBoost.common_name) && !existing.common_name) ||
        (hitWithBoost.score === existing.score && hitWithBoost.is_live_fallback && !existing.is_live_fallback);
      if (better) {
        deduped.set(key, hitWithBoost);
      }
    }

    // --- Common-name deduplication: if two hits share the same vernacular name,
    // keep only the one with the highest score (prefer SPECIES over GENUS/FAMILY).
    const cNameKey = (hit.common_name || "").toLowerCase().trim();
    if (cNameKey) {
      const existingByName = commonNameBest.get(cNameKey);
      if (!existingByName || hitWithBoost.score > existingByName.score) {
        commonNameBest.set(cNameKey, hitWithBoost);
      }
    }
  }

  // Remove any canonical-name entries that were beaten by a same-common-name but
  // different-canonical-name hit (i.e., genus/family entries that lost to the true species).
  const survivingKeys = new Set<string>();
  for (const winner of commonNameBest.values()) {
    const winnerKey = normalizeSearchText(winner.canonical_name || winner.scientific_name || winner.common_name || winner.id);
    survivingKeys.add(winnerKey);
  }

  const filtered = [...deduped.values()].filter((hit) => {
    const cNameKey = (hit.common_name || "").toLowerCase().trim();
    if (!cNameKey) return true; // no common name → keep as-is
    const winner = commonNameBest.get(cNameKey);
    if (!winner) return true;
    const hitKey = normalizeSearchText(hit.canonical_name || hit.scientific_name || hit.common_name || hit.id);
    const winnerKey = normalizeSearchText(winner.canonical_name || winner.scientific_name || winner.common_name || winner.id);
    // Suppress this hit only if a different, better-scoring entry shares its common name
    return hitKey === winnerKey;
  });

  return filtered.sort((a, b) => b.score - a.score || a.canonical_name.localeCompare(b.canonical_name));
}

export async function fetchGbifMatch(scientificName: string, commonName: string, query = ""): Promise<SpeciesSearchHit | null> {
  try {
    const response = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&kingdom=Animalia`
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.usageKey && data.kingdom?.toLowerCase() === "animalia") {
      // Score the hit based on how well the common name actually matches the query.
      const q = query.trim().toLowerCase();
      const cName = (commonName || data.vernacularName || "").toLowerCase();
      const sName = (data.canonicalName || scientificName || "").toLowerCase();
      let score = 1500; // default: strong signal but not overwhelming
      if (q) {
        if (cName === q) score = 3000;
        else if (cName.startsWith(q) || cName.split(" ").some((w: string) => w.startsWith(q))) score = 2500;
        else if (cName.includes(q) || sName.includes(q)) score = 1500;
        else score = 200; // unrelated to the query
      }

      return {
        id: `gbif-${data.usageKey}`,
        gbif_taxon_key: data.usageKey,
        scientific_name: data.scientificName || data.canonicalName,
        canonical_name: data.canonicalName || data.scientificName,
        common_name: commonName || data.vernacularName || null,
        aliases: [],
        inat_taxon_id: undefined,
        popularity_score: 0,
        rank: data.rank || "SPECIES",
        kingdom: data.kingdom || null,
        phylum: data.phylum || null,
        class_name: data.class || null,
        order_name: data.order || null,
        family: data.family || null,
        genus: data.genus || null,
        source: "GBIF",
        updated_at: new Date().toISOString(),
        score,
        match_reason: "gbif_common_name",
        is_live_fallback: true,
      };
    }
  } catch (err) {
    reportError(`GBIF match failed for ${scientificName}`, err);
  }
  return null;
}

/**
 * Strict variant of fetchGbifMatch: returns null when GBIF reports matchType=NONE.
 * Used when validating AI or iNat candidates — we only accept confirmed matches.
 */
export async function fetchGbifMatchStrict(scientificName: string, commonName: string, query = ""): Promise<SpeciesSearchHit | null> {
  try {
    const response = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&kingdom=Animalia`
    );
    if (!response.ok) return null;
    const data = await response.json();
    // Reject unresolved matches
    if (!data.usageKey || data.matchType === "NONE") return null;
    if (data.kingdom && data.kingdom.toLowerCase() !== "animalia") return null;
    return fetchGbifMatch(scientificName, commonName, query);
  } catch {
    return null;
  }
}

/**
 * GBIF species suggest endpoint — returns lightweight autocomplete results.
 * Faster than /species/search and intended for type-ahead.
 */
export async function fetchGbifSuggest(
  query: string,
  limit: number,
  onResult: (hits: SpeciesSearchHit[]) => void,
): Promise<void> {
  const cacheKey = `suggest:${query.trim().toLowerCase()}:${limit}`;
  staleWhileRevalidate(
    cacheKey,
    async () => {
      const url = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&rank=SPECIES&limit=${limit}`;
      const resp = await fetch(url);
      if (!resp.ok) return [];
      const items: GbifSearchItem[] = await resp.json();
      return items
        .map((item, i) => toSearchHitFromGbif(item, i, query))
        .filter((h): h is SpeciesSearchHit => Boolean(h));
    },
    onResult,
  );
}

export async function fetchGbifSearch(query: string, limit: number): Promise<SearchResponse> {
  // GBIF search runs without AI pre-seeding — results come from GBIF only.
  // AI is only used downstream for profile enrichment, never for candidate generation.
  const gbifSearchPromise = fetch(
    `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&kingdom=Animalia&status=ACCEPTED&limit=${limit}`,
  ).then(r => {
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return r.json() as Promise<GbifSearchPayload>;
  }).catch((err) => {
    reportError(`GBIF search request failed for query "${query}"`, err);
    return { results: [] };
  });

  const payload = await gbifSearchPromise;

  const gbifHits = (payload.results ?? [])
    .map((item, index) => toSearchHitFromGbif(item, index, query))
    .filter((hit): hit is SpeciesSearchHit => Boolean(hit));

  const hits = dedupeSearchHits(gbifHits, query);

  return {
    hits: hits.slice(0, limit),
    used_live_fallback: true,
    total_count: hits.length,
  } satisfies SearchResponse;
}

export async function fetchGbifSpeciesDetails(taxonKey: number): Promise<GbifSpeciesDetails> {
  const response = await fetch(`https://api.gbif.org/v1/species/${taxonKey}`);
  if (!response.ok) {
    const err = new Error(`GBIF species lookup failed with status ${response.status}`);
    reportError(`Failed to fetch species details for taxon key ${taxonKey}`, err);
    throw err;
  }

  return (await response.json()) as GbifSpeciesDetails;
}

export function inferConservationStatusFromGbif(details: GbifSpeciesDetails): ConservationStatus {
  const threat = normalizeSearchText(details.threat ?? "");
  if (threat.includes("critically endangered")) {
    return "Critically Endangered";
  }
  if (threat.includes("endangered")) {
    return "Endangered";
  }
  if (threat.includes("vulnerable")) {
    return "Vulnerable";
  }
  if (threat.includes("near threatened")) {
    return "Near Threatened";
  }
  if (details.extinct) {
    return "Extinct";
  }
  return "Unknown";
}

export function buildSpeciesFromGbifDetails(id: string, details: GbifSpeciesDetails, cached: Animal | null): Animal {
  const fallbackName = cached?.commonName ?? details.vernacularName ?? details.canonicalName ?? details.scientificName ?? "Unknown species";
  const scientificName = details.scientificName ?? details.canonicalName ?? cached?.scientificName ?? fallbackName;
  const canonicalName = details.canonicalName ?? scientificName;
  const kingdom = details.kingdom ?? cached?.classification.kingdom ?? "Animalia";
  const phylum = details.phylum ?? cached?.classification.phylum ?? "Unknown";
  const className = details.class ?? cached?.classification.className ?? "Unknown";
  const order = details.order ?? cached?.classification.order ?? "Unknown";
  const family = details.family ?? cached?.classification.family ?? "Unknown";
  const genus = details.genus ?? cached?.classification.genus ?? "Unknown";
  const species = details.species ?? canonicalName;
  const habitat = details.habitat ? [details.habitat] : cached?.habitat.length ? cached.habitat : ["Unknown"];
  const conservationStatus = cached?.conservationStatus ?? inferConservationStatusFromGbif(details);
  const shortDescription = cached?.shortDescription ?? ([details.rank, className, family].filter(Boolean).join(" | ") || "GBIF record ready for local hydration.");

  return {
    id,
    gbifTaxonKey: Number(id.replace(/^gbif-/, "")),
    commonName: fallbackName,
    scientificName,
    averageLifespanYears: cached?.averageLifespanYears ?? null,
    shortDescription,
    detailedDescription:
      cached?.detailedDescription ??
      "Biblos found this species through GBIF and is filling the entry in-browser.",
    coolFacts: cached?.coolFacts ?? [],
    classification: {
      kingdom,
      phylum,
      className,
      order,
      family,
      genus,
      species,
    },
    habitat,
    diet: cached?.diet ?? "Unknown",
    activityPattern: cached?.activityPattern ?? "Unknown",
    continents: cached?.continents?.length ? cached.continents : ["Unknown"],
    conservationStatus,
    size: cached?.size ?? {},
    weightKg: cached?.weightKg ?? null,
    images: cached?.images ?? [],
    heroImage: cached?.heroImage ?? null,
    has3DModel: cached?.has3DModel ?? false,
    sourceUrls: [`https://www.gbif.org/species/${details.taxonKey ?? Number(id.replace(/^gbif-/, ""))}`],
    lastFetchedAt: new Date().toISOString(),
    partial: true,
  };
}
