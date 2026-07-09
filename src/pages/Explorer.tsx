import { Link, useSearchParams } from "react-router-dom";
import { EcosystemCard } from "../components/EcosystemCard";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";
import { ecosystems, ecosystemsForContinent, getEcosystemById } from "../data/ecosystems";
import type { Continent } from "../types/animal";
import { BinocularsIcon, BirdIcon, GlobeGridIcon, LeafClusterIcon, MammalIcon, MountainIcon, RiverIcon } from "../components/icons";

function unique(items: string[]) {
  return [...new Set(items)].sort();
}

const diets = unique(animals.map((animal) => animal.diet));
const habitats = unique(animals.flatMap((animal) => animal.habitat));
const statuses = unique(animals.map((animal) => animal.conservationStatus));
const classes = unique(animals.map((animal) => animal.classification.className));

const routeCards = [
  { title: "Habitats", icon: MountainIcon, blurb: "Jump by ecological setting rather than species name.", keyName: "habitat", items: habitats.slice(0, 8), accent: "lg:col-span-2" },
  { title: "Activity", icon: BinocularsIcon, blurb: "Surface diurnal, nocturnal, and crepuscular records fast.", keyName: "activity", items: activityPatterns, accent: "" },
  { title: "Diet", icon: LeafClusterIcon, blurb: "Split the directory into herbivores, carnivores, and omnivores.", keyName: "diet", items: diets, accent: "" },
  { title: "Conservation", icon: GlobeGridIcon, blurb: "Focus immediately on threatened or stable species groups.", keyName: "status", items: statuses, accent: "lg:row-span-2" },
  { title: "Classes", icon: MammalIcon, blurb: "Move by major body plan before narrowing to family or species.", keyName: "class", items: classes, accent: "" },
  { title: "Water Systems", icon: RiverIcon, blurb: "Quick routes into wetlands, estuaries, rivers, coasts, and reefs.", keyName: "habitat", items: habitats.filter((item) => /(wetland|coast|ocean|estuary|kelp|mangrove|lake|seagrass)/i.test(item)).slice(0, 6), accent: "" },
];

