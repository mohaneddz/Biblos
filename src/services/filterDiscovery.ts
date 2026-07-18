/**
 * filterDiscovery.ts
 *
 * Triggered when active non-query filters produce sparse local results (< 5).
 * Asks the LLM to suggest matching species, resolves them via GBIF, fetches
 * Wikipedia summaries, and caches them as partial Animal profiles so they
 * immediately appear in the Species Directory grid.
 */

import { getSettings } from "./cache";
import { setCachedSpecies } from "./cache";
import { getSpeciesSuggestionsFromAI } from "./aiSpeciesService";
import { fetchGbifMatch } from "./gbifService";
import { reportError } from "./errorReporter";
import type { SpeciesSearchHit } from "./speciesStore";
import type { Animal } from "../types/animal";

export type FilterCriteria = {
  className?: string;
  habitat?: string;
  diet?: string;
  activityPattern?: string;
  conservationStatus?: string;
  continent?: string;
};

// In-memory cache of filter combos already fetched this session
const fetchedFilters = new Set<string>();

function buildFilterKey(filters: FilterCriteria): string {
  return JSON.stringify({
    c: filters.className ?? "",
    h: filters.habitat ?? "",
    d: filters.diet ?? "",
    a: filters.activityPattern ?? "",
    s: filters.conservationStatus ?? "",
    k: filters.continent ?? "",
  });
}

function buildNaturalLanguageQuery(filters: FilterCriteria): string {
  const parts: string[] = [];

  if (filters.diet) parts.push(`${filters.diet} animals`);
  else parts.push("animals");

  if (filters.className) parts.push(`in the class ${filters.className}`);
  if (filters.activityPattern) parts.push(`that are ${filters.activityPattern}`);
  if (filters.habitat) parts.push(`found in ${filters.habitat}`);
  if (filters.continent) parts.push(`native to ${filters.continent}`);
  if (filters.conservationStatus) parts.push(`with conservation status ${filters.conservationStatus}`);

  return parts.join(", ");
}

async function fetchWikipediaSummary(commonName: string): Promise<{ extract: string; thumbnailUrl: string | null } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(commonName)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { extract?: string; thumbnail?: { source?: string } };
    return {
      extract: data.extract ?? "",
      thumbnailUrl: data.thumbnail?.source ?? null,
    };
  } catch {
    return null;
  }
}

function buildPartialAnimalFromHit(
  hit: SpeciesSearchHit,
  wikiExtract?: string,
  thumbnailUrl?: string | null,
): Animal {
  return {
    id: hit.id,
    gbifTaxonKey: hit.gbif_taxon_key,
    commonName: hit.common_name ?? hit.canonical_name,
    scientificName: hit.scientific_name,
    averageLifespanYears: null,
    shortDescription: wikiExtract
      ? wikiExtract.slice(0, 280)
      : `${hit.common_name ?? hit.canonical_name} — indexed via GBIF, pending full hydration.`,
    detailedDescription: wikiExtract ?? "Open this entry to load the full profile from biodiversity sources.",
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
    images: thumbnailUrl ? [thumbnailUrl] : [],
    has3DModel: false,
    sourceUrls: [],
    lastFetchedAt: new Date().toISOString(),
    partial: true,
  };
}

export async function discoverSpeciesByFilters(filters: FilterCriteria): Promise<SpeciesSearchHit[]> {
  const settings = getSettings();
  if (!settings.aiEnabled || !settings.groqApiKey) return [];

  // Don't re-fetch the same filter combination in the same session
  const key = buildFilterKey(filters);
  if (fetchedFilters.has(key)) return [];
  fetchedFilters.add(key);

  const naturalQuery = buildNaturalLanguageQuery(filters);
  if (!naturalQuery) return [];

  try {
    // 1. Ask the LLM for species matching the filter criteria
    const suggestions = await getSpeciesSuggestionsFromAI(
      `List 12 real animal species that are ${naturalQuery}. Focus on species that match ALL of the given criteria.`
    );

    if (suggestions.length === 0) return [];

    // 2. Resolve each suggestion to a GBIF taxon key + fetch Wikipedia summary in parallel
    const resolvedHits: SpeciesSearchHit[] = [];

    await Promise.allSettled(
      suggestions.map(async ({ scientificName, commonName }) => {
        try {
          const [hit, wiki] = await Promise.all([
            fetchGbifMatch(scientificName, commonName),
            fetchWikipediaSummary(commonName),
          ]);

          if (!hit) return;

          resolvedHits.push(hit);

          // Build and cache a partial Animal profile so it shows up in the grid immediately
          const partial = buildPartialAnimalFromHit(
            hit,
            wiki?.extract,
            wiki?.thumbnailUrl,
          );
          setCachedSpecies(partial);
        } catch (err) {
          console.debug(`[filter-discovery] Failed to resolve "${commonName}"`, err);
        }
      })
    );

    return resolvedHits;
  } catch (err) {
    reportError(`Filter-based species discovery failed for query "${naturalQuery}"`, err);
    return [];
  }
}
