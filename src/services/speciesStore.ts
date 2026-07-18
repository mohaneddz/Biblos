import { invoke } from "@tauri-apps/api/core";
import { animalMap, animals } from "../data/animals";
import { getCachedSpecies } from "./cache";
import type { ActivityPattern, Animal, ConservationStatus, Continent } from "../types/animal";
import type { SpeciesSearchHit, SearchResponse, HydratedProfileResponse } from "../types/speciesStore";
import { getSpeciesSuggestionsFromAI, hydrateSpeciesWithAI } from "./aiSpeciesService";
import {
  fetchGbifSearch,
  fetchGbifMatch,
  fetchGbifSpeciesDetails,
  buildSpeciesFromGbifDetails,
  normalizeSearchText,
  dedupeSearchHits,
} from "./gbifService";
import { reportError } from "./errorReporter";

// Re-export types for backward compatibility
export type { SpeciesSearchHit, SearchResponse, HydratedProfileResponse };
export { hydrateSpeciesWithAI };

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

  return { hits, used_live_fallback: false } satisfies SearchResponse;
}

export function previewAnimalFromHit(hit: SpeciesSearchHit): Animal {
  return {
    id: hit.id,
    gbifTaxonKey: hit.gbif_taxon_key,
    commonName: hit.common_name ?? hit.canonical_name,
    scientificName: hit.scientific_name,
    averageLifespanYears: null,
    shortDescription: [hit.rank, hit.class_name, hit.family].filter(Boolean).join(" | ") || "Indexed species entry ready for hydration.",
    detailedDescription: "Open this entry to hydrate its full profile from biodiversity sources.",
    coolFacts: [],
    classification: {
      kingdom: hit.kingdom ?? "Animalia",
      phylum: hit.phylum ?? "Unknown",
      className: hit.class_name ?? "Unknown",
      order: hit.order_name ?? "Unknown",
      family: hit.family ?? "Unknown",
      genus: hit.genus ?? "Unknown",
      species: hit.canonical_name,
    },
    habitat: [],
    diet: "Unknown",
    activityPattern: "Unknown",
    continents: ["Unknown"],
    conservationStatus: "Unknown",
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

export async function searchSpeciesLocal(query: string, limit = 24) {
  await initializeSpeciesStore();

  try {
    const response = await invoke<SearchResponse>("search_species_local", { query, limit });
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
    const aiSuggestionsPromise = getSpeciesSuggestionsFromAI(query);
    const localLookupPromise = invoke<SearchResponse>("lookup_species_and_store", { query, limit }).catch((err) => {
      reportError(`Backend species lookup & storage failed for query "${query}"`, err);
      return { hits: [], used_live_fallback: false } as SearchResponse;
    });

    const [aiSuggestions, localLookup] = await Promise.all([aiSuggestionsPromise, localLookupPromise]);

    const aiHitsPromises = aiSuggestions.map((s) => fetchGbifMatch(s.scientificName, s.commonName, query));
    const aiHits = (await Promise.all(aiHitsPromises)).filter((h): h is SpeciesSearchHit => Boolean(h));

    const combinedHits = [...aiHits, ...localLookup.hits];
    const deduped = {
      ...localLookup,
      hits: dedupeSearchHits(combinedHits, query).slice(0, limit),
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
