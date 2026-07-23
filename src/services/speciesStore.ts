import { invoke } from "@tauri-apps/api/core";
import { animalMap, animals } from "../data/animals";
import { getCachedSpecies } from "./cache";
import type { ActivityPattern, Animal, ConservationStatus, Continent } from "../types/animal";
import type { SpeciesSearchHit, SearchResponse, HydratedProfileResponse } from "../types/speciesStore";
import { hydrateSpeciesWithAI } from "./aiSpeciesService";
import {
  fetchGbifSearch,
  fetchGbifSpeciesDetails,
  buildSpeciesFromGbifDetails,
  normalizeSearchText,
  dedupeSearchHits,
} from "./gbifService";
import { reportError } from "./errorReporter";
import {
  inferClassFromHit,
  inferHabitatFromHit,
  inferDietFromHit,
  inferActivityPatternFromHit,
  inferContinentsFromHit,
  inferConservationStatusFromHit,
} from "./taxonomyInference";

// Re-export types for backward compatibility
export type { SpeciesSearchHit, SearchResponse, HydratedProfileResponse };
export { hydrateSpeciesWithAI };

/**
 * Reciprocal Rank Fusion (RRF) merge for multiple ranked hit lists.
 *
 * Formula: score(d) = Σ 1/(k + rank_i), k=60
 *
 * Properties:
 * - Exact lexical matches from any list float to the top regardless of source
 * - iNat popularity_score adds a small boost (up to +0.5 RRF points) to break ties
 * - Profile richness (non-partial, has coolFacts) only breaks ties at equal RRF score
 * - Filter hard constraints are applied by the caller BEFORE calling this function
 */
export function reciprocalRankFusion(
  lists: SpeciesSearchHit[][],
  { k = 60 }: { k?: number } = {},
): SpeciesSearchHit[] {
  const scores = new Map<string, { score: number; hit: SpeciesSearchHit }>();

  for (const list of lists) {
    list.forEach((hit, rankIdx) => {
      const rrf = 1 / (k + rankIdx + 1);
      // Small popularity tiebreaker (max +0.5 relative to 1/(60+1) ≈ 0.016)
      const popBoost = (hit.popularity_score ?? 0) * 0.5 * rrf;
      const key = hit.id;
      const existing = scores.get(key);
      if (existing) {
        existing.score += rrf + popBoost;
        // Keep the hit with the most information (prefer non-partial, has common name)
        if (!existing.hit.common_name && hit.common_name) {
          existing.hit = hit;
        }
      } else {
        scores.set(key, { score: rrf + popBoost, hit });
      }
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.hit, score: entry.score }));
}

let initialization: Promise<string> | null = null;

function asConservationStatus(value: string | undefined): ConservationStatus {
  const allowed: ConservationStatus[] = [
    "Least Concern",
    "Near Threatened",
    "Vulnerable",
    "Endangered",
    "Critically Endangered",
    "Extinct",
    "Unknown",
  ];
  return allowed.includes(value as ConservationStatus) ? (value as ConservationStatus) : "Unknown";
}

function asActivityPattern(value: string | undefined): ActivityPattern {
  const allowed: ActivityPattern[] = ["Diurnal", "Nocturnal", "Crepuscular", "Cathemeral", "Unknown"];
  return allowed.includes(value as ActivityPattern) ? (value as ActivityPattern) : "Unknown";
}

function asContinents(values: string[] | undefined): Continent[] {
  const allowed = new Set<Continent>([
    "Africa",
    "Asia",
    "Europe",
    "North America",
    "South America",
    "Australia",
    "Antarctica",
    "Oceans",
    "Unknown",
  ]);
  const normalized = (values ?? []).filter((value): value is Continent => allowed.has(value as Continent));
  return normalized.length > 0 ? normalized : ["Unknown"];
}

function mockSearch(query: string) {
  const q = normalizeSearchText(query);
  const hits = animals
    .filter((animal) => !q || normalizeSearchText(`${animal.commonName} ${animal.scientificName}`).includes(q))
    .slice(0, 24)
    .map<SpeciesSearchHit>((animal, index) => ({
      id: animal.id,
      gbif_taxon_key: animal.gbifTaxonKey ?? index + 1,
      scientific_name: animal.scientificName,
      canonical_name: animal.scientificName,
      common_name: animal.commonName,
      rank: "SPECIES",
      kingdom: animal.classification.kingdom,
      phylum: animal.classification.phylum,
      class_name: animal.classification.className,
      order_name: animal.classification.order,
      family: animal.classification.family,
      genus: animal.classification.genus,
      source: "mock",
      updated_at: new Date().toISOString(),
      score: q ? 100 : 0,
      match_reason: "mock",
      is_live_fallback: false,
    }));

  return { hits, used_live_fallback: false, total_count: hits.length } satisfies SearchResponse;
}

