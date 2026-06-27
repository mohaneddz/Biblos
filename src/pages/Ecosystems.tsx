import { Link, useSearchParams } from "react-router-dom";
import { EcosystemCard } from "../components/EcosystemCard";
import { ecosystems, getEcosystemById, getEcosystemSpecies } from "../data/ecosystems";

export default function Ecosystems() {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("ecosystem") ?? "";
  const featured = getEcosystemById(selectedId);

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Ecosystems</h1>
            <p className="page-lede">
              The biome library ties together imagery, climate context, and species shortcuts. Use it when you want ecological framing instead of a plain filter grid.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/atlas" className="ghost-button text-sm">
              Open atlas
            </Link>
            <Link to="/species" className="ghost-button text-sm">
              Open directory
            </Link>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="page-card rounded-[1.75rem] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="page-section-title">Focused biome: {featured.title}</h2>
              <p className="mt-2 text-sm leading-7 text-app-muted">
                {getEcosystemSpecies(featured).length} local species currently match this biome profile.
              </p>
            </div>
            <Link to={`/species?habitat=${encodeURIComponent(featured.habitatFilters[0] ?? "")}`} className="primary-button text-sm">
              Open matching species
            </Link>
          </div>
        </section>
      ) : null}

      <section className="page-grid page-grid-2">
        {ecosystems.map((ecosystem) => (
          <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
        ))}
      </section>
    </div>
  );
}
