import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { animalMap } from "../data/animals";
import { getBookmarkedSpecies, getCachedSpecies, getFavorites, getRecentlyViewedAnimals, getHiddenSpecies } from "../services/cache";
import { useEffect } from "react";
import type { Animal } from "../types/animal";

export default function Collection() {
  const [, setVersion] = useState(0);
  
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const hidden = getHiddenSpecies();
  const favoriteAnimals = getFavorites()
    .filter((id) => !hidden.includes(id))
    .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
    .filter((a): a is Animal => Boolean(a));

  const bookmarkedAnimals = getBookmarkedSpecies()
    .filter((id) => !hidden.includes(id))
    .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
    .filter((a): a is Animal => Boolean(a));

  const recentlyViewed = getRecentlyViewedAnimals()
    .filter((animal) => !hidden.includes(animal.id));


  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Collection</h1>
        <p className="page-lede">
          Collection is the saved-state layer for the local MVP. Favorites mark recurring records, bookmarks hold research targets, and recents preserve your current trail through explorer, species, and ecosystem views.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="page-section-title">Favorites</h2>
          <Link to="/species" className="ghost-button text-sm">
            Add more species
          </Link>
        </div>
        {favoriteAnimals.length > 0 ? (
          <div className="page-grid page-grid-3">
            {favoriteAnimals.map((animal) => (
              animal ? (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                />
              ) : null
            ))}
          </div>
        ) : (
          <div className="page-card rounded-[1.5rem] p-5 text-sm leading-7 text-app-muted">No favorites saved yet.</div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="page-section-title">Bookmarks</h2>
          <Link to="/explorer" className="ghost-button text-sm">
            Find species to save
          </Link>
        </div>
        {bookmarkedAnimals.length > 0 ? (
          <div className="page-grid page-grid-3">
            {bookmarkedAnimals.map((animal) => (
              animal ? (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                />
              ) : null
            ))}
          </div>
        ) : (
          <div className="page-card rounded-[1.5rem] p-5 text-sm leading-7 text-app-muted">
            No bookmarks yet. Save species from the directory or record pages to build a focused reading list.
          </div>
        )}
      </section>

      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title">Recently Viewed</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentlyViewed.length > 0 ? (
            recentlyViewed.map((animal) => (
              <Link key={animal.id} to={`/species/${animal.id}`} className="interactive-card rounded-[1.2rem] border border-white/7 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{animal.commonName}</p>
                <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
                <p className="mt-2 text-sm leading-6 text-app-muted">{animal.shortDescription}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm leading-7 text-app-muted">No recent entries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
