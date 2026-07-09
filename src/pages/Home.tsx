import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { SpeciesImage } from "../components/SpeciesImage";
import { animalMap, animals } from "../data/animals";
import { ecosystems, getFeaturedEcosystemSpecies } from "../data/ecosystems";
import { getRecentlyViewedAnimals, getBookmarkedSpecies, getFavorites, getHiddenSpecies } from "../services/cache";
import { useWikipediaSummaries } from "../services/wikipedia";
import { BookmarkSolidIcon, HeartSolidIcon } from "../components/icons";

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

  useEffect(() => {
    const handler = () => setStorageVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const hidden = useMemo(() => getHiddenSpecies(), [storageVersion]);

  const animalOfDay = useMemo(() => {
    const visible = animals.filter((a) => !hidden.includes(a.id));
    if (visible.length === 0) return animals[0];
    const dayIndex = new Date().getDate() % visible.length;
    return visible[dayIndex];
  }, [hidden]);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedAnimals()
      .filter((animal) => !hidden.includes(animal.id))
      .slice(0, 3);
  }, [hidden]);

  const featuredEcosystems = ecosystems.slice(0, 3);

  const featuredSpecies = useMemo(() => {
    return animals
      .filter((animal) => !hidden.includes(animal.id))
      .filter((animal) => animal.conservationStatus === "Endangered" || animal.conservationStatus === "Critically Endangered")
      .slice(0, 3);
  }, [hidden]);

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
        <div className="page-card rounded-[1.75rem] p-5">
          <h2 className="page-section-title">Animal of the Day</h2>
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
          <p className="mt-1 italic text-app-muted">{animalOfDay.scientificName}</p>
          <p className="mt-3 text-sm leading-7 text-app-muted">{animalOfDay.shortDescription}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/species/${animalOfDay.id}`} className="primary-button text-sm">
              Open record
            </Link>
            <Link to={`/explorer?continent=${encodeURIComponent(animalOfDay.continents[0] ?? "Africa")}`} className="ghost-button text-sm">
              View home region
            </Link>
          </div>
        </div>

        <div className="page-card rounded-[1.75rem] p-5">
          <h2 className="page-section-title">Recently Viewed</h2>
          <div className="mt-4 grid gap-3">
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((animal) => (
                <Link key={animal.id} to={`/species/${animal.id}`} className="interactive-card rounded-[1.2rem] border border-white/7 bg-white/[0.03] p-4">
                  <p className="font-semibold text-white">{animal.commonName}</p>
                  <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-app-muted">
                Open species records and they will appear here, alongside your evolving collection workflow.
              </p>
            )}
          </div>
        </div>

        <div className="page-card rounded-[1.75rem] p-5">
          <h2 className="page-section-title">Collection Snapshot</h2>
          <div className="mt-4 grid gap-3">
            <div className="stat-tile">
              <span className="stat-label">Directory size</span>
              <strong>{animals.length} species</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Biome library</span>
              <strong>{ecosystems.length} ecosystem records</strong>
            </div>
            <Link to="/collection" className="ghost-button text-sm">
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
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <Link to="/ecosystems" className="ghost-button text-sm">
            Open full biome library
          </Link>
        </div>
        <div className="page-grid page-grid-3">
          {featuredEcosystems.map((ecosystem) => {
            const featured = getFeaturedEcosystemSpecies(ecosystem);
            return (
              <Link key={ecosystem.id} to={`/ecosystems?ecosystem=${encodeURIComponent(ecosystem.id)}`} className="page-card interactive-card group overflow-hidden rounded-[1.5rem]">
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
          <Link to="/species?status=Endangered" className="ghost-button text-sm">
            View endangered species
          </Link>
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
