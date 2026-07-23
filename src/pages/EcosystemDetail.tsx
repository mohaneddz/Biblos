import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { AnimalCard } from "../components/AnimalCard";
import { EcosystemCard } from "../components/EcosystemCard";
import { BranchIcon, CompassIcon, EyeIcon, GlobeGridIcon, LeafClusterIcon, PawIcon } from "../components/icons";
import { ecosystems, getEcosystemById } from "../data/ecosystems";
import type { Ecosystem } from "../data/ecosystems";
import { animals } from "../data/animals";
import { getAllCachedSpecies } from "../services/cache";
import { useWikipediaSummaries } from "../services/wikipedia";
import type { Animal } from "../types/animal";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Continent → ISO numeric country codes (subset for major countries per continent)
const CONTINENT_COUNTRIES: Record<string, Set<number>> = {
  Africa: new Set([12, 24, 72, 86, 108, 120, 132, 140, 144, 148, 174, 175, 178, 180, 204, 226, 231, 232, 260, 262, 266, 270, 288, 324, 384, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 624, 638, 646, 678, 686, 694, 706, 710, 716, 729, 732, 788, 800, 818, 834, 894]),
  Asia: new Set([4, 31, 48, 50, 64, 96, 104, 116, 142, 156, 158, 268, 356, 360, 364, 368, 376, 392, 398, 400, 408, 410, 414, 417, 418, 422, 458, 462, 496, 524, 512, 586, 608, 634, 643, 682, 703, 704, 784, 760, 762, 764, 792, 860]),
  Europe: new Set([8, 20, 40, 56, 70, 100, 112, 191, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 438, 440, 442, 470, 492, 498, 499, 528, 578, 616, 620, 630, 642, 643, 688, 703, 705, 724, 752, 756, 804, 826]),
  "North America": new Set([28, 44, 52, 84, 124, 188, 192, 214, 222, 320, 332, 340, 388, 484, 558, 591, 659, 662, 670, 780]),
  "South America": new Set([32, 68, 76, 152, 170, 218, 328, 600, 604, 740, 858, 862]),
  Australia: new Set([36, 540, 548, 598]),
  Antarctica: new Set([10]),
  Oceans: new Set([]),
};

function getContinentRelevance(numericId: number, continents: string[]): number {
  let maxScore = 0;
  for (const continent of continents) {
    const set = CONTINENT_COUNTRIES[continent];
    if (set && set.has(numericId)) {
      maxScore = 1;
    }
  }
  return maxScore;
}

// Tooltip
function MapTooltip({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-black/90 px-3 py-1.5 text-xs text-white shadow-xl"
      style={{ left: x + 12, top: y - 4 }}
    >
      {name}
    </div>
  );
}