export function previewAnimalFromHit(hit: SpeciesSearchHit): Animal {
  const inferredClass = inferClassFromHit(hit);
  const inferredHabitat = hit.habitat ? [hit.habitat] : [inferHabitatFromHit(hit)];
  const inferredDiet = hit.diet ?? inferDietFromHit(hit);
  const inferredActivity = (hit.activity_pattern as Animal["activityPattern"]) ?? inferActivityPatternFromHit(hit);
  const inferredContinents = hit.continents ? [hit.continents as Continent] : inferContinentsFromHit(hit);
  const inferredStatus = (hit.conservation_status as Animal["conservationStatus"]) ?? inferConservationStatusFromHit(hit);

  return {
    id: hit.id,
    gbifTaxonKey: hit.gbif_taxon_key,
    commonName: hit.common_name ?? hit.canonical_name,
    scientificName: hit.scientific_name,
    averageLifespanYears: null,
    shortDescription: [hit.rank, inferredClass, hit.family].filter(Boolean).join(" | ") || "Indexed species entry ready for hydration.",
    detailedDescription: "Open this entry to hydrate its full profile from biodiversity sources.",
    coolFacts: [],
    classification: {
      kingdom: hit.kingdom ?? "Animalia",
      phylum: hit.phylum ?? "Chordata",
      className: inferredClass,
      order: hit.order_name ?? "",
      family: hit.family ?? "",
      genus: hit.genus ?? hit.canonical_name.split(" ")[0] ?? hit.canonical_name,
      species: hit.canonical_name,
    },
    habitat: inferredHabitat,
    diet: inferredDiet,
    activityPattern: inferredActivity,
    continents: inferredContinents,
    conservationStatus: inferredStatus,
    size: {},
    weightKg: null,
    images: [],
    has3DModel: false,
    sourceUrls: [],
    lastFetchedAt: hit.updated_at,
    partial: true,
  };
}

export async function initializeSpeciesStore() {
  if (!initialization) {
    initialization = invoke<string>("initialize_species_store").catch((err) => {
      reportError("Failed to initialize backend species store", err);
      return "mock";
    });
  }
  return initialization;
}

export async function searchSpeciesLocal(query: string, limit = 36, offset = 0) {
  await initializeSpeciesStore();

  try {
    const response = await invoke<SearchResponse>("search_species_local", { query, limit, offset });
    return {
      ...response,
      hits: dedupeSearchHits(response.hits, query).slice(0, limit),
    };
  } catch (err) {
    reportError(`Local species search failed for query "${query}"`, err);
    return mockSearch(query);
  }
}

export async function searchSpeciesLiveFallback(query: string, limit = 12) {
  await initializeSpeciesStore();

  try {
    const response = await invoke<SearchResponse>("search_species_live_fallback", { query, limit });
    return {
      ...response,
      hits: dedupeSearchHits(response.hits, query).slice(0, limit),
    };
  } catch (err) {
    reportError(`Live fallback search failed for query "${query}", querying GBIF directly`, err);
    return fetchGbifSearch(query, limit).catch(() => mockSearch(query));
  }
}

export async function lookupSpeciesAndStore(query: string, limit = 50) {
  await initializeSpeciesStore();

  try {
    // Authoritative-first: backend runs GBIF search + iNat (no AI seeding).
    // AI only parses the query into structured filters (handled separately in Species.tsx).
    const localLookupPromise = invoke<SearchResponse>("lookup_species_and_store", { query, limit }).catch((err) => {
      reportError(`Backend species lookup & storage failed for query "${query}"`, err);
      return { hits: [], used_live_fallback: false, total_count: 0 } as SearchResponse;
    });

    const localLookup = await localLookupPromise;
    const deduped = {
      ...localLookup,
      hits: dedupeSearchHits(localLookup.hits, query).slice(0, limit),
    };

    if (deduped.hits.length > 0) {
      return deduped;
    }
    const fallback = await fetchGbifSearch(query, limit).catch(() => deduped);
    return fallback;
  } catch (err) {
    reportError(`Species lookup failed for query "${query}", running fallback search`, err);
    const fallback = await fetchGbifSearch(query, limit).catch(() => mockSearch(query));
    return fallback;
  }
}

