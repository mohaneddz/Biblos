import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";
import { getBookmarkedSpecies, getFavorites, getAllCachedSpecies, getHiddenSpecies } from "../services/cache";
import { searchAnimals } from "../services/searchAnimals";
import { lookupSpeciesAndStore, previewAnimalFromHit, searchSpeciesLocal, type SpeciesSearchHit } from "../services/speciesStore";
import type { Animal, Continent } from "../types/animal";
import { RefreshIcon, AtlasIcon, CompassIcon, CopyIcon } from "../components/icons";
import { reportError } from "../services/errorReporter";
import { toastService } from "../services/toastService";

function unique<T>(items: T[]) {
  return [...new Set(items)].sort();
}

/** Unified relevance score used when merging browse + indexed results. */
function mergeRelevanceScore(animal: Animal, query: string): number {
  const common = animal.commonName.toLowerCase();
  const words = common.split(/\s+/);
  let score = 0;

  // Richness boost: fully-detailed entries rank above bare placeholders
  const isRich = !animal.partial && animal.coolFacts.length > 0;
  if (isRich) score += 100;

  // Head-noun match: "Bengal Tiger" for query "tiger" → IS a tiger
  if (common === query) {
    score += 200;
  } else if (words.length > 1 && words[words.length - 1] === query) {
    score += 80;
  } else if (common.startsWith(query)) {
    score += 60;
  } else if (words.includes(query)) {
    score += 50;
  } else if (common.includes(query)) {
    score += 20;
  }

  return score;
}