function EcosystemHeatmap({ ecosystem }: { ecosystem: Ecosystem }) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  return (
    <div className="relative w-full rounded-[1.5rem] border border-white/8 bg-[#080e0c] overflow-hidden" style={{ height: "420px" }}>
      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white hover:bg-white/10 transition text-base font-bold"
          title="Zoom in"
        >+</button>
        <button
          type="button"
          onClick={() => { setZoom(1); setCenter([0, 20]); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white hover:bg-white/10 transition text-[10px] font-bold tracking-tight"
          title="Reset view"
        >↺</button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white hover:bg-white/10 transition text-base font-bold"
          title="Zoom out"
        >−</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-[10px] text-white/50">
        <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: "rgba(74,222,128,0.85)" }} /> Present
        <span className="inline-block h-2.5 w-5 rounded-sm ml-2" style={{ background: "#141b17" }} /> Absent
      </div>

      <ComposableMap
        projection="geoNaturalEarth1"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
            setZoom(z);
            setCenter(coordinates);
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const numericId = Number(geo.id);
                const relevance = getContinentRelevance(numericId, ecosystem.continents);
                const fill = relevance > 0
                  ? "rgba(74, 222, 128, 0.85)"
                  : "#141b17";
                const stroke = relevance > 0 ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)";
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none", transition: "fill 0.2s" },
                      hover: { outline: "none", fill: relevance > 0 ? "rgba(134,239,172,0.95)" : "#253d30", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseMove={(e: React.MouseEvent) => {
                      setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltip && <MapTooltip name={tooltip.name} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}

export default function EcosystemDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const ecosystem = getEcosystemById(id);

  // Scroll to top on route parameter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  const summaries = useWikipediaSummaries(ecosystem ? [ecosystem.articleTitle] : []);
  const summary = ecosystem ? summaries[ecosystem.articleTitle] : undefined;

  const allAnimals = useMemo(() => {
    const cached = getAllCachedSpecies();
    const map = new Map<string, Animal>();
    for (const a of animals) map.set(a.id, a);
    for (const a of cached) map.set(a.id, a);
    return [...map.values()];
  }, []);

  const biomeSpecies = useMemo(() => {
    if (!ecosystem) return [];
    return allAnimals.filter((a) =>
      ecosystem.habitatFilters.some((hf) =>
        a.habitat.some((h) => h.toLowerCase().includes(hf.toLowerCase()) || hf.toLowerCase().includes(h.toLowerCase()))
      )
    );
  }, [ecosystem, allAnimals]);

  const relatedEcosystems = useMemo(() => {
    if (!ecosystem) return [];
    return ecosystems
      .filter((e) => e.id !== ecosystem.id)
      .filter((e) =>
        e.continents.some((c) => ecosystem.continents.includes(c)) ||
        e.habitatFilters.some((hf) => ecosystem.habitatFilters.includes(hf))
      )
      .slice(0, 6);
  }, [ecosystem]);

  if (!ecosystem) {
    return (
      <div className="page-frame">
        <section className="page-card rounded-[1.75rem] p-8 text-center">
          <h1 className="page-title">Ecosystem not found</h1>
          <p className="page-lede mt-2">The biome ID "{id}" doesn't exist in the Biblos library.</p>
          <Link to="/ecosystems" className="primary-button mt-6 inline-flex">← Back to Ecosystems</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-frame">
      {/* Hero */}
      <section className="page-card overflow-hidden rounded-[1.85rem]">
        <div className="relative min-h-[22rem] overflow-hidden">
          {summary?.thumbnailUrl && (
            <img
              src={summary.thumbnailUrl}
              alt={ecosystem.title}
              className="absolute inset-0 h-full w-full object-cover scale-105"
              style={{ filter: "brightness(0.55)" }}
            />
          )}
          <div className="media-vignette" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Back nav */}
          <div className="absolute left-5 top-5 z-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 hover:bg-black/70 transition backdrop-blur-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Ecosystems
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full border border-app-accent/40 bg-app-accent/15 px-3 py-1 text-xs uppercase tracking-[0.22em] text-app-accent">
                {ecosystem.region}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                {ecosystem.climate}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                {ecosystem.atlasLabel}
              </span>
            </div>
            <h1 className="text-5xl font-semibold text-white leading-tight">{ecosystem.title}</h1>
            <p className="mt-3 max-w-[42rem] text-base leading-7 text-white/78">{ecosystem.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Species in biome", value: biomeSpecies.length, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { label: "Continents", value: ecosystem.continents.length, icon: <GlobeGridIcon className="h-5 w-5" /> },
          { label: "Habitat filters", value: ecosystem.habitatFilters.length, icon: <LeafClusterIcon className="h-5 w-5" /> },
          { label: "Related biomes", value: relatedEcosystems.length, icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="page-card rounded-[1.4rem] p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-app-accent/12 text-app-accent">
              {icon}
            </div>
            <div>
              <p className="text-3xl font-semibold text-white">{value}</p>
              <p className="text-xs text-app-muted mt-0.5 uppercase tracking-[0.14em]">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Overview 2-col */}
      <section className="grid gap-5 xl:grid-cols-2">
        {/* Left: description + highlights */}
        <div className="page-card rounded-[1.6rem] p-6 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <EyeIcon className="h-4 w-4 text-app-accent" />
              <span className="text-xs uppercase tracking-[0.22em] text-app-accent font-semibold">Overview</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-app-text">{ecosystem.description}</p>
          </div>
          {summary?.extract && (
            <div>
              <span className="text-xs uppercase tracking-[0.22em] text-app-soft">Wikipedia</span>
              <p className="mt-2 text-sm leading-7 text-app-muted line-clamp-5">{summary.extract}</p>
              {summary.pageUrl && (
                <a
                  href={summary.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-app-accent hover:underline"
                >
                  Read on Wikipedia
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          )}
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-app-soft">Highlights</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {ecosystem.highlights.map((h) => (
                <span key={h} className="tag-chip">{h}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-app-soft">Habitat tags</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {ecosystem.habitatFilters.map((hf) => (
                <Link
                  key={hf}
                  to={`/species?habitat=${encodeURIComponent(hf)}`}
                  className="tag-chip interactive-chip text-xs"
                >
                  {hf}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: field notes + continents + links */}
        <div className="flex flex-col gap-5">
          <div className="page-card rounded-[1.6rem] p-6">
            <div className="flex items-center gap-3 text-app-accent mb-4">
              <GlobeGridIcon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.22em]">Field Notes</span>
            </div>
            <ul className="grid gap-3">
              {ecosystem.fieldNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-7 text-app-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent/50" />
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="page-card rounded-[1.6rem] p-6">
            <div className="flex items-center gap-3 text-app-accent mb-4">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs uppercase tracking-[0.22em]">Geographic Range</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ecosystem.continents.map((c) => (
                <Link
                  key={c}
                  to={`/species?continent=${encodeURIComponent(c)}`}
                  className="tag-chip interactive-chip"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          <div className="page-card rounded-[1.6rem] p-6 flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.22em] text-app-soft">Quick Actions</span>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/species?habitat=${encodeURIComponent(ecosystem.habitatFilters[0] ?? "")}`}
                className="primary-button text-sm"
              >
                Browse matching species
              </Link>
              <Link
                to={`/explorer?continent=${encodeURIComponent(ecosystem.continents[0] ?? "Africa")}`}
                className="ghost-button text-sm"
              >
                Open regional atlas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Species in this biome */}
      {biomeSpecies.length > 0 && (
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="page-section-title flex items-center gap-2">
                <PawIcon className="h-5 w-5 text-app-accent" />
                Species in this Biome
              </h2>
              <p className="mt-1 text-sm text-app-muted">
                {biomeSpecies.length} species from the Biblos directory match this biome's habitat tags.
              </p>
            </div>
            <Link
              to={`/species?habitat=${encodeURIComponent(ecosystem.habitatFilters[0] ?? "")}`}
              className="ghost-button text-sm"
            >
              View all in directory
            </Link>
          </div>
          <div className="page-grid page-grid-3">
            {biomeSpecies.slice(0, 12).map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
          {biomeSpecies.length > 12 && (
            <div className="mt-4 text-center">
              <Link
                to={`/species?habitat=${encodeURIComponent(ecosystem.habitatFilters[0] ?? "")}`}
                className="ghost-button text-sm"
              >
                +{biomeSpecies.length - 12} more species →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* World Heatmap — full width */}
      <section>
        <div className="mb-5">
          <h2 className="page-section-title flex items-center gap-2">
            <GlobeGridIcon className="h-5 w-5 text-app-accent" />
            Global Distribution Heatmap
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            Interactive world map showing the continents where {ecosystem.title} occurs. Hover over countries to explore. Use scroll or controls to zoom.
          </p>
        </div>
        <EcosystemHeatmap ecosystem={ecosystem} />
        <p className="mt-3 text-xs text-app-muted text-center">
          Coloring is based on continent-level presence data. Use the habitat filter links above for species-level distribution.
        </p>
      </section>

      {/* Related biomes */}
      {relatedEcosystems.length > 0 && (
        <section>
          <div className="mb-5">
            <h2 className="page-section-title flex items-center gap-2">
              <BranchIcon className="h-5 w-5 text-app-accent" />
              Related Biomes
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              Ecosystems that share continents or habitat structure with {ecosystem.title}.
            </p>
          </div>
          <div className="page-grid page-grid-3">
            {relatedEcosystems.map((eco) => (
              <EcosystemCard key={eco.id} ecosystem={eco} />
            ))}
          </div>
        </section>
      )}

      {/* Biome classification card */}
      <section className="page-card rounded-[1.75rem] p-6">
        <h2 className="page-section-title flex items-center gap-2 mb-4">
          <CompassIcon className="h-5 w-5 text-app-accent" />
          Biome Profile
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Climate", value: ecosystem.climate },
            { label: "Region", value: ecosystem.region },
            { label: "Atlas label", value: ecosystem.atlasLabel },
            { label: "Wikipedia source", value: ecosystem.articleTitle },
            { label: "Continents", value: ecosystem.continents.join(", ") },
            { label: "Featured species IDs", value: ecosystem.featuredSpeciesIds.slice(0, 3).join(", ") + (ecosystem.featuredSpeciesIds.length > 3 ? ` +${ecosystem.featuredSpeciesIds.length - 3}` : "") },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[1.1rem] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-app-soft mb-1">{label}</p>
              <p className="text-sm text-app-text leading-6">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
