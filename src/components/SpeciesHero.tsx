import type { Animal } from "../types/animal";
import { SpeciesImage } from "./SpeciesImage";
import { BookmarkSolidIcon, HeartSolidIcon, ShieldIcon, ClockIcon, GlobeGridIcon, LeafIcon, PawIcon, UtensilsIcon } from "./icons";

export function SpeciesHero({
  animal,
  isBookmarked,
  isFavorite,
}: {
  animal: Animal;
  isBookmarked?: boolean;
  isFavorite?: boolean;
}) {
  return (
    <section className="page-card overflow-hidden rounded-[2rem]">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(22rem,1.18fr)] items-stretch">
        <div className="relative min-h-[18rem] md:min-h-[22rem] xl:min-h-[26rem] max-h-[30rem] overflow-hidden border-b border-white/8 xl:border-b-0 xl:border-r">
          <SpeciesImage animal={animal} className="absolute inset-0 h-full w-full" fitClassName="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,5,0.08),rgba(3,6,5,0.72))]" />

          {/* Overlay icons */}
          <div className="absolute right-4 top-4 flex gap-2 z-10">
            {isFavorite && (
              <div className="rounded-full bg-black/60 p-2 text-app-accent border border-white/10 shadow-lg" title="Favorite">
                <HeartSolidIcon className="h-4 w-4" />
              </div>
            )}
            {isBookmarked && (
              <div className="rounded-full bg-black/60 p-2 text-app-accent border border-white/10 shadow-lg" title="Bookmarked">
                <BookmarkSolidIcon className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-4 pr-4">
            <p className="text-xs uppercase tracking-[0.24em] text-app-accent">Species Record</p>
            <h1 className="mt-1 font-display text-[clamp(1.5rem,2.2vw,2.2rem)] leading-[0.96] text-white">{animal.commonName}</h1>
            <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-5 xl:h-full justify-between min-h-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat-tile min-h-[6.5rem] relative p-5">
              <div className="absolute right-4 top-4 text-app-soft/60">
                <ShieldIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="stat-label">Status</span>
                {animal.partial ? (
                  <div className="h-6 w-24 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <strong className="block mt-2 text-lg text-white font-semibold truncate">{animal.conservationStatus}</strong>
                )}
              </div>
            </div>
            <div className="stat-tile min-h-[6.5rem] relative p-5">
              <div className="absolute right-4 top-4 text-app-soft/60">
                <ClockIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="stat-label">Activity</span>
                {animal.partial ? (
                  <div className="h-6 w-24 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <strong className="block mt-2 text-lg text-white font-semibold truncate">{animal.activityPattern}</strong>
                )}
              </div>
            </div>
            <div className="stat-tile min-h-[6.5rem] relative p-5">
              <div className="absolute right-4 top-4 text-app-soft/60">
                {animal.diet === "Herbivore" ? (
                  <LeafIcon className="h-4 w-4" />
                ) : animal.diet === "Carnivore" ? (
                  <PawIcon className="h-4 w-4" />
                ) : (
                  <UtensilsIcon className="h-4 w-4" />
                )}
              </div>
              <div>
                <span className="stat-label">Diet</span>
                {animal.partial ? (
                  <div className="h-6 w-24 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <strong className="block mt-2 text-lg text-white font-semibold truncate">{animal.diet}</strong>
                )}
              </div>
            </div>
            <div className="stat-tile min-h-[6.5rem] relative p-5">
              <div className="absolute right-4 top-4 text-app-soft/60">
                <GlobeGridIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="stat-label">Continents</span>
                {animal.partial ? (
                  <div className="h-6 w-28 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <strong className="block mt-2 text-lg text-white font-semibold truncate" title={animal.continents.join(", ")}>{animal.continents.join(", ")}</strong>
                )}
              </div>
            </div>
          </div>
          {animal.partial ? (
            <div className="space-y-2 mt-2 flex-1 min-h-[6rem] pr-2">
              <div className="h-4 bg-white/5 animate-pulse rounded w-full" />
              <div className="h-4 bg-white/5 animate-pulse rounded w-11/12" />
              <div className="h-4 bg-white/5 animate-pulse rounded w-4/5" />
            </div>
          ) : (
            <div className="text-sm leading-6 text-app-muted overflow-y-auto flex-1 min-h-[6rem] pr-2 mt-1 scroll-container">
              {animal.detailedDescription}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
