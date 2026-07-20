/**
 * filterDiscovery.ts
 *
 * Triggered when non-query filters are active and local results are sparse (< 5).
 * Uses the authoritative-first pipeline:
 *   1. iNaturalist taxon search (ordered by observations_count) for common-name richness
 *   2. GBIF strict match to canonicalise each candidate (rejects matchType=NONE)
 *   3. Wikipedia summary + thumbnail enrichment
 *   4. Cache as partial Animal profiles so they appear in the grid immediately
 *
 * NO AI CANDIDATE INVENTION: Groq never generates species names here.
 * Every candidate must resolve through GBIF before being admitted.
 */

import { getSettings, setCachedSpecies } from "./cache";
import { fetchGbifMatchStrict } from "./gbifService";
import { reportError } from "./errorReporter";
import type { SpeciesSearchHit } from "../types/speciesStore";
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

/**
 * Map filter criteria to an iNaturalist taxon query.
 * iNat uses `iconic_taxon_name` for broad class grouping.
 */
function classToInatIconicName(className: string): string | undefined {
  const lower = className.toLowerCase();
  if (lower.includes("mammalia") || lower.includes("mammal")) return "Mammalia";
  if (lower.includes("aves") || lower.includes("bird")) return "Aves";
  if (lower.includes("reptil")) return "Reptilia";
  if (lower.includes("amphibia")) return "Amphibia";
  if (lower.includes("actinopter") || lower.includes("fish")) return "Actinopterygii";
  if (lower.includes("insect") || lower.includes("arachn") || lower.includes("arthropod")) return "Insecta";
  if (lower.includes("arachnida")) return "Arachnida";
  return undefined;
}

async function fetchWikipediaSummary(
  commonName: string,
): Promise<{ extract: string; thumbnailUrl: string | null } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(commonName)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { extract?: string; thumbnail?: { source?: string } };
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
    detailedDescription:
      wikiExtract ?? "Open this entry to load the full profile from biodiversity sources.",
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

export async function discoverSpeciesByFilters(
  filters: FilterCriteria,
): Promise<SpeciesSearchHit[]> {
  // Only run when AI is enabled (uses iNat API freely, but respects the user's intent)
  const settings = getSettings();
  if (!settings.aiEnabled) return [];

  // Don't re-fetch the same filter combination in the same session
  const key = buildFilterKey(filters);

  if (fetchedFilters.has(key)) return [];
  fetchedFilters.add(key);

  try {
    // 1. Build iNaturalist search URL using filter criteria
    const params = new URLSearchParams({
      per_page: "20",
      order_by: "observations_count",
      rank: "species",
      taxon_id: "1", // Animalia root
    });

    // Map className to iNat iconic_taxon_name
    const iconicName = filters.className ? classToInatIconicName(filters.className) : undefined;
    if (iconicName) params.set("iconic_taxa", iconicName);

    // Use habitat/activity as text hint (iNat doesn't filter these directly)
    const textHint = [filters.habitat, filters.diet, filters.activityPattern, filters.continent]
      .filter(Boolean)
      .join(" ");

    if (textHint) {
      params.set("q", textHint);
    } else if (!iconicName) {
      // Nothing useful to query
      return [];
    }

    const inatUrl = `https://api.inaturalist.org/v1/taxa?${params}`;
    const inatRes = await fetch(inatUrl);
    if (!inatRes.ok) return [];

    const inatData = (await inatRes.json()) as {
      results?: Array<{
        name?: string;
        preferred_common_name?: string;
        id?: number;
        iconic_taxon_name?: string;
      }>;
    };

    const taxa = inatData.results ?? [];
    if (taxa.length === 0) return [];

    // 2. For each iNat taxon, validate through GBIF strict match
    const resolvedHits: SpeciesSearchHit[] = [];

    await Promise.allSettled(
      taxa.map(async (taxon) => {
        const scientificName = taxon.name;
        const commonName = taxon.preferred_common_name ?? scientificName ?? "";
        if (!scientificName) return;

        try {
          // GBIF strict match — rejects matchType=NONE, ensures candidacy
          const [hit, wiki] = await Promise.all([
            fetchGbifMatchStrict(scientificName, commonName),
            fetchWikipediaSummary(commonName || scientificName),
          ]);

          if (!hit) return; // rejected by GBIF — never enters results

          resolvedHits.push(hit);

          // Build and cache a partial Animal profile for immediate grid display
          const partial = buildPartialAnimalFromHit(hit, wiki?.extract, wiki?.thumbnailUrl);
          setCachedSpecies(partial);
        } catch (err) {
          console.debug(`[filter-discovery] Failed to resolve "${commonName}"`, err);
        }
      }),
    );

    return resolvedHits;
  } catch (err) {
    reportError(`Filter-based species discovery failed`, err);
    return [];
  }
}
