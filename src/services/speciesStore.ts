import { invoke } from "@tauri-apps/api/core";
import { animalMap, animals } from "../data/animals";
import type { ActivityPattern, Animal, ConservationStatus, Continent } from "../types/animal";

export type SpeciesSearchHit = {
  id: string;
  gbif_taxon_key: number;
  scientific_name: string;
  canonical_name: string;
  common_name: string | null;
  rank: string;
  kingdom: string | null;
  phylum: string | null;
  class_name: string | null;
  order_name: string | null;
  family: string | null;
  genus: string | null;
  source: string;
  updated_at: string;
  score: number;
  match_reason: string;
  is_live_fallback: boolean;
};

type SearchResponse = {
  hits: SpeciesSearchHit[];
  used_live_fallback: boolean;
};

type HydratedProfileResponse = {
  id: string;
  gbif_taxon_key: number;
  animal: Animal;
  cached: boolean;
  partial: boolean;
};

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
  const q = query.trim().toLowerCase();
  const hits = animals
    .filter((animal) => !q || `${animal.commonName} ${animal.scientificName}`.toLowerCase().includes(q))
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
    initialization = invoke<string>("initialize_species_store").catch(() => "mock");
  }
  return initialization;
}

export async function searchSpeciesLocal(query: string, limit = 24) {
  await initializeSpeciesStore();

  try {
    return await invoke<SearchResponse>("search_species_local", { query, limit });
  } catch {
    return mockSearch(query);
  }
}

export async function searchSpeciesLiveFallback(query: string, limit = 12) {
  await initializeSpeciesStore();

  try {
    return await invoke<SearchResponse>("search_species_live_fallback", { query, limit });
  } catch {
    return mockSearch(query);
  }
}

export async function hydrateSpeciesProfile(id: string, forceRefresh = false) {
  await initializeSpeciesStore();

  if (!id.startsWith("gbif-") && animalMap.has(id)) {
    return {
      id,
      gbif_taxon_key: animalMap.get(id)?.gbifTaxonKey ?? 0,
      animal: animalMap.get(id)!,
      cached: true,
      partial: false,
    } satisfies HydratedProfileResponse;
  }

  let response: HydratedProfileResponse;
  try {
    response = await invoke<HydratedProfileResponse>("hydrate_species_profile", {
      id,
      forceRefresh,
    });
  } catch {
    const fallback = animalMap.get(id);
    if (!fallback) {
      throw new Error(`Unable to hydrate species ${id}`);
    }
    response = {
      id,
      gbif_taxon_key: fallback.gbifTaxonKey ?? 0,
      animal: fallback,
      cached: true,
      partial: false,
    };
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
  } catch {
    return ids
      .map((id) => animalMap.get(id))
      .filter((animal): animal is Animal => Boolean(animal));
  }
}
