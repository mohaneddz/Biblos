import { Link, useSearchParams } from "react-router-dom";
import { EcosystemCard } from "../components/EcosystemCard";
import { GlobeGridIcon, LeafClusterIcon } from "../components/icons";
import { ecosystems, getEcosystemById, getEcosystemSpecies } from "../data/ecosystems";
import { useWikipediaSummaries } from "../services/wikipedia";

export default function Ecosystems() {
  const [searchParams] = useSearchParams();
  const selected = getEcosystemById(searchParams.get("ecosystem") ?? "") ?? ecosystems[0];
  const summaries = useWikipediaSummaries([selected.articleTitle]);
  const selectedSummary = summaries[selected.articleTitle];

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.85rem] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Ecosystems</h1>
            <p className="page-lede">
              The biome library now uses real Wikipedia-backed imagery, denser three-column cards, and a much wider spread of terrestrial, freshwater, coastal, and pelagic environments.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/explorer" className="ghost-button text-sm">
              Open explorer atlas
            </Link>
            <Link to={`/species?habitat=${encodeURIComponent(selected.habitatFilters[0] ?? "")}`} className="primary-button text-sm">
              Explore selected biome
            </Link>
          </div>
        </div>
      </section>

      <section className="page-card overflow-hidden rounded-[1.8rem]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
          <div className="relative min-h-[22rem] overflow-hidden border-b border-white/8 xl:border-b-0 xl:border-r">
            {selectedSummary?.thumbnailUrl ? <img src={selectedSummary.thumbnailUrl} alt={selected.title} className="h-full w-full object-cover" /> : null}
            <div className="media-vignette" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-xs uppercase tracking-[0.24em] text-app-accent">{selected.region}</span>
              <h2 className="mt-2 text-4xl font-semibold text-white">{selected.title}</h2>
              <p className="mt-3 max-w-[38rem] text-sm leading-7 text-white/82">{selected.subtitle}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3 text-app-accent">
                  <LeafClusterIcon className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-[0.24em]">Climate + Structure</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-app-text">{selected.climate}</p>
                <p className="mt-2 text-sm leading-7 text-app-muted">{selected.description}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3 text-app-accent">
                  <GlobeGridIcon className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-[0.24em]">Field Notes</span>
                </div>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-app-muted">
                  {selected.fieldNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selected.highlights.map((highlight) => (
                <span key={highlight} className="tag-chip">
                  {highlight}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={`/species?habitat=${encodeURIComponent(selected.habitatFilters[0] ?? "")}`} className="primary-button text-sm">
                Open matching species
              </Link>
              <Link to={`/explorer?continent=${encodeURIComponent(selected.continents[0] ?? "Africa")}&ecosystem=${encodeURIComponent(selected.id)}`} className="ghost-button text-sm">
                Open regional route
              </Link>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-black/18 p-4 text-sm leading-7 text-app-muted">
              {getEcosystemSpecies(selected).length} local Biblos species currently intersect this biome profile.
            </div>
          </div>
        </div>
      </section>

      <section className="page-grid page-grid-3">
        {ecosystems.map((ecosystem) => (
          <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
        ))}
      </section>
    </div>
  );
}
