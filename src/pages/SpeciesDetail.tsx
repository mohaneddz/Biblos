import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClassificationTree } from "../components/ClassificationTree";
import { FactGrid } from "../components/FactGrid";
import { SpeciesHero } from "../components/SpeciesHero";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { animalMap } from "../data/animals";
import { getFavorites, getBookmarkedSpecies, getCachedSpecies, pushRecentlyViewed, setCachedSpecies, toggleBookmark, toggleFavorite } from "../services/cache";
import { hydrateSpeciesProfile } from "../services/speciesStore";
import type { Animal } from "../types/animal";

export default function SpeciesDetail() {
  const { id = "" } = useParams();
  const baseAnimal = animalMap.get(id);
  const [animal, setAnimal] = useState<Animal | null>(() => getCachedSpecies(id) ?? baseAnimal ?? null);
  const [loading, setLoading] = useState(() => !baseAnimal && id.startsWith("gbif-"));
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [bookmarks, setBookmarks] = useState(() => getBookmarkedSpecies());
  const { gallery } = useSpeciesMedia(animal, "full");

  useEffect(() => {
    if (!id) {
      return;
    }
    const cached = getCachedSpecies(id);
    setAnimal(cached ?? animalMap.get(id) ?? null);
    pushRecentlyViewed(id);

    if (cached || animalMap.has(id)) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void hydrateSpeciesProfile(id)
      .then((result) => {
        if (!active) {
          return;
        }
        setAnimal(result.animal);
        setCachedSpecies(result.animal);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const lastFetched = useMemo(() => (animal?.lastFetchedAt ? new Date(animal.lastFetchedAt).toLocaleString() : "Local record only"), [animal?.lastFetchedAt]);

  async function refreshHydratedProfile(forceRefresh = false) {
    setLoading(true);
    try {
      const next = await hydrateSpeciesProfile(id, forceRefresh);
      setAnimal(next.animal);
      setCachedSpecies(next.animal);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !animal) {
    return (
      <div className="page-frame">
        <section className="page-card rounded-[1.75rem] p-6">
          <h1 className="page-title">Hydrating species record</h1>
          <p className="page-lede">Biblos found the indexed species entry and is now assembling taxonomy, images, and readable facts from cached and live sources.</p>
        </section>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="page-frame">
        <section className="page-card rounded-[1.75rem] p-6">
          <h1 className="page-title">Species not found</h1>
          <p className="page-lede">The requested record is not in the current local index.</p>
          <Link to="/species" className="primary-button mt-5 inline-flex">
            Back to directory
          </Link>
        </section>
      </div>
    );
  }

  const currentAnimal = animal;

  return (
    <div className="page-frame">
      <SpeciesHero animal={animal} />

      <section className="page-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="primary-button" onClick={() => void refreshHydratedProfile(true)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh cached profile"}
          </button>
          <Link to={`/ai?species=${encodeURIComponent(animal.commonName)}`} className="ghost-button">
            Ask AI about this species
          </Link>
          <Link to={`/atlas?continent=${encodeURIComponent(animal.continents[0] ?? "Africa")}`} className="ghost-button">
            Open mapped region
          </Link>
          <button type="button" className="ghost-button" onClick={() => setFavorites(toggleFavorite(animal.id))}>
            {favorites.includes(animal.id) ? "Remove favorite" : "Add favorite"}
          </button>
          <button type="button" className="ghost-button" onClick={() => setBookmarks(toggleBookmark(animal.id))}>
            {bookmarks.includes(animal.id) ? "Remove bookmark" : "Add bookmark"}
          </button>
          {currentAnimal.partial ? <span className="tag-chip">Partial profile</span> : null}
        </div>
      </section>

      <FactGrid animal={animal} />

      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,0.88fr)_minmax(0,1.12fr)]">
        <ClassificationTree animal={animal} />
        <div className="grid gap-4">
          <div className="page-card rounded-[1.5rem] p-5">
            <h2 className="page-section-title">Overview</h2>
            <p className="mt-4 text-sm leading-7 text-app-muted">{animal.detailedDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {animal.habitat.map((item) => (
                <Link key={item} to={`/species?habitat=${encodeURIComponent(item)}`} className="tag-chip interactive-chip">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="page-card rounded-[1.5rem] p-5">
            <h2 className="page-section-title">Field Notes</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-app-muted">
              {animal.coolFacts.map((fact) => (
                <li key={fact} className="rounded-[1.2rem] border border-white/7 bg-white/[0.03] px-4 py-3">
                  {fact}
                </li>
              ))}
            </ul>
            <div className="warning-banner mt-5">
              3D modeling is tracked as record metadata only in this MVP. The app exposes whether a model exists, but does not open a non-functional generator flow.
            </div>
          </div>
        </div>
      </section>

      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title">Reference Gallery</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gallery.length > 0
            ? gallery.map((asset, index) => (
                <a
                  key={`${asset.source}-${index}`}
                  href={asset.sourceUrl ?? asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="interactive-card group overflow-hidden rounded-[1.25rem] border border-white/8 bg-black/15"
                >
                  <img src={asset.thumbnailUrl ?? asset.url} alt={asset.alt} className="h-40 w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="grid gap-1 p-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-app-accent">{asset.source}</span>
                    <span className="text-sm text-app-muted">{asset.attribution ?? "Open biodiversity media"}</span>
                  </div>
                </a>
              ))
            : [1, 2, 3, 4, 5, 6].map((entry) => (
                <div key={entry} className="placeholder-media flex min-h-32 items-end rounded-[1.25rem] p-4">
                  <span className="text-sm text-app-text">Media will resolve when open-license sources are available for this record.</span>
                </div>
              ))}
        </div>
      </section>

      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title">Source and Cache</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="stat-tile">
            <span className="stat-label">Last fetched</span>
            <strong>{lastFetched}</strong>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Cache key</span>
            <strong>{`biblos.species.${animal.id}`}</strong>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Collection state</span>
            <strong>
              {[favorites.includes(animal.id) ? "Favorite" : null, bookmarks.includes(animal.id) ? "Bookmarked" : null].filter(Boolean).join(" / ") || "Not saved"}
            </strong>
          </div>
        </div>
        <div className="mt-5 rounded-[1.25rem] border border-white/7 bg-black/15 p-4">
          <p className="text-sm leading-7 text-app-muted">
            Live refresh remains a local enrichment pass in this MVP. It updates cached notes and source labels without requiring a permanent online integration.
          </p>
          {animal.sourceUrls && animal.sourceUrls.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {animal.sourceUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="tag-chip interactive-chip">
                  {url}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
