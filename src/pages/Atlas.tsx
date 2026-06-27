import { Link, useSearchParams } from "react-router-dom";
import { continents } from "../data/discovery";
import { animals } from "../data/animals";
import { ecosystems, getEcosystemById, getEcosystemSpecies } from "../data/ecosystems";
import type { Continent } from "../types/animal";

export default function Atlas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEcosystemId = searchParams.get("ecosystem") ?? "";
  const selectedEcosystem = getEcosystemById(selectedEcosystemId);
  const selectedContinent = ((searchParams.get("continent") as Continent | null) ?? selectedEcosystem?.continents[0] ?? continents[0]) as Continent;

  const continentSpecies = animals.filter((animal) => animal.continents.includes(selectedContinent));
  const continentEcosystems = ecosystems.filter((ecosystem) => ecosystem.continents.includes(selectedContinent));

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Atlas</h1>
        <p className="page-lede">
          Atlas is the place-first discovery surface. Move by continent and biome, then drill down into the species directory or biome library with geographic context already chosen.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {continents.map((continent) => {
            const matches = animals.filter((animal) => animal.continents.includes(continent));
            return (
              <button
                key={continent}
                type="button"
                onClick={() => setSearchParams(new URLSearchParams({ continent }))}
                className={[
                  "interactive-card rounded-[1.4rem] border px-4 py-4 text-left",
                  continent === selectedContinent
                    ? "border-app-accent/35 bg-app-accent/10"
                    : "border-white/8 bg-white/[0.03]",
                ].join(" ")}
              >
                <span className="text-xs uppercase tracking-[0.18em] text-app-accent">Region</span>
                <h2 className="mt-2 text-xl font-semibold text-white">{continent}</h2>
                <p className="mt-2 text-sm leading-6 text-app-muted">{matches.length} species in the current local directory.</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="page-grid page-grid-2">
        <div className="page-card rounded-[1.5rem] p-5">
          <h2 className="page-section-title">{selectedContinent}</h2>
          <p className="mt-3 text-sm leading-7 text-app-muted">
            Atlas tracks where the current local species set lands geographically. Use the biome cards for ecological context, or open a filtered directory view directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {continentSpecies.slice(0, 8).map((animal) => (
              <Link key={animal.id} to={`/species/${animal.id}`} className="tag-chip">
                {animal.commonName}
              </Link>
            ))}
            {continentSpecies.length === 0 ? <span className="tag-chip">No species mapped yet</span> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/species?continent=${encodeURIComponent(selectedContinent)}`} className="primary-button text-sm">
              Open species in {selectedContinent}
            </Link>
            <Link to="/ecosystems" className="ghost-button text-sm">
              Open biome library
            </Link>
          </div>
        </div>

        <div className="page-card rounded-[1.5rem] p-5">
          <h2 className="page-section-title">Biome routes for {selectedContinent}</h2>
          <div className="mt-4 grid gap-3">
            {continentEcosystems.map((ecosystem) => (
              <button
                key={ecosystem.id}
                type="button"
                onClick={() => setSearchParams(new URLSearchParams({ continent: selectedContinent, ecosystem: ecosystem.id }))}
                className={[
                  "interactive-card flex items-center justify-between gap-3 rounded-[1.2rem] border px-4 py-4 text-left",
                  ecosystem.id === selectedEcosystemId
                    ? "border-app-accent/35 bg-app-accent/10"
                    : "border-white/8 bg-white/[0.03]",
                ].join(" ")}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{ecosystem.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-app-soft">{ecosystem.atlasLabel}</p>
                </div>
                <span className="text-xs text-app-muted">{getEcosystemSpecies(ecosystem).length} matches</span>
              </button>
            ))}
            {continentEcosystems.length === 0 ? (
              <p className="text-sm leading-7 text-app-muted">No biome groupings are mapped for this region yet.</p>
            ) : null}
          </div>
        </div>
      </section>

      {selectedEcosystem ? (
        <section className="page-card overflow-hidden rounded-[1.75rem]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <div className="relative min-h-[18rem] overflow-hidden border-b border-white/8 xl:border-b-0 xl:border-r">
              <img src={selectedEcosystem.imagePath} alt={selectedEcosystem.title} className="h-full w-full object-cover" />
              <div className="media-vignette" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-xs uppercase tracking-[0.24em] text-app-accent">{selectedEcosystem.region}</span>
                <h2 className="mt-2 text-4xl font-semibold text-white">{selectedEcosystem.title}</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-app-muted">{selectedEcosystem.description}</p>
              <div className="mt-4 grid gap-3">
                <div className="stat-tile">
                  <span className="stat-label">Climate</span>
                  <strong>{selectedEcosystem.climate}</strong>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Habitat keys</span>
                  <strong>{selectedEcosystem.habitatFilters.join(", ")}</strong>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/ecosystems?ecosystem=${encodeURIComponent(selectedEcosystem.id)}`} className="primary-button text-sm">
                  Open biome record
                </Link>
                <Link to={`/species?habitat=${encodeURIComponent(selectedEcosystem.habitatFilters[0] ?? "")}&continent=${encodeURIComponent(selectedContinent)}`} className="ghost-button text-sm">
                  Open matching species
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
