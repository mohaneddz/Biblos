import type { Animal, ConservationStatus } from "../types/animal";
import type {
  GbifSearchItem,
  GbifSearchPayload,
  GbifSpeciesDetails,
  SpeciesSearchHit,
  SearchResponse,
} from "../types/speciesStore";
import { getSpeciesSuggestionsFromAI } from "./aiSpeciesService";
import { reportError } from "./errorReporter";

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function preferredCommonName(item: GbifSearchItem) {
  if (item.vernacularName?.trim()) {
    return item.vernacularName.trim();
  }
  return (
    item.vernacularNames?.find((entry) => entry.language?.toLowerCase() === "eng" && entry.vernacularName?.trim())?.vernacularName?.trim() ??
    item.vernacularNames?.find((entry) => entry.vernacularName?.trim())?.vernacularName?.trim() ??
    null
  );
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

  return {
    id: `gbif-${gbifTaxonKey}`,
    gbif_taxon_key: gbifTaxonKey,
    scientific_name: scientificName,
    canonical_name: canonicalName,
    common_name: commonName,
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
      continue;
    }

    const better =
      hitWithBoost.score > existing.score ||
      (hitWithBoost.score === existing.score && Boolean(hitWithBoost.common_name) && !existing.common_name) ||
      (hitWithBoost.score === existing.score && hitWithBoost.is_live_fallback && !existing.is_live_fallback);

    if (better) {
      deduped.set(key, hitWithBoost);
    }
  }

  return [...deduped.values()].sort((a, b) => b.score - a.score || a.canonical_name.localeCompare(b.canonical_name));
}

export async function fetchGbifMatch(scientificName: string, commonName: string): Promise<SpeciesSearchHit | null> {
  try {
    const response = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&kingdom=Animalia`
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.usageKey && data.kingdom?.toLowerCase() === "animalia") {
      return {
        id: `gbif-${data.usageKey}`,
        gbif_taxon_key: data.usageKey,
        scientific_name: data.scientificName || data.canonicalName,
        canonical_name: data.canonicalName || data.scientificName,
        common_name: commonName || data.vernacularName || null,
        rank: data.rank || "SPECIES",
        kingdom: data.kingdom || null,
        phylum: data.phylum || null,
        class_name: data.class || null,
        order_name: data.order || null,
        family: data.family || null,
        genus: data.genus || null,
        source: "GBIF",
        updated_at: new Date().toISOString(),
        score: 5000,
        match_reason: "gbif_common_name",
        is_live_fallback: true,
      };
    }
  } catch (err) {
    reportError(`GBIF match failed for ${scientificName}`, err);
  }
  return null;
}

export async function fetchGbifSearch(query: string, limit: number): Promise<SearchResponse> {
  const aiSuggestionsPromise = getSpeciesSuggestionsFromAI(query);
  const gbifSearchPromise = fetch(
    `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&kingdom=Animalia&status=ACCEPTED&limit=${limit}`,
  ).then(r => {
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return r.json() as Promise<GbifSearchPayload>;
  }).catch((err) => {
    reportError(`GBIF search request failed for query "${query}"`, err);
    return { results: [] };
  });

  const [aiSuggestions, payload] = await Promise.all([aiSuggestionsPromise, gbifSearchPromise]);

  const aiHitsPromises = aiSuggestions.map((s) => fetchGbifMatch(s.scientificName, s.commonName));
  const aiHits = (await Promise.all(aiHitsPromises)).filter((h): h is SpeciesSearchHit => Boolean(h));

  const gbifHits = (payload.results ?? [])
    .map((item, index) => toSearchHitFromGbif(item, index, query))
    .filter((hit): hit is SpeciesSearchHit => Boolean(hit));

  const combinedHits = [...aiHits, ...gbifHits];
  const hits = dedupeSearchHits(combinedHits, query);

  return {
    hits: hits.slice(0, limit),
    used_live_fallback: true,
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
