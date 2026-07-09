import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ClassificationTree } from "../components/ClassificationTree";
import { FactGrid } from "../components/FactGrid";
import { SpeciesHero } from "../components/SpeciesHero";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { clearAnimalMediaCache } from "../services/speciesMedia";
import { animalMap } from "../data/animals";
import { getFavorites, getBookmarkedSpecies, getCachedSpecies, pushRecentlyViewed, setCachedSpecies, toggleBookmark, toggleFavorite, deleteSpeciesRecordOnly } from "../services/cache";
import { hydrateSpeciesProfile, hydrateSpeciesWithAI } from "../services/speciesStore";
import type { Animal } from "../types/animal";
import { toastService } from "../services/toastService";
import { reportError } from "../services/errorReporter";
import {
  BrainSparkIcon,
  CompassIcon,
  HeartIcon,
  HeartSolidIcon,
  BookmarkIcon,
  BookmarkSolidIcon,
  EyeIcon,
  BinocularsIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
} from "../components/icons";

export default function SpeciesDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const baseAnimal = animalMap.get(id);
  const [animal, setAnimal] = useState<Animal | null>(() => getCachedSpecies(id) ?? baseAnimal ?? null);
  const [loading, setLoading] = useState(() => !baseAnimal && id.startsWith("gbif-"));
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [bookmarks, setBookmarks] = useState(() => getBookmarkedSpecies());
  const { gallery } = useSpeciesMedia(animal, "full");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videos = useMemo(() => {
    if (animal?.videos && animal.videos.length > 0) {
      return animal.videos.map((v) => ({
        title: v.title,
        duration: v.duration,
        type: v.type,
        description: v.description,
        url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        youtubeId: v.youtubeId,
      }));
    }
    return [];
  }, [animal]);

  useEffect(() => {
    if (!id) {
      return;
    }
    const cached = getCachedSpecies(id);
    const seededAnimal = cached ?? animalMap.get(id) ?? null;
    setAnimal(seededAnimal);
    pushRecentlyViewed(id);

    const shouldHydrate = !seededAnimal || seededAnimal.partial || id.startsWith("gbif-");
    if (!shouldHydrate) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(!seededAnimal);
    void hydrateSpeciesProfile(id)
      .then(async (result) => {
        if (!active) {
          return;
        }
        let current = result.animal;
        setAnimal(current);
        setCachedSpecies(current);

        if (current.partial) {
          try {
            const hydrated = await hydrateSpeciesWithAI(current);
            if (active) {
              setAnimal(hydrated);
              setCachedSpecies(hydrated);
            }
          } catch (err) {
            console.error("AI hydration failed on mount", err);
            reportError(`AI enrichment failed for "${current.commonName}"`, err);
          }
        }
      })
      .catch((err) => {
        console.error("Hydration profile failed on mount", err);
        reportError(`Failed to load profile details for species ID "${id}"`, err);
        if (!active) {
          return;
        }
        setAnimal(seededAnimal);
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



  async function handleResetAndReenrich() {
    setLoading(true);
    try {
      // Clear target profile from cache to start clean
      deleteSpeciesRecordOnly(id);
      // Clear target media cache
      clearAnimalMediaCache(id);

      // Hydrate species profile fresh from GBIF (forceRefresh = true)
      const next = await hydrateSpeciesProfile(id, true);
      let current = next.animal;
      setAnimal(current);
      setCachedSpecies(current);

      // Hydrate with AI fresh
      const hydrated = await hydrateSpeciesWithAI(current);
      setAnimal(hydrated);
      setCachedSpecies(hydrated);

      toastService.success(`Successfully re-enriched profile for "${hydrated.commonName}"`);
    } catch (err) {
      console.error("AI refresh failed", err);
      reportError(`Failed to re-enrich profile for species ID "${id}"`, err);
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
      <div className="fixed top-[5.5rem] left-8 lg:left-[20.5rem] z-50">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm py-1.5 px-3.5 min-h-0 cursor-pointer rounded-full border border-white/12 bg-black/60 backdrop-blur-md text-app-accent hover:text-white hover:border-white/20 transition shadow-lg"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Go back</span>
        </button>
      </div>
      <SpeciesHero
        animal={animal}
        isBookmarked={bookmarks.includes(animal.id)}
        isFavorite={favorites.includes(animal.id)}
      />

      <section className="page-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap gap-3">
          <Link to={`/ai?species=${encodeURIComponent(animal.commonName)}`} className="ghost-button flex items-center gap-2">
            <BrainSparkIcon className="h-4 w-4 text-app-accent" />
            Ask AI about this species
          </Link>
          <Link to={`/explorer?continent=${encodeURIComponent(animal.continents[0] ?? "Africa")}`} className="ghost-button flex items-center gap-2">
            <CompassIcon className="h-4 w-4" />
            Open mapped region
          </Link>
          <button type="button" className="ghost-button flex items-center gap-2" onClick={() => setFavorites(toggleFavorite(animal.id))}>
            {favorites.includes(animal.id) ? (
              <>
                <HeartSolidIcon className="h-4 w-4 text-app-accent" />
                Remove favorite
              </>
            ) : (
              <>
                <HeartIcon className="h-4 w-4" />
                Add favorite
              </>
            )}
          </button>
          <button type="button" className="ghost-button flex items-center gap-2" onClick={() => setBookmarks(toggleBookmark(animal.id))}>
            {bookmarks.includes(animal.id) ? (
              <>
                <BookmarkSolidIcon className="h-4 w-4 text-app-accent" />
                Remove bookmark
              </>
            ) : (
              <>
                <BookmarkIcon className="h-4 w-4" />
                Add bookmark
              </>
            )}
          </button>
          {currentAnimal.partial ? <span className="tag-chip">Partial profile</span> : null}
        </div>
      </section>

      <FactGrid animal={animal} />

      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,0.88fr)_minmax(0,1.12fr)]">
        <ClassificationTree animal={animal} />
        <div className="grid gap-4">
          <div className="page-card rounded-[1.5rem] p-5">
            <h2 className="page-section-title flex items-center gap-2">
              <EyeIcon className="h-5 w-5 text-app-accent" />
              Overview
            </h2>
            {animal.partial ? (
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-white/5 animate-pulse rounded w-full" />
                <div className="h-4 bg-white/5 animate-pulse rounded w-11/12" />
                <div className="h-4 bg-white/5 animate-pulse rounded w-3/4" />
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm leading-7 text-app-muted">{animal.detailedDescription}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {animal.habitat.map((item) => (
                    <Link key={item} to={`/species?habitat=${encodeURIComponent(item)}`} className="tag-chip interactive-chip">
                      {item}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="page-card rounded-[1.5rem] p-5">
            <h2 className="page-section-title flex items-center gap-2">
              <BinocularsIcon className="h-5 w-5 text-app-accent" />
              Field Notes
            </h2>
            {animal.partial ? (
              <div className="space-y-3 mt-4">
                <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-full" />
                <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-11/12" />
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-app-muted">
                {animal.coolFacts.map((fact) => (
                  <li key={fact} className="rounded-[1.2rem] border border-white/7 bg-white/[0.03] px-4 py-3">
                    {fact}
                  </li>
                ))}
              </ul>
            )}
            <div className="warning-banner mt-5">
              3D modeling is tracked as record metadata only in this MVP. The app exposes whether a model exists, but does not open a non-functional generator flow.
            </div>
          </div>
        </div>
      </section>

      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-app-accent" />
          Reference Gallery
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gallery.length > 0
            ? gallery.map((asset, index) => (
              <a
                key={`${asset.source}-${index}`}
                href={asset.sourceUrl ?? asset.url}
                target="_blank"
                rel="noreferrer"
                className="interactive-card group overflow-hidden rounded-[1.25rem] border border-white/8 bg-black/15 flex flex-col h-[15rem]"
              >
                <img src={asset.thumbnailUrl ?? asset.url} alt={asset.alt} className="h-[10.5rem] w-full object-cover transition duration-300" />
                <div className="grid gap-1 p-3 flex-1 flex flex-col justify-between min-h-0">
                  <span className="text-xs uppercase tracking-[0.18em] text-app-accent">{asset.source}</span>
                  <span className="text-sm text-app-muted truncate" title={asset.attribution ?? "Open biodiversity media"}>
                    {asset.attribution ?? "Open biodiversity media"}
                  </span>
                </div>
              </a>
            ))
            : [1, 2, 3, 4, 5, 6].map((entry) => (
              <div key={entry} className="placeholder-media flex items-end rounded-[1.25rem] p-4 h-[15rem]">
                <span className="text-sm text-app-text">Media will resolve when open-license sources are available for this record.</span>
              </div>
            ))}
        </div>
      </section>

      {/* Natural History Videos Section */}
      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title flex items-center gap-2">
          <PlayIcon className="h-5 w-5 text-app-accent" />
          Natural History Videos
        </h2>
        {videos.length > 0 ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.10fr)]">
            {/* Left Column: Text info about the currently selected video */}
            <div className="flex flex-col justify-between rounded-[1.25rem] border border-white/7 bg-black/15 p-5 min-h-[16rem]">
              <div>
                <span className="rounded-full border border-app-accent/20 bg-app-accent/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-app-accent">
                  {videos[currentVideoIndex].type}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-white">{videos[currentVideoIndex].title}</h3>
                <p className="mt-3 text-sm leading-7 text-app-muted">{videos[currentVideoIndex].description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-app-soft/80 border-t border-white/5 pt-3">
                <span>Video {currentVideoIndex + 1} of {videos.length}</span>
              </div>
            </div>

            {/* Right Column: YouTube Embed Player */}
            <div className="flex flex-col gap-4">
              <div className="relative group overflow-hidden rounded-[1.25rem] border border-white/8 bg-black/35 aspect-video flex flex-col justify-center">
                <iframe
                  key={videos[currentVideoIndex].youtubeId}
                  src={`https://www.youtube.com/embed/${videos[currentVideoIndex].youtubeId}?autoplay=0&mute=0`}
                  title={videos[currentVideoIndex].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
                {/* Nav Arrows */}
                {videos.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                    <button
                      type="button"
                      onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1))}
                      className="pointer-events-auto rounded-full bg-black/60 p-2 text-white border border-white/10 hover:bg-black/80 hover:text-app-accent transition cursor-pointer"
                      title="Previous video"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1))}
                      className="pointer-events-auto rounded-full bg-black/60 p-2 text-white border border-white/10 hover:bg-black/80 hover:text-app-accent transition cursor-pointer"
                      title="Next video"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {/* Dots */}
              {videos.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-2">
                  {videos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentVideoIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${idx === currentVideoIndex ? "w-4 bg-app-accent" : "w-2 bg-white/35"}`}
                    />
                  ))}
                </div>
              )}
              {/* Action buttons */}
              <div className="flex justify-center gap-3 mt-1 text-xs">
                <button
                  type="button"
                  className="tag-chip interactive-chip cursor-pointer"
                  onClick={() => {
                    const url = videos[currentVideoIndex].url;
                    navigator.clipboard.writeText(url)
                      .then(() => toastService.success("Video URL copied to clipboard!"))
                      .catch((err) => console.error("Clipboard copy failed:", err));
                  }}
                >
                  Copy video link
                </button>
                <button
                  type="button"
                  className="tag-chip interactive-chip cursor-pointer"
                  onClick={async () => {
                    const url = videos[currentVideoIndex].url;
                    try {
                      await openUrl(url);
                    } catch (err) {
                      console.error("Failed to open URL in browser:", err);
                      window.open(url, "_blank");
                    }
                  }}
                >
                  Open in browser
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[1.25rem] border border-white/7 bg-black/15 p-6 text-center">
            <PlayIcon className="h-10 w-10 mx-auto text-app-soft/40 mb-3" />
            <p className="text-sm font-medium text-app-text">No videos available yet</p>
            <p className="text-sm text-app-muted mt-2 max-w-md mx-auto leading-relaxed">
              Add a YouTube Data API key in <Link to="/settings" className="text-app-accent hover:underline">Settings</Link> to search for real wildlife videos about this species. Videos are fetched automatically when the profile is enriched.
            </p>
            {animal.partial && (
              <p className="text-xs text-app-soft mt-3">Videos will load after AI enrichment completes.</p>
            )}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col items-center gap-1.5 pb-8 text-center text-xs text-app-soft/80">
        <p>
          Clears local description cache, gallery images, and video feeds, then fetches fresh GBIF/AI taxonomy and details.
        </p>
        <button
          type="button"
          className="text-app-accent hover:text-white underline font-semibold transition cursor-pointer"
          onClick={() => void handleResetAndReenrich()}
          disabled={loading}
        >
          {loading ? "Re-enriching Profile..." : "Reset & Re-enrich Profile"}
        </button>
      </div>
    </div>
  );
}
