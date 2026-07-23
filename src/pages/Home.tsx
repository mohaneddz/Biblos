import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { SpeciesImage } from "../components/SpeciesImage";
import { animalMap, animals } from "../data/animals";
import { ecosystems, getFeaturedEcosystemSpecies } from "../data/ecosystems";
import { getRecentlyViewedAnimals, getBookmarkedSpecies, getFavorites, getHiddenSpecies, getAllCachedSpecies, setCachedSpecies } from "../services/cache";
import type { Animal } from "../types/animal";
import { useWikipediaSummaries } from "../services/wikipedia";
import { BookmarkSolidIcon, HeartSolidIcon, SunIcon, SparklesIcon, RefreshIcon } from "../components/icons";
import { hydrateSpeciesProfile, hydrateSpeciesWithAI } from "../services/speciesStore";

function isAnimalHydrated(animal: Animal | null | undefined): boolean {
  if (!animal) return false;
  if (animal.partial) return false;
  if (!animal.coolFacts || animal.coolFacts.length === 0) return false;
  const sDesc = animal.shortDescription?.toLowerCase() ?? "";
  const dDesc = animal.detailedDescription?.toLowerCase() ?? "";
  if (sDesc.includes("pending full hydration") || sDesc.includes("ready for hydration")) return false;
  if (dDesc.includes("pending full hydration") || dDesc.includes("ready for hydration")) return false;
  return true;
}

