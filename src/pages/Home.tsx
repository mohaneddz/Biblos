import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { SpeciesImage } from "../components/SpeciesImage";
import { animalMap, animals } from "../data/animals";
import { ecosystems, getFeaturedEcosystemSpecies } from "../data/ecosystems";
import { getRecentlyViewedAnimals } from "../services/cache";

const quickActions = [
  ["/species", "Species Directory", "Search and filter the full local species index."],
  ["/explorer", "Explorer", "Start from habitat, behavior, diet, and conservation traits."],
  ["/atlas", "Atlas", "Browse by continent and jump into mapped biomes."],
  ["/ecosystems", "Ecosystems", "Open the biome library with imagery and species context."],
  ["/collection", "Collection", "Review your favorites, bookmarks, and recently viewed records."],
] as const;

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const animalOfDay = useMemo(() => {
    const dayIndex = new Date().getDate() % animals.length;
    return animals[dayIndex];
  }, []);

  const recentlyViewed = useMemo(() => getRecentlyViewedAnimals().slice(0, 3), []);
  const featuredEcosystems = ecosystems.slice(0, 3);
  const featuredSpecies = animals
    .filter((animal) => animal.conservationStatus === "Endangered" || animal.conservationStatus === "Critically Endangered")
    .slice(0, 3);

  return (
    <div className="page-frame">
      <section className="page-card hero-backdrop overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="max-w-4xl">
          <p className="text-[1.05rem] text-app-accent">Biblos Zoes</p>
          <h1 className="mt-3 max-w-[12ch] font-display text-[clamp(3.2rem,7vw,6rem)] leading-[0.88] tracking-[-0.03em] text-white">
            A local-first atlas of animal life.
          </h1>
          <p className="mt-4 max-w-[48rem] text-lg leading-8 text-app-muted">
            Biblos now routes cleanly between directory search, trait exploration, geographic atlas browsing, ecosystem context, and collection tracking without dead ends.
          </p>
          <div className="mt-8 max-w-3xl">
            <SearchBar value={query} onChange={setQuery} placeholder="Search species, taxonomy, habitat, or facts..." />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="primary-button" onClick={() => navigate(`/species?q=${encodeURIComponent(query)}`)}>
              Search directory
            </button>
            <Link to="/atlas" className="ghost-button">
              Open Atlas
            </Link>
          </div>
        </div>
      </section>

      <section className="page-grid page-grid-3">
        <div className="page-card rounded-[1.75rem] p-5">
          <h2 className="page-section-title">Animal of the Day</h2>
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/8">
            <SpeciesImage animal={animalOfDay} className="h-52 w-full" fitClassName="h-52 w-full object-cover" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{animalOfDay.commonName}</h3>
          <p className="mt-1 italic text-app-muted">{animalOfDay.scientificName}</p>
          <p className="mt-3 text-sm leading-7 text-app-muted">{animalOfDay.shortDescription}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/species/${animalOfDay.id}`} className="primary-button text-sm">
              Open record
            </Link>
            <Link to={`/atlas?continent=${encodeURIComponent(animalOfDay.continents[0] ?? "Africa")}`} className="ghost-button text-sm">
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
              Each route has a distinct job: directory, explorer, atlas, ecosystems, and collection now complement each other instead of overlapping.
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
                  <img src={ecosystem.imagePath} alt={ecosystem.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
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