export default function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedContinent = (searchParams.get("continent") as Continent | null) ?? "Africa";
  const selectedEcosystem = getEcosystemById(searchParams.get("ecosystem") ?? "") ?? ecosystemsForContinent(selectedContinent)[0] ?? ecosystems[0];
  const continentSpecies = animals.filter((animal) => animal.continents.includes(selectedContinent));
  const continentBiomes = ecosystemsForContinent(selectedContinent);

  return (
    <div className="page-frame">
      <section className="page-card overflow-hidden rounded-[1.9rem] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)]">
          <div>
            <h1 className="page-title">Explorer</h1>
            <p className="page-lede">
              Explorer is now the organic discovery surface for Biblos: traits, regions, and biomes live together here, and the old atlas flow has been folded into this page instead of split into a separate route.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/species" className="primary-button text-sm">
                Open full directory
              </Link>
              <Link to="/ecosystems" className="ghost-button text-sm">
                Open full biome library
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">Routes</span>
              <p className="mt-3 text-3xl font-semibold text-white">{routeCards.length}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">Trait-led entry points</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">Biomes</span>
              <p className="mt-3 text-3xl font-semibold text-white">{ecosystems.length}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">Real-image ecosystem records</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">Regions</span>
              <p className="mt-3 text-3xl font-semibold text-white">{continents.length}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">Atlas browsing now lives here</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">Directory</span>
              <p className="mt-3 text-3xl font-semibold text-white">{animals.length}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">Species available for filtering</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="page-section-title">Discovery Grid</h2>
          <p className="mt-2 text-sm leading-7 text-app-muted">Each tile launches the species directory with the right filter already applied.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {routeCards.map(({ title, icon: Icon, blurb, keyName, items, accent }) => (
            <article key={title} className={`page-card interactive-card rounded-[1.6rem] p-5 ${accent}`}>
              <div className="flex items-center gap-3 text-app-accent">
                <Icon className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.22em]">{title}</span>
              </div>
              <p className="mt-4 max-w-[40rem] text-sm leading-7 text-app-muted">{blurb}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {items.map((item) => (
                  <Link key={item} to={`/species?${keyName}=${encodeURIComponent(item)}`} className="tag-chip interactive-chip">
                    {item}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card rounded-[1.8rem] p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-section-title">Regional Atlas</h2>
            <p className="mt-2 text-sm leading-7 text-app-muted">The old atlas tools now live inside Explorer so place-based browsing stays connected to the trait grid and biome library.</p>
          </div>
          <Link to={`/species?continent=${encodeURIComponent(selectedContinent)}`} className="ghost-button text-sm">
            Open {selectedContinent} in directory
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {continents.map((continent) => (
            <button
              key={continent}
              type="button"
              onClick={() => setSearchParams(new URLSearchParams({ continent, ecosystem: ecosystemsForContinent(continent)[0]?.id ?? "" }))}
              className={[
                "interactive-card rounded-[1.3rem] border px-4 py-4 text-left cursor-pointer",
                continent === selectedContinent ? "border-app-accent/35 bg-app-accent/9" : "border-white/8 bg-white/[0.03]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <GlobeGridIcon className="h-5 w-5 text-app-accent" />
                <div>
                  <p className="text-lg font-semibold text-white">{continent}</p>
                  <p className="text-sm text-app-muted">{animals.filter((animal) => animal.continents.includes(continent)).length} species</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <BirdIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Current Region</span>
            </div>
            <h3 className="mt-3 text-3xl font-semibold text-white">{selectedContinent}</h3>
            <p className="mt-3 text-sm leading-7 text-app-muted">Species in this region from the current Biblos directory:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {continentSpecies.slice(0, 12).map((animal) => (
                <Link key={animal.id} to={`/species/${animal.id}`} className="tag-chip interactive-chip">
                  {animal.commonName}
                </Link>
              ))}
              {continentSpecies.length === 0 ? <span className="tag-chip">No local records yet</span> : null}
            </div>
          </div>

          {selectedEcosystem ? (
            <div className="rounded-[1.5rem] border border-white/8 bg-black/18 p-5">
              <div className="flex items-center gap-3 text-app-accent">
                <LeafClusterIcon className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.22em]">Biome Focus</span>
              </div>
              <h3 className="mt-3 text-3xl font-semibold text-white">{selectedEcosystem.title}</h3>
              <p className="mt-2 text-sm leading-7 text-app-muted">{selectedEcosystem.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEcosystem.highlights.map((highlight) => (
                  <span key={highlight} className="tag-chip">
                    {highlight}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/species?habitat=${encodeURIComponent(selectedEcosystem.habitatFilters[0] ?? "")}&continent=${encodeURIComponent(selectedContinent)}`} className="primary-button text-sm">
                  Explore this biome
                </Link>
                <Link to={`/ecosystems?ecosystem=${encodeURIComponent(selectedEcosystem.id)}`} className="ghost-button text-sm">
                  Open biome record
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {continentBiomes.slice(0, 6).map((ecosystem) => (
            <button
              key={ecosystem.id}
              type="button"
              onClick={() => setSearchParams(new URLSearchParams({ continent: selectedContinent, ecosystem: ecosystem.id }))}
              className={[
                "interactive-card rounded-[1.2rem] border px-4 py-4 text-left cursor-pointer",
                ecosystem.id === selectedEcosystem?.id ? "border-app-accent/35 bg-app-accent/9" : "border-white/8 bg-white/[0.03]",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-white">{ecosystem.title}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">{ecosystem.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="page-section-title">Biome Field Guide</h2>
            <p className="mt-2 text-sm leading-7 text-app-muted">A smaller three-column scanline into the full ecosystem library.</p>
          </div>
          <Link to="/ecosystems" className="ghost-button text-sm">
            Open all biomes
          </Link>
        </div>
        <div className="page-grid page-grid-3">
          {ecosystems.slice(0, 9).map((ecosystem) => (
            <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
          ))}
        </div>
      </section>
    </div>
  );
}
