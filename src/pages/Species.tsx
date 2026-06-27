import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";
import { getBookmarkedSpecies, getFavorites, toggleBookmark, toggleFavorite } from "../services/cache";
import { searchAnimals } from "../services/searchAnimals";
import { previewAnimalFromHit, searchSpeciesLiveFallback, searchSpeciesLocal, type SpeciesSearchHit } from "../services/speciesStore";
import type { Continent } from "../types/animal";

function unique<T>(items: T[]) {
  return [...new Set(items)].sort();
}

export default function Species() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storageVersion, setStorageVersion] = useState(0);
  const [indexedHits, setIndexedHits] = useState<SpeciesSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [usedLiveFallback, setUsedLiveFallback] = useState(false);

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

  const useIndexedSearch = filters.query.trim().length > 0;
  const browseResults = useMemo(() => searchAnimals(animals, filters), [filters]);
  const indexedResults = useMemo(() => indexedHits.map(previewAnimalFromHit), [indexedHits]);
  const results = useIndexedSearch ? indexedResults : browseResults;

  const classes = unique(animals.map((animal) => animal.classification.className));
  const habitats = unique(animals.flatMap((animal) => animal.habitat));
  const diets = unique(animals.map((animal) => animal.diet));
  const statuses = unique(animals.map((animal) => animal.conservationStatus));

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

  const hasActiveFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    if (!useIndexedSearch) {
      setIndexedHits([]);
      setUsedLiveFallback(false);
      setSearchLoading(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearchLoading(true);

      void searchSpeciesLocal(filters.query, 24)
        .then((response) => {
          if (!active) {
            return;
          }

          setIndexedHits(response.hits);
          setUsedLiveFallback(response.used_live_fallback);

          const weakLocal = response.hits.length === 0 || (response.hits[0]?.score ?? 0) < 180;
          if (!weakLocal) {
            return;
          }

          void searchSpeciesLiveFallback(filters.query, 12).then((fallback) => {
            if (!active || fallback.hits.length === 0) {
              return;
            }

            setIndexedHits((current) => {
              const merged = [...current];
              for (const hit of fallback.hits) {
                if (!merged.some((item) => item.id === hit.id)) {
                  merged.push(hit);
                }
              }
              return merged.slice(0, 24);
            });
            setUsedLiveFallback(fallback.used_live_fallback);
          });
        })
        .finally(() => {
          if (active) {
            setSearchLoading(false);
          }
        });
    }, 90);

    return () => {
      active = false;
      window.clearTimeout(timer);
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
          <div className="flex flex-wrap gap-2">
            <span className="tag-chip">{results.length} matches</span>
            {favorites.length > 0 ? <span className="tag-chip">{favorites.length} favorites</span> : null}
            {bookmarks.length > 0 ? <span className="tag-chip">{bookmarks.length} bookmarks</span> : null}
          </div>
        </div>

        <div className="mt-5">
          <SearchBar value={filters.query} onChange={(value) => setFilter("q", value)} />
        </div>

        {useIndexedSearch ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {indexedHits.slice(0, 6).map((hit) => (
              <Link key={hit.id} to={`/species/${hit.id}`} className="tag-chip interactive-chip">
                {hit.common_name ?? hit.canonical_name}
              </Link>
            ))}
            {searchLoading ? <span className="tag-chip">Searching local index...</span> : null}
            {usedLiveFallback ? <span className="tag-chip">Expanded with GBIF live fallback</span> : null}
          </div>
        ) : null}

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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="ghost-button text-sm" onClick={clearFilters}>
            Reset filters
          </button>
          <Link to="/explorer" className="ghost-button text-sm">
            Open explorer shortcuts
          </Link>
          <Link to="/atlas" className="ghost-button text-sm">
            Browse atlas regions
          </Link>
          {useIndexedSearch ? <span className="text-sm text-app-soft">Typed search uses the local species index first, then hydrates records on open.</span> : null}
        </div>
      </section>

      {results.length > 0 ? (
        <section className="page-grid page-grid-3">
          {results.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              trailing={
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="tag-chip interactive-chip"
                    onClick={() => {
                      toggleFavorite(animal.id);
                      bumpStorage();
                    }}
                  >
                    {favorites.includes(animal.id) ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    type="button"
                    className="tag-chip interactive-chip"
                    onClick={() => {
                      toggleBookmark(animal.id);
                      bumpStorage();
                    }}
                  >
                    {bookmarks.includes(animal.id) ? "Bookmarked" : "Bookmark"}
                  </button>
                </div>
              }
            />
          ))}
        </section>
      ) : (
        <section className="page-card rounded-[1.75rem] p-6">
          <h2 className="page-section-title">No species match this search</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-app-muted">
            {hasActiveFilters
              ? "Try clearing one or two filters, or jump through Explorer and Atlas for broader entry points."
              : "The local directory is available, but no records are currently visible."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="primary-button text-sm" onClick={clearFilters}>
              Clear all filters
            </button>
            <Link to="/explorer" className="ghost-button text-sm">
              Open Explorer
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
