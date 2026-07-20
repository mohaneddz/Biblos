import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EcosystemCard } from "../components/EcosystemCard";
import { AtlasIcon, CompassIcon, GlobeGridIcon, LeafClusterIcon, RefreshIcon } from "../components/icons";
import { ecosystems } from "../data/ecosystems";
import { PageHeader } from "../components/PageHeader";

const BIOME_TYPES = [
  { label: "All", value: "" },
  { label: "Terrestrial", value: "terrestrial" },
  { label: "Aquatic", value: "aquatic" },
  { label: "Coastal", value: "coastal" },
  { label: "Polar", value: "polar" },
  { label: "Arid", value: "arid" },
];

const TERRESTRIAL_IDS = new Set(["african-savanna", "tropical-rainforest", "temperate-forest", "taiga", "alpine", "desert", "mediterranean-scrub"]);
const AQUATIC_IDS = new Set(["freshwater-wetland", "river-floodplain", "open-ocean", "deep-ocean", "kelp-forest", "seagrass-meadow"]);
const COASTAL_IDS = new Set(["mangrove", "estuary", "coral-reef", "rocky-intertidal"]);
const POLAR_IDS = new Set(["arctic-tundra", "polar-sea-ice"]);
const ARID_IDS = new Set(["desert", "mediterranean-scrub"]);

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

export default function Ecosystems() {
  const [query, setQuery] = useState("");
  const [biomeType, setBiomeType] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    return ecosystems.filter((eco) => {
      if (biomeType === "terrestrial" && !TERRESTRIAL_IDS.has(eco.id)) return false;
      if (biomeType === "aquatic" && !AQUATIC_IDS.has(eco.id)) return false;
      if (biomeType === "coastal" && !COASTAL_IDS.has(eco.id)) return false;
      if (biomeType === "polar" && !POLAR_IDS.has(eco.id)) return false;
      if (biomeType === "arid" && !ARID_IDS.has(eco.id)) return false;
      if (!q) return true;
      const hay = normalize([eco.title, eco.subtitle, eco.region, eco.climate, eco.highlights.join(" "), eco.fieldNotes.join(" ")].join(" "));
      return hay.includes(q);
    });
  }, [query, biomeType]);

  return (
    <div className="page-frame">
      <PageHeader
        title="Ecosystems"
        description="Explore every major biome on Earth — from deep-sea hydrothermal vents to Arctic tundra. Click any card for detailed stats, species lists, and an interactive world heatmap."
        storageKey="ecosystems"
        actions={
          <Link to="/explorer" className="ghost-button text-sm cursor-pointer select-none">
            Open explorer atlas
          </Link>
        }
      />

      {/* Search + filter card */}
      <section className="page-card rounded-[1.85rem] p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CompassIcon className="h-5 w-5 text-app-accent" />
            <h2 className="text-lg font-semibold text-white">Find & Filter Biomes</h2>
          </div>
          <button
            type="button"
            onClick={() => { setQuery(""); setBiomeType(""); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-app-muted hover:border-app-accent/40 hover:text-app-accent transition cursor-pointer"
            title="Reset filters & refresh view"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search biomes — reef, tundra, forest, savanna…"
              className="w-full rounded-[1rem] border border-white/8 bg-black/20 py-3 pl-11 pr-4 text-sm text-app-text placeholder:text-app-muted focus:border-app-accent/40 focus:outline-none transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition cursor-pointer"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Biome type chips */}
          <div className="flex flex-wrap gap-2">
            {BIOME_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => setBiomeType(bt.value)}
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition cursor-pointer",
                  biomeType === bt.value
                    ? "bg-app-accent text-white"
                    : "border border-white/8 bg-white/[0.03] text-app-muted hover:border-app-accent/30 hover:text-app-text",
                ].join(" ")}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div className="mt-3 flex items-center gap-3">
          <span className="tag-chip">{filtered.length} biome{filtered.length !== 1 ? "s" : ""}</span>
          {(query || biomeType) && (
            <button
              type="button"
              onClick={() => { setQuery(""); setBiomeType(""); }}
              className="text-xs text-app-muted hover:text-app-accent transition cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="page-card rounded-[1.4rem] p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-app-accent/12 text-app-accent">
            <GlobeGridIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">{ecosystems.length}</p>
            <p className="text-xs text-app-muted mt-0.5 uppercase tracking-[0.14em]">Total biomes</p>
          </div>
        </div>
        <div className="page-card rounded-[1.4rem] p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-app-accent/12 text-app-accent">
            <LeafClusterIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">{[...new Set(ecosystems.flatMap((e) => e.continents))].length}</p>
            <p className="text-xs text-app-muted mt-0.5 uppercase tracking-[0.14em]">Continents covered</p>
          </div>
        </div>
        <div className="page-card rounded-[1.4rem] p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-app-accent/12 text-app-accent">
            <CompassIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">{[...new Set(ecosystems.flatMap((e) => e.habitatFilters))].length}</p>
            <p className="text-xs text-app-muted mt-0.5 uppercase tracking-[0.14em]">Distinct habitat tags</p>
          </div>
        </div>
      </section>

      {/* Grid section with icon header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AtlasIcon className="h-5 w-5 text-app-accent" />
            <h2 className="text-xl font-semibold text-white">Global Biomes Directory</h2>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="page-grid page-grid-3">
            {filtered.map((ecosystem) => (
              <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
            ))}
          </div>
        ) : (
          <div className="page-card rounded-[1.75rem] p-12 text-center">
            <p className="text-2xl font-semibold text-white mb-2">No biomes found</p>
            <p className="text-sm text-app-muted">Try a different keyword or clear your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