export default function Species() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storageVersion, setStorageVersion] = useState(0);
  const [queryDraft, setQueryDraft] = useState(searchParams.get("q") ?? "");
  const [indexedHits, setIndexedHits] = useState<SpeciesSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);


  const favorites = useMemo(() => getFavorites(), [storageVersion]);
  const bookmarks = useMemo(() => getBookmarkedSpecies(), [storageVersion]);

  const filters = {
    query: searchParams.get("q") ?? "",
    className: searchParams.get("class") ?? "",
    habitat: searchParams.get("habitat") ?? "",
    diet: searchParams.get("diet") ?? "",
    activityPattern: (searchParams.get("activity") ?? "") as "" | (typeof activityPatterns)[number],
    conservationStatus: (searchParams.get("status") ?? "") as "" | (typeof animals)[number]["conservationStatus"],
    continent: (searchParams.get("continent") ?? "") as Continent | "",
  };

  useEffect(() => {
    setQueryDraft(filters.query);
  }, [filters.query]);

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

  // browseResults (local + cached animals) are always available instantly.
  // indexedResults (GBIF placeholders) are merged in as they arrive from the async search.
  // This means the grid is NEVER empty while a query is active — local matches show up
  // immediately on every keystroke, and GBIF hits appear on top once fetched.
  const results = useMemo(() => {
    let rawResults: Animal[] = [];
    if (useIndexedSearch) {
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      // 1. Add browseResults first (fully detailed static / cached entries) — these are
      //    available synchronously on every render, so the grid is never gated on network.
      for (const animal of browseResults) {
        rawResults.push(animal);
        seenIds.add(animal.id);
        seenNames.add(animal.scientificName.toLowerCase());
        if (animal.commonName) {
          seenNames.add(animal.commonName.toLowerCase());
        }
      }

      // 2. Add indexedResults (placeholders) if not already represented.
      // We also deduplicate by common name: if we already have any animal with the
      // same vernacular name (e.g. "aye aye" genus AND "aye aye" species), keep only
      // the one we already added (browse results win; within indexed, first/highest wins).
      for (const animal of indexedResults) {
        const sciLower = animal.scientificName.toLowerCase();
        const comLower = animal.commonName.toLowerCase();
        // Skip if this exact record is already seen, OR if we already have a different
        // record with the same common name (prevents genus/family/species triplicates).
        if (seenIds.has(animal.id) || seenNames.has(sciLower) || seenNames.has(comLower)) {
          continue;
        }
        rawResults.push(animal);
        seenIds.add(animal.id);
        seenNames.add(sciLower);
        seenNames.add(comLower);
      }

      // 3. Sort merged results by unified relevance score
      const q = filters.query.trim().toLowerCase();
      if (q) {
        rawResults.sort((a, b) => {
          const scoreA = mergeRelevanceScore(a, q);
          const scoreB = mergeRelevanceScore(b, q);
          if (scoreA !== scoreB) return scoreB - scoreA;
          return a.commonName.localeCompare(b.commonName);
        });
      }
    } else {
      rawResults = browseResults;
    }

    return rawResults.filter((animal) => {
      if (filters.className && animal.classification.className !== filters.className) return false;
      if (filters.habitat && !animal.habitat.includes(filters.habitat)) return false;
      if (filters.diet && animal.diet !== filters.diet) return false;
      if (filters.activityPattern && animal.activityPattern !== filters.activityPattern) return false;
      if (filters.conservationStatus && animal.conservationStatus !== filters.conservationStatus) return false;
      if (filters.continent && !animal.continents.includes(filters.continent)) return false;
      return true;
    });
  }, [useIndexedSearch, indexedResults, browseResults, filters]);

  const effectiveQuery = queryDraft.trim() || filters.query.trim();
  const typingAhead = queryDraft !== filters.query;
  const visibleResults = results;

  const visibleFavoritesCount = useMemo(() => {
    return visibleResults.filter((animal) => favorites.includes(animal.id)).length;
  }, [visibleResults, favorites]);

  const visibleBookmarksCount = useMemo(() => {
    return visibleResults.filter((animal) => bookmarks.includes(animal.id)).length;
  }, [visibleResults, bookmarks]);

  const classes = unique(allAvailableAnimals.map((animal) => animal.classification.className));
  const habitats = unique(allAvailableAnimals.flatMap((animal) => animal.habitat));
  const diets = unique(allAvailableAnimals.map((animal) => animal.diet));
  const statuses = unique(allAvailableAnimals.map((animal) => animal.conservationStatus));

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



  useEffect(() => {
    if (!useIndexedSearch) {
      setIndexedHits([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    // Run immediately on the next microtask tick — no debounce delay needed since
    // browseResults are already shown synchronously and this only adds GBIF placeholders.
    setSearchLoading(true);
    console.info("[species-search] local search started", { query: filters.query });

    void searchSpeciesLocal(filters.query, 24)
      .then((response) => {
        if (!active) {
          return;
        }
        setIndexedHits(response.hits);
        console.info("[species-search] local search finished", {
          query: filters.query,
          hits: response.hits.length,
          usedLiveFallback: response.used_live_fallback,
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
  }, [filters.query, useIndexedSearch]);

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Species Directory</h1>
            <p className="page-lede">
              Search the local field index by taxonomy, ecology, geography, and activity pattern. Every discovery route in Biblos lands here.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag-chip">{visibleResults.length} matches</span>
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
              <Link
                to="/explorer"
                className="ghost-button p-2 rounded-xl min-h-0 text-app-muted hover:text-app-accent hover:border-app-accent/30 transition cursor-pointer"
                title="Open explorer shortcuts"
              >
                <AtlasIcon className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/explorer"
                className="ghost-button p-2 rounded-xl min-h-0 text-app-muted hover:text-app-accent hover:border-app-accent/30 transition cursor-pointer"
                title="Browse regional routes"
              >
                <CompassIcon className="h-4.5 w-4.5" />
              </Link>
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

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {[
            { key: "class", label: "Class", current: filters.className, options: classes },
            { key: "habitat", label: "Habitat", current: filters.habitat, options: habitats },
            { key: "diet", label: "Diet", current: filters.diet, options: diets },
            { key: "activity", label: "Activity", current: filters.activityPattern, options: activityPatterns },
            { key: "status", label: "Status", current: filters.conservationStatus, options: statuses },
            { key: "continent", label: "Continent", current: filters.continent, options: continents },
          ].map(({ key, label, current, options }) => (
            <label key={key} className="grid gap-2 text-sm text-app-muted">
              <span>{label}</span>
              <select
                value={current}
                onChange={(event) => setFilter(key, event.target.value)}
                className="rounded-[1rem] border border-white/8 bg-black/25 px-4 py-3 text-app-text"
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

        {useIndexedSearch || searchLoading || lookupLoading ? (
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
          </div>
        ) : null}
      </section>

      {(searchLoading || lookupLoading) ? (
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
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleCopyResults}
              className="ghost-button"
            >
              <CopyIcon className="h-5 w-5 text-app-accent" />
              <span>Copy Results</span>
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
