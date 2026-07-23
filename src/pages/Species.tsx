import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";
import { flattenTree, treeOfLife } from "../data/treeOfLife";
import { getBookmarkedSpecies, getFavorites, getAllCachedSpecies, getHiddenSpecies } from "../services/cache";
import { searchAnimals } from "../services/searchAnimals";
import { lookupSpeciesAndStore, previewAnimalFromHit, searchSpeciesLocal, reciprocalRankFusion, type SpeciesSearchHit } from "../services/speciesStore";
import { discoverSpeciesByFilters } from "../services/filterDiscovery";
import { searchInatAutocomplete } from "../services/inatService";
import { parseQueryToStructuredFilters } from "../services/aiSpeciesService";
import type { Animal, Continent } from "../types/animal";
import type { StructuredFilters } from "../types/speciesStore";
import { RefreshIcon, CompassIcon, CopyIcon } from "../components/icons";
import { reportError } from "../services/errorReporter";
import { toastService } from "../services/toastService";
import { PageHeader } from "../components/PageHeader";

function unique<T>(items: T[]) {
  return [...new Set(items)].sort();
}

export default function Species() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storageVersion, setStorageVersion] = useState(0);
  const [queryDraft, setQueryDraft] = useState(searchParams.get("q") ?? "");
  const [indexedHits, setIndexedHits] = useState<SpeciesSearchHit[]>([]);
  const [inatHits, setInatHits] = useState<SpeciesSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [filterDiscoveryHits, setFilterDiscoveryHits] = useState<SpeciesSearchHit[]>([]);
  const [filterDiscoveryLoading, setFilterDiscoveryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalIndexedCount, setTotalIndexedCount] = useState(0);
  /** Structured filters parsed from a natural-language query (>= 3 words) by Groq */
  const [parsedFilters, setParsedFilters] = useState<StructuredFilters | null>(null);
  const [parsedFiltersBanner, setParsedFiltersBanner] = useState(false);
  /** Ref for iNat cleanup callback */
  const inatCleanupRef = useRef<(() => void) | null>(null);

  const favorites = useMemo(() => getFavorites(), [storageVersion]);
  const bookmarks = useMemo(() => getBookmarkedSpecies(), [storageVersion]);

  const filters = {
    query: searchParams.get("q") ?? "",
    className: searchParams.get("class") ?? "",
    kingdom: searchParams.get("kingdom") ?? "",
    phylum: searchParams.get("phylum") ?? "",
    order: searchParams.get("order") ?? "",
    family: searchParams.get("family") ?? "",
    genus: searchParams.get("genus") ?? "",
    species: searchParams.get("species") ?? "",
    taxon: searchParams.get("taxon") ?? "",
    habitat: searchParams.get("habitat") ?? "",
    diet: searchParams.get("diet") ?? "",
    activityPattern: (searchParams.get("activity") ?? "") as "" | (typeof activityPatterns)[number],
    conservationStatus: (searchParams.get("status") ?? "") as "" | (typeof animals)[number]["conservationStatus"],
    continent: (searchParams.get("continent") ?? "") as Continent | "",
  };

  useEffect(() => {
    setQueryDraft(filters.query);
  }, [filters.query]);

  // Reset pagination on filter or query change
  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.className, filters.kingdom, filters.phylum, filters.order, filters.family, filters.genus, filters.species, filters.taxon, filters.habitat, filters.diet, filters.activityPattern, filters.conservationStatus, filters.continent]);

  const useIndexedSearch = filters.query.trim().length > 0;

  const allAvailableAnimals = useMemo(() => {
    const cached = getAllCachedSpecies();
    const hidden = getHiddenSpecies();
    const map = new Map<string, Animal>();
    for (const animal of animals) {
      if (!hidden.includes(animal.id)) {
        map.set(animal.id, animal);
      }
    }
    for (const animal of cached) {
      if (!hidden.includes(animal.id)) {
        map.set(animal.id, animal);
      }
    }
    return [...map.values()];
  }, [storageVersion]);

  const browseResults = useMemo(() => searchAnimals(allAvailableAnimals, filters), [allAvailableAnimals, filters]);
  const indexedResults = useMemo(() => indexedHits.map(previewAnimalFromHit), [indexedHits]);
  const inatResults = useMemo(() => inatHits.map(previewAnimalFromHit), [inatHits]);
  const filterDiscoveryResults = useMemo(() => filterDiscoveryHits.map(previewAnimalFromHit), [filterDiscoveryHits]);

  /**
   * Merge all result sources using Reciprocal Rank Fusion.
   *
   * Pipeline:
   *   browseResults   → local FTS5 + Levenshtein (always instant, includes cached)
   *   indexedResults  → backend GBIF/FTS5 search hits
   *   inatResults     → iNaturalist autocomplete (validated via GBIF match)
   *   filterDiscovery → iNat-sourced hits validated through GBIF for active filters
   *
   * Constraints:
   *   - Filters are HARD constraints: any hit failing an active filter is excluded.
   *   - Profile richness (non-partial, has coolFacts) only breaks ties at equal RRF score.
   *   - Popularity (iNat observations count) adds a small boost via the RRF formula.
   *   - Exact lexical matches always float to the top regardless of source.
   */
  const results = useMemo(() => {
    if (useIndexedSearch) {
      // Build per-source ranked lists for RRF
      const browseHits = browseResults.map((a): SpeciesSearchHit => ({
        id: a.id,
        gbif_taxon_key: a.gbifTaxonKey ?? 0,
        scientific_name: a.scientificName,
        canonical_name: a.scientificName,
        common_name: a.commonName,
        aliases: [],
        inat_taxon_id: undefined,
        popularity_score: 0,
        rank: "SPECIES",
        kingdom: a.classification.kingdom || null,
        phylum: a.classification.phylum || null,
        class_name: a.classification.className || null,
        order_name: a.classification.order || null,
        family: a.classification.family || null,
        genus: a.classification.genus || null,
        source: "local",
        updated_at: a.lastFetchedAt ?? new Date().toISOString(),
        // Exact match detection for sort stability: richness only breaks RRF ties
        score: a.partial ? 0 : (a.coolFacts.length > 0 ? 1 : 0.5),
        match_reason: "local",
        is_live_fallback: false,
      }));

      // RRF merge: local, GBIF-indexed, iNat, filter-discovery
      const merged = reciprocalRankFusion([
        browseHits,
        indexedHits,
        inatHits,
        filterDiscoveryHits,
      ]);

      // Convert back to Animals, resolving full profiles from cache where available
      const seenIds = new Set<string>();
      const rawResults: Animal[] = [];

      for (const hit of merged) {
        if (seenIds.has(hit.id)) continue;
        seenIds.add(hit.id);

        // Prefer fully-hydrated cached/local Animal over bare placeholder
        const localAnimal =
          allAvailableAnimals.find((a) => a.id === hit.id) ?? null;
        const animal = localAnimal ?? previewAnimalFromHit(hit);

        // Profile richness tiebreaker: if a local rich profile exists, use it
        rawResults.push(animal);
      }

      return searchAnimals(rawResults, { ...filters, query: "" });
    } else {
      // Browse mode (no text query) — combine indexed database species for this page + static/cached animals
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const rawResults: Animal[] = [];

      for (const animal of indexedResults) {
        const sciLower = animal.scientificName.toLowerCase();
        const comLower = animal.commonName ? animal.commonName.toLowerCase() : "";
        if (seenIds.has(animal.id) || (sciLower && seenNames.has(sciLower)) || (comLower && seenNames.has(comLower))) continue;
        rawResults.push(animal);
        seenIds.add(animal.id);
        if (sciLower) seenNames.add(sciLower);
        if (comLower) seenNames.add(comLower);
      }

      for (const animal of browseResults) {
        const sciLower = animal.scientificName.toLowerCase();
        const comLower = animal.commonName ? animal.commonName.toLowerCase() : "";
        if (seenIds.has(animal.id) || (sciLower && seenNames.has(sciLower)) || (comLower && seenNames.has(comLower))) continue;
        rawResults.push(animal);
        seenIds.add(animal.id);
        if (sciLower) seenNames.add(sciLower);
        if (comLower) seenNames.add(comLower);
      }

      for (const animal of filterDiscoveryResults) {
        const sciLower = animal.scientificName.toLowerCase();
        const comLower = animal.commonName ? animal.commonName.toLowerCase() : "";
        if (seenIds.has(animal.id) || (sciLower && seenNames.has(sciLower)) || (comLower && seenNames.has(comLower))) continue;
        rawResults.push(animal);
        seenIds.add(animal.id);
        if (sciLower) seenNames.add(sciLower);
        if (comLower) seenNames.add(comLower);
      }

      return searchAnimals(rawResults, { ...filters, query: "" });
    }
  }, [
    useIndexedSearch,
    indexedHits,
    inatHits,
    filterDiscoveryHits,
    browseResults,
    indexedResults,
    inatResults,
    filterDiscoveryResults,
    allAvailableAnimals,
    filters.query,
    filters.className,
    filters.kingdom,
    filters.phylum,
    filters.order,
    filters.family,
    filters.genus,
    filters.species,
    filters.taxon,
    filters.habitat,
    filters.diet,
    filters.activityPattern,
    filters.conservationStatus,
    filters.continent,
  ]);

  const effectiveQuery = queryDraft.trim() || filters.query.trim();
  const typingAhead = queryDraft !== filters.query;

  const totalFilteredCount = results.length;
  const PAGE_SIZE = 36;
  const paginatedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, page]);

  const visibleResults = paginatedResults;

  const visibleFavoritesCount = useMemo(() => {
    return results.filter((animal) => favorites.includes(animal.id)).length;
  }, [results, favorites]);

  const visibleBookmarksCount = useMemo(() => {
    return results.filter((animal) => bookmarks.includes(animal.id)).length;
  }, [results, bookmarks]);

  const classes = useMemo(() => unique([
    "Mammalia", "Aves", "Reptilia", "Squamata", "Testudines", "Crocodylia", "Amphibia", "Actinopterygii", "Elasmobranchii", "Holocephali", "Sarcopterygii", "Petromyzontida", "Myxini",
    "Insecta", "Arachnida", "Malacostraca", "Diplopoda", "Chilopoda", "Maxillopoda", "Merostomata",
    "Gastropoda", "Cephalopoda", "Bivalvia", "Polyplacophora",
    "Anthozoa", "Hydrozoa", "Scyphozoa", "Asteroidea", "Echinoidea", "Clitellata",
    "Cyanophyceae", "Alphaproteobacteria", "Bacilli", "Actinomycetia", "Halobacteria", "Thermoprotei",
    "Magnoliopsida", "Bryopsida", "Polypodiopsida", "Pinopsida", "Agaricomycetes", "Pezizomycetes",
    "Dinophyceae", "Myxogastrea", "Phaeophyceae", "Bacteria", "Archaea", "Fungi", "Plantae", "Protista",
    ...flattenTree(treeOfLife)
      .filter((node) => node.rank === "Class")
      .map((node) => node.scope?.className ?? node.label),
    ...allAvailableAnimals.map((a) => a.classification.className),
    ...indexedResults.map((a) => a.classification.className),
  ].filter(Boolean)), [allAvailableAnimals, indexedResults]);

  const habitats = useMemo(() => unique([
    "Savannah", "Tropical Rainforest", "Ocean", "Desert", "Forest", "Wetlands", "Grassland", "Arctic & Tundra", "Mountains", "Coral Reef", "Coastal", "Freshwater",
    ...allAvailableAnimals.flatMap((a) => a.habitat),
    ...indexedResults.flatMap((a) => a.habitat),
  ].filter(Boolean)), [allAvailableAnimals, indexedResults]);

  const diets = useMemo(() => unique([
    "Carnivore", "Herbivore", "Omnivore", "Insectivore", "Piscivore", "Frugivore",
    ...allAvailableAnimals.map((a) => a.diet),
    ...indexedResults.map((a) => a.diet),
  ].filter(Boolean)), [allAvailableAnimals, indexedResults]);

  const statuses = useMemo(() => unique([
    "Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered",
    ...allAvailableAnimals.map((a) => a.conservationStatus),
    ...indexedResults.map((a) => a.conservationStatus),
  ].filter(Boolean)), [allAvailableAnimals, indexedResults]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  function applyParsedFilters() {
    if (!parsedFilters) return;
    const next = new URLSearchParams(searchParams);
    if (parsedFilters.className) next.set("class", parsedFilters.className);
    if (parsedFilters.habitat) next.set("habitat", parsedFilters.habitat);
    if (parsedFilters.diet) next.set("diet", parsedFilters.diet);
    if (parsedFilters.activityPattern) next.set("activity", parsedFilters.activityPattern);
    if (parsedFilters.conservationStatus) next.set("status", parsedFilters.conservationStatus);
    if (parsedFilters.continent) next.set("continent", parsedFilters.continent);

    if (parsedFilters.textRemainder) {
      next.set("q", parsedFilters.textRemainder);
      setQueryDraft(parsedFilters.textRemainder);
    } else {
      next.delete("q");
      setQueryDraft("");
    }

    setSearchParams(next);
    setParsedFiltersBanner(false);
    toastService.success("AI parsed filters applied!");
  }

  function bumpStorage() {
    setStorageVersion((value) => value + 1);
  }

  const handleCopyResults = () => {
    const jsonStr = JSON.stringify(visibleResults, null, 2);
    navigator.clipboard.writeText(jsonStr)
      .then(() => {
        toastService.success(`Copied ${visibleResults.length} species as JSON`);
      })
      .catch((err) => {
        console.error("Failed to copy results", err);
        reportError("Failed to copy search results", err);
      });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  async function runLookup() {
    const query = queryDraft.trim() || filters.query.trim();
    if (!query) {
      return;
    }

    if (query !== filters.query.trim()) {
      const next = new URLSearchParams(searchParams);
      next.set("q", query);
      setSearchParams(next);
    }

    setLookupLoading(true);
    console.info("[species-search] lookup requested", { query });

    try {
      const response = await lookupSpeciesAndStore(query, 50);
      setIndexedHits(response.hits);
      console.info("[species-search] lookup completed", {
        query,
        hits: response.hits.length,
        usedLiveFallback: response.used_live_fallback,
      });
      if (response.hits.length === 0) {
        console.warn("[species-search] lookup returned no matches", { query });
        reportError(`No matches found for "${query}". Try check spelling or scientific name.`);
      }
    } catch (error) {
      console.error("[species-search] lookup failed", { query, error });
      reportError(`Failed to lookup species "${query}". Check connectivity or API settings.`, error);
    } finally {
      setLookupLoading(false);
    }
  }

  useEffect(() => {
    if (queryDraft === filters.query) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFilter("q", queryDraft);
      console.info("[species-search] query updated", { query: queryDraft });
    }, 160);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.query, queryDraft]);

  useEffect(() => {
    const handler = () => bumpStorage();
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  // Filter-driven iNat discovery: when non-text filters are active and local results are sparse
  const hasNonQueryFilter = !!(filters.className || filters.habitat || filters.diet || filters.activityPattern || filters.conservationStatus || filters.continent);
  useEffect(() => {
    if (!hasNonQueryFilter) {
      setFilterDiscoveryHits([]);
      return;
    }
    // Only trigger discovery when we have very few local matches
    if (browseResults.length >= 5) return;

    let active = true;
    setFilterDiscoveryLoading(true);
    void discoverSpeciesByFilters({
      className: filters.className || undefined,
      habitat: filters.habitat || undefined,
      diet: filters.diet || undefined,
      activityPattern: filters.activityPattern || undefined,
      conservationStatus: filters.conservationStatus || undefined,
      continent: filters.continent || undefined,
    }).then((hits) => {
      if (!active) return;
      setFilterDiscoveryHits(hits);
    }).finally(() => {
      if (active) setFilterDiscoveryLoading(false);
    });
    return () => { active = false; };
  }, [filters.className, filters.habitat, filters.diet, filters.activityPattern, filters.conservationStatus, filters.continent, hasNonQueryFilter]);

  // NL query parsing: when query looks like a phrase (>= 3 words), parse into structured filters
  useEffect(() => {
    const q = filters.query.trim();
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      setParsedFilters(null);
      setParsedFiltersBanner(false);
      return;
    }

    let active = true;
    void parseQueryToStructuredFilters(q).then((result) => {
      if (!active || !result) return;
      // Only show banner if any filter was parsed
      const hasAnyFilter = Object.entries(result)
        .filter(([k]) => k !== "text_remainder")
        .some(([, v]) => Boolean(v));
      if (hasAnyFilter) {
        setParsedFilters(result);
        setParsedFiltersBanner(true);
      }
    });

    return () => { active = false; };
  }, [filters.query]);

  // iNaturalist autocomplete: runs on every committed query (debounced in service)
  useEffect(() => {
    if (inatCleanupRef.current) {
      inatCleanupRef.current();
      inatCleanupRef.current = null;
    }

    const q = filters.query.trim();
    if (!q) {
      setInatHits([]);
      return;
    }

    const cleanup = searchInatAutocomplete(q, (hits) => {
      setInatHits(hits);
    }, 20);

    inatCleanupRef.current = cleanup;

    return () => {
      cleanup();
      inatCleanupRef.current = null;
    };
  }, [filters.query]);




  useEffect(() => {
    let active = true;
    setSearchLoading(true);
    console.info("[species-search] local search started", { query: filters.query });

    void searchSpeciesLocal(filters.query, 5000, 0)
      .then((response) => {
        if (!active) {
          return;
        }
        setIndexedHits(response.hits);
        setTotalIndexedCount(response.total_count ?? response.hits.length);
        console.info("[species-search] local search finished", {
          query: filters.query,
          hits: response.hits.length,
          total: response.total_count,
        });
      })
      .finally(() => {
        if (active) {
          setSearchLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filters.query]);

  return (
    <div className="page-frame">
      <PageHeader
        title="Species Directory"
        description="Search the local field index by taxonomy, ecology, geography, and activity pattern. Every discovery route in Biblos lands here."
        storageKey="species"
      />

      <section className="page-card rounded-[1.75rem] p-6 mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag-chip">
              {hasActiveFilters
                ? `${totalFilteredCount} matches`
                : totalIndexedCount > 0
                  ? `${totalIndexedCount} indexed species`
                  : `${totalFilteredCount} matches`}
            </span>
            {visibleFavoritesCount > 0 ? <span className="tag-chip">{visibleFavoritesCount} favorites</span> : null}
            {visibleBookmarksCount > 0 ? <span className="tag-chip">{visibleBookmarksCount} bookmarks</span> : null}

            <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={clearFilters}
                className="ghost-button p-2 rounded-xl min-h-0 text-app-muted hover:text-app-accent hover:border-app-accent/30 transition cursor-pointer"
                title="Reset filters"
              >
                <RefreshIcon className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <SearchBar
            value={queryDraft}
            onChange={setQueryDraft}
            onLookup={runLookup}
            lookupDisabled={lookupLoading || effectiveQuery.length === 0}
            busy={searchLoading || lookupLoading}
            statusLabel={
              lookupLoading
                ? `Looking up ${effectiveQuery || "species"} in GBIF...`
                : searchLoading
                  ? `Searching the local index for ${effectiveQuery || "species"}...`
                  : undefined
            }
          />
        </div>

        {[
          ["Kingdom", filters.kingdom],
          ["Phylum", filters.phylum],
          ["Class", filters.className],
          ["Order", filters.order],
          ["Family", filters.family],
          ["Genus", filters.genus],
          ["Species", filters.species],
          ["Taxon", filters.taxon],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="mt-3 flex flex-wrap items-center gap-2">
            <span className="tag-chip text-app-accent border-app-accent/25">{label}: {value}</span>
          </div>
        ))}

        {parsedFiltersBanner && parsedFilters && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-app-accent/20 bg-app-accent/5 p-4 text-sm text-app-soft transition animate-fade-in">
            <div className="flex items-center gap-2">
              <CompassIcon className="h-5 w-5 text-app-accent flex-shrink-0" />
              <div>
                <span className="font-semibold text-app-text">AI Query Parser:</span> Detected filters for {" "}
                <span className="font-medium text-app-accent">
                  {[
                    parsedFilters.className && `Class: ${parsedFilters.className}`,
                    parsedFilters.habitat && `Habitat: ${parsedFilters.habitat}`,
                    parsedFilters.diet && `Diet: ${parsedFilters.diet}`,
                    parsedFilters.activityPattern && `Activity: ${parsedFilters.activityPattern}`,
                    parsedFilters.conservationStatus && `Status: ${parsedFilters.conservationStatus}`,
                    parsedFilters.continent && `Continent: ${parsedFilters.continent}`,
                  ].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={applyParsedFilters}
                className="rounded-lg bg-app-accent/20 px-3 py-1.5 font-medium text-app-accent hover:bg-app-accent/30 transition cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => setParsedFiltersBanner(false)}
                className="rounded-lg hover:bg-white/5 px-2 py-1.5 text-app-muted hover:text-app-text transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 min-w-0 w-full">
          {[
            { key: "class", label: "Class", current: filters.className, options: classes },
            { key: "habitat", label: "Habitat", current: filters.habitat, options: habitats },
            { key: "diet", label: "Diet", current: filters.diet, options: diets },
            { key: "activity", label: "Activity", current: filters.activityPattern, options: activityPatterns },
            { key: "status", label: "Status", current: filters.conservationStatus, options: statuses },
            { key: "continent", label: "Continent", current: filters.continent, options: continents },
          ].map(({ key, label, current, options }) => (
            <label key={key} className="flex flex-col gap-1.5 text-xs font-medium text-app-muted min-w-0">
              <span className="truncate">{label}</span>
              <select
                value={current}
                onChange={(event) => setFilter(key, event.target.value)}
                className="w-full min-w-0 rounded-[1rem] border border-white/8 bg-black/30 px-3 py-2.5 text-sm text-app-text truncate focus:border-app-accent/40 focus:outline-none cursor-pointer"
              >
                <option value="">All</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {useIndexedSearch || searchLoading || lookupLoading || filterDiscoveryLoading ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {indexedHits.slice(0, 6).map((hit) => (
              <Link key={hit.id} to={`/species/${hit.id}`} className="tag-chip interactive-chip">
                {hit.common_name ?? hit.canonical_name}
              </Link>
            ))}
            {searchLoading ? (
              <span className="loading-chip tag-chip">
                <span className="spinner-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Searching local index</span>
              </span>
            ) : null}
            {lookupLoading ? (
              <span className="loading-chip tag-chip">
                <span className="spinner-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Looking up GBIF</span>
              </span>
            ) : null}
            {filterDiscoveryLoading ? (
              <span className="loading-chip tag-chip">
                <span className="spinner-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Discovering via AI…</span>
              </span>
            ) : (filterDiscoveryHits.length > 0 && hasNonQueryFilter) ? (
              <span className="tag-chip text-app-accent border-app-accent/25">
                +{filterDiscoveryHits.length} AI-discovered
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {(searchLoading || lookupLoading || filterDiscoveryLoading) ? (
        <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden mt-5 mb-3">
          <div className="absolute top-0 bottom-0 bg-[linear-gradient(90deg,var(--app-accent),#7e8364)] rounded-full animate-progress-slide" />
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <>
          <section className="page-grid page-grid-3">
            {visibleResults.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
              />
            ))}
          </section>

          {/* Pagination Bar for batch browsing */}
          {totalFilteredCount > PAGE_SIZE && (
            <section className="page-card rounded-[1.5rem] p-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-app-muted">
                Showing <span className="font-semibold text-white">{(page - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-semibold text-white">{Math.min(page * PAGE_SIZE, totalFilteredCount)}</span> of{" "}
                <span className="font-semibold text-app-accent">{totalFilteredCount}</span> indexed species
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="ghost-button px-3.5 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, Math.ceil(totalFilteredCount / PAGE_SIZE)) }, (_, i) => {
                    const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE);
                    let pageNum = i + 1;
                    if (totalPages > 7) {
                      if (page > 4 && page < totalPages - 3) {
                        pageNum = page - 3 + i;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={[
                          "h-8 w-8 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center",
                          page === pageNum
                            ? "bg-app-accent text-white font-bold shadow-md"
                            : "hover:bg-white/10 text-app-muted hover:text-white",
                        ].join(" ")}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page * PAGE_SIZE >= totalFilteredCount}
                  onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="ghost-button px-3.5 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </section>
          )}

          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleCopyResults}
              className="ghost-button"
            >
              <CopyIcon className="h-5 w-5 text-app-accent" />
              <span>Copy Page Results</span>
            </button>
          </div>
        </>
      ) : (
        <section className="flex items-start gap-4 rounded-[1.25rem] border border-white/8 bg-black/15 px-5 py-5 text-app-muted">
          <span className="loading-orb flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-app-accent">
            <span className="spinner-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-app-text">
              {effectiveQuery ? `Couldn't find "${effectiveQuery}" yet` : "Nothing found yet"}
            </p>
            <p className="text-sm leading-6 text-app-muted">
              {lookupLoading
                ? "Searching GBIF now. If this stays empty, try the scientific name or a spelling variant."
                : typingAhead
                  ? "Keep typing and the list will update after you pause."
                  : hasActiveFilters
                    ? "Try a broader term, clear some filters, or hit Lookup to fetch more from GBIF."
                    : "Type a species name, then use Lookup if it is not already in the local index."}
            </p>
            {effectiveQuery ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="tag-chip interactive-chip" onClick={runLookup} disabled={lookupLoading}>
                  {lookupLoading ? "Looking up..." : "Retry lookup"}
                </button>
                <button
                  type="button"
                  className="tag-chip interactive-chip"
                  onClick={() => {
                    setQueryDraft("");
                    clearFilters();
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