const quickActions = [
  ["/species", "Species Directory", "Search and filter the full local species index."],
  ["/explorer", "Explorer", "Move across traits, continents, and biome routes in one page."],
  ["/ecosystems", "Ecosystems", "Open the biome library with imagery and species context."],
  ["/collection", "Collection", "Review your favorites, bookmarks, and recently viewed records."],
] as const;

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [storageVersion, setStorageVersion] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [factOffset, setFactOffset] = useState(0);
  const [biomeOffset, setBiomeOffset] = useState(0);
  const [speciesOffset, setSpeciesOffset] = useState(0);
  const [isFactHydrating, setIsFactHydrating] = useState(false);

  // Track visit count in sessionStorage so every home visit displays a different fact for today's animal
  const [visitFactCount] = useState(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return 1;
    try {
      const key = "biblos_home_fact_visit_count";
      const currentStr = window.sessionStorage.getItem(key);
      const current = currentStr ? parseInt(currentStr, 10) : 0;
      const next = current + 1;
      window.sessionStorage.setItem(key, next.toString());
      return next;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    const handler = () => setStorageVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const hidden = useMemo(() => getHiddenSpecies(), [storageVersion]);

  const allAvailableAnimals = useMemo(() => {
    const cached = getAllCachedSpecies();
    const map = new Map<string, Animal>();
    for (const a of animals) if (!hidden.includes(a.id)) map.set(a.id, a);
    for (const a of cached) if (!hidden.includes(a.id)) map.set(a.id, a);
    return [...map.values()];
  }, [hidden, storageVersion]);

  // Deterministic seed for today's date: YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  // Animal of the Day: stays the whole day based on today's date hash (or refreshes on click)
  const animalOfDay = useMemo(() => {
    if (allAvailableAnimals.length === 0) return animals[0];
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash + dayOffset) % allAvailableAnimals.length;
    return allAvailableAnimals[index];
  }, [allAvailableAnimals, todayStr, dayOffset]);

  // Cool Animal Fact: picks a single animal for today (or refreshes on click)
  const coolFactAnimal = useMemo(() => {
    if (allAvailableAnimals.length <= 1) return allAvailableAnimals[0] ?? animals[0];
    const factSeed = todayStr + "-cool-fact-seed";
    let hash = 0;
    for (let i = 0; i < factSeed.length; i++) {
      hash = (hash << 5) - hash + factSeed.charCodeAt(i);
      hash |= 0;
    }
    const pool = allAvailableAnimals.filter((a) => a.id !== animalOfDay?.id);
    const candidatePool = pool.length > 0 ? pool : allAvailableAnimals;
    const index = Math.abs(hash + factOffset) % candidatePool.length;
    return candidatePool[index];
  }, [allAvailableAnimals, animalOfDay, todayStr, factOffset]);

  // Ensure the selected coolFactAnimal is hydrated directly before showing
  useEffect(() => {
    if (!coolFactAnimal) return;
    if (isAnimalHydrated(coolFactAnimal)) {
      setIsFactHydrating(false);
      return;
    }

    let active = true;
    setIsFactHydrating(true);

    async function hydrateSelectedAnimal() {
      try {
        const res = await hydrateSpeciesProfile(coolFactAnimal.id);
        let current = res.animal;

        if (!isAnimalHydrated(current)) {
          try {
            current = await hydrateSpeciesWithAI(current);
          } catch (aiErr) {
            console.error("[Home] AI hydration failed for cool fact animal", aiErr);
          }
        }

        if (active) {
          setCachedSpecies(current);
        }
      } catch (err) {
        console.error("[Home] Failed to hydrate cool fact animal", err);
      } finally {
        if (active) {
          setIsFactHydrating(false);
        }
      }
    }

    hydrateSelectedAnimal();

    return () => {
      active = false;
    };
  }, [coolFactAnimal?.id, coolFactAnimal?.partial, coolFactAnimal?.coolFacts?.length]);

  const coolFact = useMemo(() => {
    if (!coolFactAnimal) return "";
    if (coolFactAnimal.coolFacts && coolFactAnimal.coolFacts.length > 0) {
      const factIndex = (visitFactCount - 1) % coolFactAnimal.coolFacts.length;
      return coolFactAnimal.coolFacts[factIndex];
    }
    if (!coolFactAnimal.shortDescription?.toLowerCase().includes("pending full hydration")) {
      return coolFactAnimal.shortDescription || coolFactAnimal.detailedDescription;
    }
    return "";
  }, [coolFactAnimal, visitFactCount]);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedAnimals()
      .filter((animal) => !hidden.includes(animal.id))
      .slice(0, 3);
  }, [hidden, storageVersion]);

  const featuredEcosystems = useMemo(() => {
    const start = (biomeOffset * 3) % ecosystems.length;
    return [...ecosystems.slice(start, start + 3), ...ecosystems.slice(0, Math.max(0, start + 3 - ecosystems.length))].slice(0, 3);
  }, [biomeOffset]);

  const featuredSpecies = useMemo(() => {
    const endangered = animals
      .filter((animal) => !hidden.includes(animal.id))
      .filter((animal) => animal.conservationStatus === "Endangered" || animal.conservationStatus === "Critically Endangered");
    if (endangered.length === 0) return animals.slice(0, 3);
    const start = (speciesOffset * 3) % endangered.length;
    return [...endangered.slice(start, start + 3), ...endangered.slice(0, Math.max(0, start + 3 - endangered.length))].slice(0, 3);
  }, [hidden, speciesOffset]);

  const biomeSummaries = useWikipediaSummaries(featuredEcosystems.map((ecosystem) => ecosystem.articleTitle));

  return (
    <div className="page-frame">
      <section className="page-card relative overflow-hidden rounded-[2rem] p-6 md:p-8 min-h-[26rem] flex items-center">
        {/* Background image & gradient overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/images/home/hero-african-lion.jpg"
            alt="Savannah and Lion background"
            className="h-full w-full object-cover object-right md:object-center opacity-85"
          />
          {/* Gradients to merge text area into black/dark and ensure high readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent md:from-black/90 md:via-black/40 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 max-w-2xl">
          <p className="text-[1.05rem] text-app-accent font-semibold tracking-wide uppercase">Welcome to</p>
          <h1 className="mt-2 font-display text-[clamp(2.8rem,6.5vw,5rem)] leading-[0.9] tracking-[-0.03em] text-white">
            Biblos Zoes
          </h1>
          <p className="mt-3 text-base md:text-lg leading-7 md:leading-8 text-app-muted font-medium">
            Your AI-assisted encyclopedia of life.
            <br />
            Explore. Learn. Understand.
          </p>
          
          <div className="mt-6 max-w-xl">
            <SearchBar value={query} onChange={setQuery} placeholder="Search for any species, habitat, behavior..." />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-app-soft uppercase tracking-wider font-semibold mr-1">Examples:</span>
            {[
              "African lion",
              "Bioluminescent animals",
              "Nocturnal birds",
              "Animals of Madagascar"
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="px-3 py-1.5 rounded-full border border-white/6 bg-black/35 text-app-muted hover:border-app-accent/30 hover:text-app-accent hover:bg-black/50 transition duration-150 cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="primary-button" onClick={() => navigate(`/species?q=${encodeURIComponent(query)}`)}>
              Search directory
            </button>
            <Link to="/explorer" className="ghost-button">
              Open Explorer
            </Link>
          </div>
        </div>
      </section>

      <section className="page-grid page-grid-3">
        {/* Card 1: Animal of the Day */}
        <div className="page-card rounded-[1.75rem] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="page-section-title flex items-center gap-2">
                <SunIcon className="h-5 w-5 text-app-accent" />
                Animal of the Day
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDayOffset((o) => o + 1)}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-app-muted hover:border-app-accent/40 hover:text-app-accent transition cursor-pointer"
                  title="Shuffle Animal of the Day"
                >
                  <RefreshIcon className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                <span className="rounded-full bg-app-accent/15 border border-app-accent/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-app-accent">
                  Today
                </span>
              </div>
            </div>
            <div className="mt-4 relative overflow-hidden rounded-[1.5rem] border border-white/8">
              <SpeciesImage animal={animalOfDay} className="h-52 w-full" fitClassName="h-52 w-full object-cover" />
              <div className="absolute right-4 top-4 flex gap-2 z-10">
                {getFavorites().includes(animalOfDay.id) && (
                  <div className="rounded-full bg-black/60 p-2 text-app-accent border border-white/10 shadow-lg" title="Favorite">
                    <HeartSolidIcon className="h-4 w-4" />
                  </div>
                )}
                {getBookmarkedSpecies().includes(animalOfDay.id) && (
                  <div className="rounded-full bg-black/60 p-2 text-app-accent border border-white/10 shadow-lg" title="Bookmarked">
                    <BookmarkSolidIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">{animalOfDay.commonName}</h3>
            <p className="mt-1 italic text-app-muted text-sm">{animalOfDay.scientificName}</p>
            <p className="mt-3 text-sm leading-7 text-app-muted line-clamp-3">{animalOfDay.shortDescription}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/species/${animalOfDay.id}`} className="primary-button text-sm">
              Open record
            </Link>
            <Link to={`/explorer?continent=${encodeURIComponent(animalOfDay.continents[0] ?? "Africa")}`} className="ghost-button text-sm">
              View home region
            </Link>
          </div>
        </div>

        {/* Card 2: Cool Animal Fact */}
        <div className="page-card rounded-[1.75rem] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="page-section-title flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-app-accent" />
                Cool Animal Fact
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFactOffset((o) => o + 1)}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-app-muted hover:border-app-accent/40 hover:text-app-accent transition cursor-pointer"
                  title="Shuffle Cool Fact"
                >
                  <RefreshIcon className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-app-soft">
                  Unique
                </span>
              </div>
            </div>
            <div className="mt-4 relative overflow-hidden rounded-[1.5rem] border border-white/8">
              <SpeciesImage animal={coolFactAnimal} className="h-52 w-full" fitClassName="h-52 w-full object-cover" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{coolFactAnimal.commonName}</h3>
            <p className="mt-0.5 italic text-app-muted text-xs">{coolFactAnimal.scientificName}</p>
            
            {isFactHydrating || !isAnimalHydrated(coolFactAnimal) ? (
              <div className="mt-3 rounded-2xl border border-app-accent/20 bg-app-accent/6 p-4 text-sm leading-6 text-app-soft flex items-center gap-3">
                <RefreshIcon className="h-4 w-4 animate-spin text-app-accent flex-shrink-0" />
                <span>Hydrating species facts for {coolFactAnimal.commonName}...</span>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-app-accent/20 bg-app-accent/6 p-4 text-sm leading-6 text-app-soft">
                <span className="font-semibold text-app-accent block mb-1">Did you know?</span>
                "{coolFact}"
              </div>
            )}
          </div>
          <div className="mt-5">
            <Link to={`/species/${coolFactAnimal.id}`} className="ghost-button text-sm w-full flex items-center justify-center gap-2">
              <SparklesIcon className="h-4 w-4 text-app-accent" />
              Explore {coolFactAnimal.commonName}
            </Link>
          </div>
        </div>

        {/* Card 3: Collection Snapshot & Recently Viewed */}
        <div className="page-card rounded-[1.75rem] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="page-section-title flex items-center gap-2">
                <BookmarkSolidIcon className="h-5 w-5 text-app-accent" />
                Recently Viewed
              </h2>
              <button
                type="button"
                onClick={() => setStorageVersion((v) => v + 1)}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-app-muted hover:border-app-accent/40 hover:text-app-accent transition cursor-pointer"
                title="Reload recent collection"
              >
                <RefreshIcon className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {recentlyViewed.length > 0 ? (
                recentlyViewed.map((animal) => (
                  <Link key={animal.id} to={`/species/${animal.id}`} className="interactive-card rounded-[1.2rem] border border-white/7 bg-white/[0.03] p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{animal.commonName}</p>
                      <p className="text-xs italic text-app-muted">{animal.scientificName}</p>
                    </div>
                    <span className="text-xs text-app-accent">View →</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-app-muted">
                  Open species records and they will appear here automatically.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-white/8 pt-4">
            <div className="stat-tile p-3">
              <span className="stat-label">Species Directory</span>
              <strong className="text-base text-app-accent">1,000+ indexed records</strong>
            </div>
            <Link to="/collection" className="ghost-button text-sm w-full mt-3 flex items-center justify-center">
              Open saved items
            </Link>
          </div>
        </div>
      </section>

      <section className="page-card rounded-[1.75rem] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="page-section-title">Quick Actions</h2>
            <p className="mt-2 text-sm leading-7 text-app-muted">
              Each route has a distinct job: directory, explorer, ecosystems, and collection now complement each other instead of overlapping.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(([to, title, description]) => (
            <Link key={to} to={to} className="interactive-card rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,28,21,0.98),rgba(8,12,9,0.95))] p-4">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-app-muted">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title">Featured Biomes</h2>
            <p className="mt-2 text-sm leading-7 text-app-muted">Biome records now carry their own bundled imagery and representative species shortcuts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBiomeOffset((o) => o + 1)}
              className="ghost-button text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshIcon className="h-3.5 w-3.5 text-app-accent" />
              <span>Refresh Biomes</span>
            </button>
            <Link to="/ecosystems" className="ghost-button text-sm">
              Open full biome library
            </Link>
          </div>
        </div>
        <div className="page-grid page-grid-3">
          {featuredEcosystems.map((ecosystem) => {
            const featured = getFeaturedEcosystemSpecies(ecosystem);
            return (
              <Link key={ecosystem.id} to={`/ecosystems/${ecosystem.id}`} className="page-card interactive-card group overflow-hidden rounded-[1.5rem]">
                <div className="relative h-44 overflow-hidden border-b border-white/8">
                  {biomeSummaries[ecosystem.articleTitle]?.thumbnailUrl ? (
                    <img src={biomeSummaries[ecosystem.articleTitle]?.thumbnailUrl ?? ""} alt={ecosystem.title} className="h-full w-full object-cover transition duration-500" />
                  ) : null}
                  <div className="media-vignette" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-2xl font-semibold text-white">{ecosystem.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-7 text-app-muted">{ecosystem.description}</p>
                  <p className="mt-3 text-sm text-app-text">
                    {featured.map((animal) => animal.commonName).join(", ") || "Species mapping expanding"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title">Priority Species</h2>
            <p className="mt-2 text-sm leading-7 text-app-muted">Threatened species remain easy to surface and compare from the local index.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpeciesOffset((o) => o + 1)}
              className="ghost-button text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshIcon className="h-3.5 w-3.5 text-app-accent" />
              <span>Refresh Priority</span>
            </button>
            <Link to="/species?status=Endangered" className="ghost-button text-sm">
              View endangered species
            </Link>
          </div>
        </div>
        <div className="page-grid page-grid-3">
          {featuredSpecies.map((animal) => (
            <AnimalCard key={animal.id} animal={animalMap.get(animal.id) ?? animal} />
          ))}
        </div>
      </section>
    </div>
  );
}
