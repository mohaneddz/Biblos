import { Link } from "react-router-dom";
import { getFeaturedEcosystemSpecies, getEcosystemSpecies, type Ecosystem } from "../data/ecosystems";

export function EcosystemCard({ ecosystem }: { ecosystem: Ecosystem }) {
  const species = getEcosystemSpecies(ecosystem);
  const featured = getFeaturedEcosystemSpecies(ecosystem);

  return (
    <article className="page-card interactive-card group flex h-full flex-col overflow-hidden rounded-[1.5rem]">
      <div className="relative h-56 overflow-hidden border-b border-white/8">
        <img src={ecosystem.imagePath} alt={ecosystem.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
        <div className="media-vignette" />
        <div className="media-grid" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-xs uppercase tracking-[0.24em] text-app-accent">{ecosystem.region}</span>
          <h3 className="mt-2 text-2xl font-semibold text-white">{ecosystem.title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-7 text-app-muted">{ecosystem.description}</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-app-soft">Climate</dt>
            <dd className="mt-1 text-app-text">{ecosystem.climate}</dd>
          </div>
          <div>
            <dt className="text-app-soft">Representative species</dt>
            <dd className="mt-1 text-app-text">
              {featured.map((animal) => animal.commonName).join(", ") || "Species set still expanding"}
            </dd>
          </div>
          <div>
            <dt className="text-app-soft">Local matches</dt>
            <dd className="mt-1 text-app-text">{species.length} species in the current directory</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {ecosystem.habitatFilters.slice(0, 3).map((habitat) => (
            <span key={habitat} className="tag-chip">
              {habitat}
            </span>
          ))}
        </div>

        <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
          <Link to={`/species?habitat=${encodeURIComponent(ecosystem.habitatFilters[0] ?? "")}`} className="primary-button text-sm">
            Explore species
          </Link>
          <Link to={`/atlas?ecosystem=${encodeURIComponent(ecosystem.id)}`} className="ghost-button text-sm">
            Open in atlas
          </Link>
        </div>
      </div>
    </article>
  );
}
