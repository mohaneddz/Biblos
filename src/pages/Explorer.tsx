import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";
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
  const continentSpecies = animals.filter((animal) => animal.continents.includes(selectedContinent));

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biblos.header-collapsed.explorer") === "true";
    }
    return false;
  });

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("biblos.header-collapsed.explorer", String(next));
      return next;
    });
  };

  return (
    <div className="page-frame">
      <section className="page-card overflow-hidden rounded-[1.9rem] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)]">
          <div className="flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="page-title select-none">Explorer</h1>
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-app-soft hover:bg-white/[0.08] hover:text-white transition duration-200 cursor-pointer select-none"
                  title={isCollapsed ? "Show description" : "Hide description"}
                >
                  {isCollapsed ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed ? "max-h-0 opacity-0 mt-0" : "max-h-[12rem] opacity-100 mt-3"
                }`}
              >
                <p className="page-lede text-app-muted pr-2">
                  Explorer is the organic discovery surface for Biblos: traits and regions live together here, and the atlas browsing flow is integrated directly into this page.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/species" className="primary-button text-sm cursor-pointer select-none">
                    Open full directory
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">Routes</span>
              <p className="mt-3 text-3xl font-semibold text-white">{routeCards.length}</p>
              <p className="mt-2 text-sm leading-6 text-app-muted">Trait-led entry points</p>
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
              onClick={() => setSearchParams(new URLSearchParams({ continent }))}
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

        <div className="mt-6">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 w-full">
            <div className="flex items-center gap-3 text-app-accent">
              <BirdIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Current Region</span>
            </div>
            <h3 className="mt-3 text-3xl font-semibold text-white">{selectedContinent}</h3>
            <p className="mt-3 text-sm leading-7 text-app-muted">Species in this region from the current Biblos directory:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {continentSpecies.slice(0, 24).map((animal) => (
                <Link key={animal.id} to={`/species/${animal.id}`} className="tag-chip interactive-chip">
                  {animal.commonName}
                </Link>
              ))}
              {continentSpecies.length === 0 ? <span className="tag-chip">No local records yet</span> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
