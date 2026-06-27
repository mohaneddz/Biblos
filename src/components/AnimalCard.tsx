import { Link } from "react-router-dom";
import { SpeciesImage } from "./SpeciesImage";
import type { Animal } from "../types/animal";

type AnimalCardProps = {
  animal: Animal;
  trailing?: React.ReactNode;
};

export function AnimalCard({ animal, trailing }: AnimalCardProps) {
  return (
    <article className="page-card interactive-card group flex h-full flex-col overflow-hidden rounded-[1.65rem]">
      <div className="relative h-52 overflow-hidden border-b border-white/8">
        <SpeciesImage
          animal={animal}
          className="h-full w-full"
          fitClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,5,0.02),rgba(3,6,5,0.82))]" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[0.68rem] uppercase tracking-[0.34em] text-app-accent/90">Species Entry</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">{animal.commonName}</h3>
              <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
            </div>
            <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition group-hover:border-app-accent/35 group-hover:text-app-accent">
              Open
            </span>
          </div>
        </div>
        <span className="absolute left-4 top-4 rounded-full border border-app-accent/30 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-app-accent">
          {animal.conservationStatus}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-7 text-app-muted">{animal.shortDescription}</p>
        <div className="flex flex-wrap gap-2">
          {animal.habitat.slice(0, 3).map((item) => (
            <span key={item} className="tag-chip">
              {item}
            </span>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm text-app-muted">
          <div>
            <dt className="text-app-soft">Diet</dt>
            <dd className="mt-1 text-app-text">{animal.diet}</dd>
          </div>
          <div>
            <dt className="text-app-soft">Class</dt>
            <dd className="mt-1 text-app-text">{animal.classification.className}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/7 pt-4">
          <Link to={`/species/${animal.id}`} className="primary-button min-w-[11rem] text-sm">
            Open entry
          </Link>
          {trailing}
        </div>
      </div>
    </article>
  );
}
