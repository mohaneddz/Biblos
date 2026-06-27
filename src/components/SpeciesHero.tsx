import type { Animal } from "../types/animal";
import { SpeciesImage } from "./SpeciesImage";

export function SpeciesHero({ animal }: { animal: Animal }) {
  return (
    <section className="page-card overflow-hidden rounded-[2rem]">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(22rem,1.18fr)]">
        <div className="relative min-h-[7rem] overflow-hidden border-b border-white/8 md:min-h-[8rem] xl:min-h-[8.5rem] xl:border-b-0 xl:border-r">
          <SpeciesImage animal={animal} className="h-full w-full" fitClassName="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,5,0.08),rgba(3,6,5,0.72))]" />
          <div className="absolute bottom-2 left-4 pr-4">
            <p className="text-xs uppercase tracking-[0.24em] text-app-accent">Species Record</p>
            <h1 className="mt-1 font-display text-[clamp(1.5rem,2.2vw,2.2rem)] leading-[0.96] text-white">{animal.commonName}</h1>
            <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="warning-banner">
            Local-first record: this entry combines bundled data with optional cached enrichments.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="stat-tile">
              <span className="stat-label">Status</span>
              <strong>{animal.conservationStatus}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Activity</span>
              <strong>{animal.activityPattern}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Diet</span>
              <strong>{animal.diet}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Continents</span>
              <strong>{animal.continents.join(", ")}</strong>
            </div>
          </div>
          <p className="text-sm leading-6 text-app-muted xl:line-clamp-1">{animal.shortDescription}</p>
        </div>
      </div>
    </section>
  );
}