export async function hydrateSpeciesProfile(id: string, forceRefresh = false) {
  await initializeSpeciesStore();

  // 1. Static local animal
  if (!id.startsWith("gbif-") && !id.startsWith("wiki-") && animalMap.has(id)) {
    return {
      id,
      gbif_taxon_key: animalMap.get(id)?.gbifTaxonKey ?? 0,
      animal: animalMap.get(id)!,
      cached: true,
      partial: false,
    } satisfies HydratedProfileResponse;
  }

  // 2. Wikipedia-sourced species (id = "wiki-<slug>")
  if (id.startsWith("wiki-")) {
    // Check cache first unless forced
    const cached = getCachedSpecies(id);
    if (cached && !forceRefresh) {
      return { id, gbif_taxon_key: 0, animal: cached, cached: true, partial: cached.partial ?? true } satisfies HydratedProfileResponse;
    }

    // Derive a human-readable name from the slug: "wiki-killer-whale" → "killer whale"
    const slug = id.replace(/^wiki-/, "").replace(/-/g, " ");

    try {
      // Fetch Wikipedia REST summary
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
      const res = await fetch(summaryUrl);
      if (!res.ok) throw new Error(`Wikipedia returned ${res.status} for "${slug}"`);
      const data = await res.json() as {
        title?: string;
        description?: string;
        extract?: string;
        thumbnail?: { source?: string };
        content_urls?: { desktop?: { page?: string } };
      };

      const commonName = data.title ?? slug;
      const description = data.description ?? "";
      const extract = data.extract ?? "";
      const thumbnailUrl = data.thumbnail?.source ?? null;
      const wikiUrl = data.content_urls?.desktop?.page ?? null;

      const wikiAnimal: Animal = {
        id,
        gbifTaxonKey: undefined,
        commonName,
        scientificName: description || commonName,
        averageLifespanYears: null,
        shortDescription: extract.slice(0, 300) || `Wikipedia entry for ${commonName}.`,
        detailedDescription: extract || `No detailed description available for ${commonName}.`,
        coolFacts: [],
        classification: {
          kingdom: "Animalia",
          phylum: "Unknown",
          className: "Unknown",
          order: "Unknown",
          family: "Unknown",
          genus: "Unknown",
          species: description || commonName,
        },
        habitat: [],
        diet: "Unknown",
        activityPattern: "Unknown",
        continents: ["Unknown"],
        conservationStatus: "Unknown",
        size: {},
        weightKg: null,
        images: thumbnailUrl ? [thumbnailUrl] : [],
        has3DModel: false,
        sourceUrls: wikiUrl ? [wikiUrl] : [],
        lastFetchedAt: new Date().toISOString(),
        partial: true,
      };

      // Persist to localStorage so subsequent navigations are instant
      const { setCachedSpecies } = await import("./cache");
      setCachedSpecies(wikiAnimal);

      return { id, gbif_taxon_key: 0, animal: wikiAnimal, cached: false, partial: true } satisfies HydratedProfileResponse;
    } catch (err) {
      reportError(`Unable to hydrate Wikipedia species profile for ID "${id}"`, err);
      throw err;
    }
  }

  let response: HydratedProfileResponse;
  try {
    response = await invoke<HydratedProfileResponse>("hydrate_species_profile", {
      id,
      forceRefresh,
    });
  } catch (err) {
    // Expected for GBIF species — the Tauri backend doesn't store arbitrary GBIF IDs.
    // The fallback path below handles this gracefully via direct GBIF API calls.
    console.debug(`[species-store] Backend hydration unavailable for "${id}", using GBIF fallback`, err);
    const fallback = animalMap.get(id);
    if (!fallback) {
      if (id.startsWith("gbif-")) {
        const taxonKey = Number(id.replace(/^gbif-/, ""));
        if (Number.isFinite(taxonKey) && taxonKey > 0) {
          const cached = getCachedSpecies(id);
          const details = await fetchGbifSpeciesDetails(taxonKey);
          response = {
            id,
            gbif_taxon_key: taxonKey,
            animal: buildSpeciesFromGbifDetails(id, details, cached),
            cached: Boolean(cached),
            partial: true,
          };
        } else {
          const err = new Error(`Invalid taxon key for species ${id}`);
          reportError(`Unable to hydrate species profile for ID "${id}"`, err);
          throw err;
        }
      } else {
        const err = new Error(`Unable to hydrate species ${id}`);
        reportError(`Unable to hydrate species profile for ID "${id}"`, err);
        throw err;
      }
    } else {
      response = {
        id,
        gbif_taxon_key: fallback.gbifTaxonKey ?? 0,
        animal: fallback,
        cached: true,
        partial: false,
      };
    }
  }

  return {
    ...response,
    animal: {
      ...response.animal,
      id: response.animal.id ?? id,
      gbifTaxonKey: response.animal.gbifTaxonKey ?? response.gbif_taxon_key,
      averageLifespanYears: response.animal.averageLifespanYears ?? null,
      coolFacts: response.animal.coolFacts ?? [],
      habitat: response.animal.habitat ?? [],
      images: response.animal.images ?? [],
      diet: response.animal.diet || "Unknown",
      activityPattern: asActivityPattern(response.animal.activityPattern),
      conservationStatus: asConservationStatus(response.animal.conservationStatus),
      continents: asContinents(response.animal.continents),
      partial: response.partial ?? response.animal.partial ?? false,
    },
  };
}

export async function getCachedSpeciesProfiles(ids: string[]) {
  await initializeSpeciesStore();

  try {
    return await invoke<Animal[]>("get_cached_species_profiles", { ids });
  } catch (err) {
    reportError(`Failed to fetch cached species profiles for multiple IDs`, err);
    return ids
      .map((id) => animalMap.get(id))
      .filter((animal): animal is Animal => Boolean(animal));
  }
}
