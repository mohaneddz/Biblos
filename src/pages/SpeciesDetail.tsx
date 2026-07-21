import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ClassificationTree } from "../components/ClassificationTree";
import { FactGrid } from "../components/FactGrid";
import { SpeciesHero } from "../components/SpeciesHero";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { clearAnimalMediaCache } from "../services/speciesMedia";
import { animalMap } from "../data/animals";
import { findMatchingEcosystem } from "../data/ecosystems";
import { getFavorites, getBookmarkedSpecies, getCachedSpecies, pushRecentlyViewed, setCachedSpecies, toggleBookmark, toggleFavorite, deleteSpeciesRecordOnly, getSectionStates, saveSectionStates } from "../services/cache";
import { hydrateSpeciesProfile, hydrateSpeciesWithAI } from "../services/speciesStore";
import { searchSpeciesVideos } from "../services/youtubeService";
import type { Animal, SpeciesVideo } from "../types/animal";
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
  FolderIcon,
} from "../components/icons";
import { AddToFolderModal } from "../components/AddToFolderModal";
import { SpeciesViewer3D } from "../components/SpeciesViewer3D";
import { RefreshCw, Box, Loader2 } from "lucide-react";

function hasUnknownClassification(animal: Animal | null): boolean {
  if (!animal || !animal.classification) return true;
  const c = animal.classification;
  const fields = [c.kingdom, c.phylum, c.className, c.order, c.family, c.genus, c.species];
  return fields.some(
    (f) => !f || f.toLowerCase().trim() === "unknown" || f.toLowerCase().trim() === "n/a"
  );
}

function SpeciesDetailSkeleton() {
  return (
    <div className="page-frame space-y-4 animate-fade-in">
      {/* Go Back button skeleton */}
      <div className="fixed top-[5.5rem] left-8 lg:left-[20.5rem] z-50">
        <div className="h-8 w-24 rounded-full bg-white/10 animate-pulse border border-white/10 backdrop-blur-md shadow-lg" />
      </div>

      {/* Hero Skeleton */}
      <section className="page-card overflow-hidden rounded-[2rem]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(22rem,1.18fr)]">
          <div className="relative min-h-[18rem] md:min-h-[22rem] xl:min-h-[26rem] bg-white/5 animate-pulse overflow-hidden border-b border-white/8 xl:border-b-0 xl:border-r">
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-white/15 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-5 xl:h-full justify-between min-h-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="stat-tile min-h-[6.5rem] p-5 flex flex-col justify-between">
                  <div className="h-3 w-16 bg-white/10 animate-pulse rounded" />
                  <div className="h-6 w-24 bg-white/15 animate-pulse rounded mt-3" />
                </div>
              ))}
            </div>
            <div className="space-y-2.5 mt-3 p-1">
              <div className="h-4 bg-white/10 animate-pulse rounded w-full" />
              <div className="h-4 bg-white/10 animate-pulse rounded w-11/12" />
              <div className="h-4 bg-white/10 animate-pulse rounded w-4/5" />
              <div className="h-4 bg-white/10 animate-pulse rounded w-3/4" />
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar Skeleton */}
      <section className="page-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-44 rounded-xl bg-white/5 animate-pulse border border-white/5" />
          <div className="h-10 w-40 rounded-xl bg-white/5 animate-pulse border border-white/5" />
          <div className="h-10 w-36 rounded-xl bg-white/5 animate-pulse border border-white/5" />
          <div className="h-10 w-36 rounded-xl bg-white/5 animate-pulse border border-white/5" />
        </div>
      </section>

      {/* Stat Fact Grid Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="page-card rounded-[1.5rem] p-5 space-y-3">
            <div className="h-3 w-20 bg-white/10 animate-pulse rounded" />
            <div className="h-6 w-28 bg-white/15 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Classification & Notes Skeleton */}
      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,0.88fr)_minmax(0,1.12fr)]">
        <div className="page-card rounded-[1.5rem] p-5 space-y-4">
          <div className="h-5 w-36 bg-white/15 animate-pulse rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />
                <div className="h-4 w-28 bg-white/15 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="page-card rounded-[1.5rem] p-5 space-y-3">
            <div className="h-5 w-28 bg-white/15 animate-pulse rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-white/10 animate-pulse rounded w-full" />
              <div className="h-4 bg-white/10 animate-pulse rounded w-11/12" />
              <div className="h-4 bg-white/10 animate-pulse rounded w-3/4" />
            </div>
          </div>
          <div className="page-card rounded-[1.5rem] p-5 space-y-3">
            <div className="h-5 w-32 bg-white/15 animate-pulse rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-full" />
              <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-11/12" />
            </div>
          </div>
        </div>
      </section>

      {/* Reference Gallery Skeleton */}
      <section className="page-card rounded-[1.5rem] p-5 space-y-4">
        <div className="h-5 w-40 bg-white/15 animate-pulse rounded" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[1.25rem] border border-white/8 bg-white/5 animate-pulse h-[15rem]" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SpeciesDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const baseAnimal = animalMap.get(id);
  const [animal, setAnimal] = useState<Animal | null>(() => getCachedSpecies(id) ?? baseAnimal ?? null);
  const [loading, setLoading] = useState(() => !baseAnimal && (id.startsWith("gbif-") || id.startsWith("wiki-")));
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [bookmarks, setBookmarks] = useState(() => getBookmarkedSpecies());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const initialSections = getSectionStates();
  const [showGallerySection, setShowGallerySection] = useState(() => initialSections.gallery);
  const [show3DSection, setShow3DSection] = useState(() => initialSections.model3d);
  const [showVideosSection, setShowVideosSection] = useState(() => initialSections.videos);

  const toggleGallerySection = () => {
    setShowGallerySection((prev) => {
      const next = !prev;
      saveSectionStates({ gallery: next });
      return next;
    });
  };

  const toggleVideosSection = () => {
    setShowVideosSection((prev) => {
      const next = !prev;
      saveSectionStates({ videos: next });
      return next;
    });
  };

  const toggle3DSection = () => {
    setShow3DSection((prev) => {
      const next = !prev;
      saveSectionStates({ model3d: next });
      return next;
    });
  };

  const [refreshingSection, setRefreshingSection] = useState<string | null>(null);
  const [, setMediaVersion] = useState(0);
  const { gallery, primaryImage } = useSpeciesMedia(animal, "full");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [localVideos, setLocalVideos] = useState<SpeciesVideo[]>(() => animal?.videos ?? []);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    setLocalVideos(animal?.videos ?? []);
    setCurrentVideoIndex(0);
  }, [animal]);

  useEffect(() => {
    if (showVideosSection && animal) {
      if (localVideos.length === 0 && (!animal.videos || animal.videos.length === 0)) {
        setLoadingVideos(true);
        searchSpeciesVideos(animal.commonName, animal.scientificName)
          .then((vids) => {
            setLocalVideos(vids);
            if (vids.length > 0) {
              const updated = { ...animal, videos: vids };
              setAnimal(updated);
              setCachedSpecies(updated);
            }
          })
          .catch((err) => {
            console.error("Failed to load videos on expand:", err);
          })
          .finally(() => {
            setLoadingVideos(false);
          });
      }
    }
  }, [showVideosSection, animal, localVideos.length]);

  const primaryEcosystem = useMemo(() => {
    return animal ? findMatchingEcosystem(animal) : null;
  }, [animal]);

  // Resolve the best available image URL for the 3D viewer
  const primaryImageUrl = useMemo(() => {
    if (!animal) return null;
    return animal.heroImage ?? animal.images?.[0] ?? primaryImage?.url ?? null;
  }, [animal, primaryImage]);

  async function handleRefreshSection(sectionName: string) {
    if (!animal) return;
    setRefreshingSection(sectionName);

    if (sectionName === "gallery") {
      toastService.info(`Re-searching reference media gallery for "${animal.commonName}"...`);
      clearAnimalMediaCache(animal.id);
      setMediaVersion((v) => v + 1);
      toastService.success(`Refreshed media gallery for "${animal.commonName}"`);
      setRefreshingSection(null);
      return;
    }

    if (sectionName === "videos") {
      toastService.info(`Re-searching natural history videos for "${animal.commonName}"...`);
      try {
        const vids = await searchSpeciesVideos(animal.commonName, animal.scientificName);
        setLocalVideos(vids);
        const updated = { ...animal, videos: vids };
        setAnimal(updated);
        setCachedSpecies(updated);
        toastService.success(`Refreshed videos for "${animal.commonName}"`);
      } catch (err) {
        reportError(`Failed to refresh videos for "${animal.commonName}"`, err);
      } finally {
        setRefreshingSection(null);
      }
      return;
    }

    toastService.info(`Re-enriching ${sectionName} data for "${animal.commonName}"...`);
    try {
      const hydrated = await hydrateSpeciesWithAI(animal);
      setAnimal(hydrated);
      setCachedSpecies(hydrated);
      toastService.success(`Refreshed ${sectionName} for "${animal.commonName}"`);
    } catch (err) {
      reportError(`Failed to refresh ${sectionName} for "${animal.commonName}"`, err);
    } finally {
      setRefreshingSection(null);
    }
  }

  const videos = useMemo(() => {
    if (localVideos && localVideos.length > 0) {
      return localVideos.map((v) => ({
        title: v.title,
        duration: v.duration,
        type: v.type,
        description: v.description,
        url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        youtubeId: v.youtubeId,
        views: v.views,
        channelName: v.channelName,
      }));
    }
    return [];
  }, [localVideos]);

  useEffect(() => {
    if (!id) {
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    const cached = getCachedSpecies(id);
    const seededAnimal = cached ?? animalMap.get(id) ?? null;
    setAnimal(seededAnimal);
    pushRecentlyViewed(id);

    const needsClassification = hasUnknownClassification(seededAnimal);
    const shouldHydrate = !seededAnimal || seededAnimal.partial || needsClassification || id.startsWith("gbif-") || id.startsWith("wiki-");
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

        if (current.partial || hasUnknownClassification(current)) {
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
    return <SpeciesDetailSkeleton />;
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

      <section className="page-card rounded-[1.75rem] p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full items-center">
          <Link
            to={`/ai?species=${encodeURIComponent(animal.commonName)}`}
            className="ghost-button flex items-center justify-center gap-2 text-center py-2.5 px-3 min-h-0 text-xs sm:text-sm font-medium border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-app-accent/40 transition rounded-xl text-app-text cursor-pointer w-full"
          >
            <BrainSparkIcon className="h-4 w-4 text-app-accent shrink-0" />
            <span>Ask AI about species</span>
          </Link>
          <Link
            to={primaryEcosystem ? `/ecosystems/${primaryEcosystem.id}` : `/explorer?continent=${encodeURIComponent(animal.continents[0] ?? "Africa")}`}
            title={primaryEcosystem ? `Explore ${primaryEcosystem.title} ecosystem` : "Open mapped region"}
            className="ghost-button flex items-center justify-center gap-2 text-center py-2.5 px-3 min-h-0 text-xs sm:text-sm font-medium border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-app-accent/40 transition rounded-xl text-app-text cursor-pointer w-full"
          >
            <CompassIcon className="h-4 w-4 text-app-accent shrink-0" />
            <span>Open mapped region</span>
          </Link>
          <button
            type="button"
            className="ghost-button flex items-center justify-center gap-2 text-center py-2.5 px-3 min-h-0 text-xs sm:text-sm font-medium border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-app-accent/40 transition rounded-xl text-app-text cursor-pointer w-full"
            onClick={() => setFavorites(toggleFavorite(animal.id))}
          >
            {favorites.includes(animal.id) ? (
              <>
                <HeartSolidIcon className="h-4 w-4 text-app-accent shrink-0" />
                <span>Remove favorite</span>
              </>
            ) : (
              <>
                <HeartIcon className="h-4 w-4 text-app-accent shrink-0" />
                <span>Add favorite</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="ghost-button flex items-center justify-center gap-2 text-center py-2.5 px-3 min-h-0 text-xs sm:text-sm font-medium border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-app-accent/40 transition rounded-xl text-app-text cursor-pointer w-full"
            onClick={() => setBookmarks(toggleBookmark(animal.id))}
          >
            {bookmarks.includes(animal.id) ? (
              <>
                <BookmarkSolidIcon className="h-4 w-4 text-app-accent shrink-0" />
                <span>Remove bookmark</span>
              </>
            ) : (
              <>
                <BookmarkIcon className="h-4 w-4 text-app-accent shrink-0" />
                <span>Add bookmark</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="ghost-button flex items-center justify-center gap-2 text-center py-2.5 px-3 min-h-0 text-xs sm:text-sm font-medium border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-app-accent/40 transition rounded-xl text-app-text cursor-pointer w-full"
            onClick={() => setIsFolderModalOpen(true)}
          >
            <FolderIcon className="h-4 w-4 text-app-accent shrink-0" />
            <span>Add to collection</span>
          </button>
        </div>
      </section>

      <AddToFolderModal
        animal={animal}
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
      />

      <FactGrid animal={animal} />

      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,0.88fr)_minmax(0,1.12fr)]">
        <ClassificationTree
          animal={animal}
          onRefresh={() => handleRefreshSection("taxonomy")}
          isRefreshing={refreshingSection === "taxonomy"}
        />
        <div className="grid gap-4">
          <div className="page-card rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
              <h2 className="page-section-title flex items-center gap-2 mb-0">
                <EyeIcon className="h-5 w-5 text-app-accent" />
                <span>Overview</span>
              </h2>
              <button
                type="button"
                onClick={() => handleRefreshSection("overview")}
                disabled={refreshingSection === "overview"}
                title="Search / re-enrich overview details"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-app-soft hover:text-app-accent hover:bg-white/5 transition cursor-pointer border border-white/5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingSection === "overview" ? "animate-spin text-app-accent" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
            {animal.partial ? (
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-white/5 animate-pulse rounded w-full" />
                <div className="h-4 bg-white/5 animate-pulse rounded w-11/12" />
                <div className="h-4 bg-white/5 animate-pulse rounded w-3/4" />
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-7 text-app-muted">{animal.detailedDescription}</p>
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
            <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
              <h2 className="page-section-title flex items-center gap-2 mb-0">
                <BinocularsIcon className="h-5 w-5 text-app-accent" />
                <span>Field Notes</span>
              </h2>
              <button
                type="button"
                onClick={() => handleRefreshSection("facts")}
                disabled={refreshingSection === "facts"}
                title="Re-search & refresh cool facts"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-app-soft hover:text-app-accent hover:bg-white/5 transition cursor-pointer border border-white/5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingSection === "facts" ? "animate-spin text-app-accent" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
            {animal.partial ? (
              <div className="space-y-3 mt-4">
                <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-full" />
                <div className="h-10 bg-white/5 animate-pulse rounded-[1.2rem] w-11/12" />
              </div>
            ) : (
              <ul className="mt-2 grid gap-3 text-sm leading-7 text-app-muted">
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

      {/* Reference Gallery Section — collapsible */}
      <section className="page-card rounded-[1.5rem] p-5">
        <button
          type="button"
          onClick={toggleGallerySection}
          className="flex w-full items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-app-accent/30 bg-app-accent/10">
              <ImageIcon className="h-4.5 w-4.5 text-app-accent" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white group-hover:text-app-accent transition">
                Reference Gallery
              </span>
              <p className="text-xs text-app-muted mt-0.5">
                {showGallerySection
                  ? "High quality reference photos and open biodiversity media"
                  : "Click to expand and view reference photos for this species"}
              </p>
            </div>
          </div>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-app-soft transition-transform duration-300 ${
            showGallerySection ? "rotate-180" : ""
          }`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showGallerySection && (
          <div className="mt-5 border-t border-white/8 pt-5">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => handleRefreshSection("gallery")}
                disabled={refreshingSection === "gallery"}
                title="Re-search open-license reference media"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-app-soft hover:text-app-accent hover:bg-white/5 transition cursor-pointer border border-white/5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingSection === "gallery" ? "animate-spin text-app-accent" : ""}`} />
                <span>Refresh Gallery</span>
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
          </div>
        )}
      </section>

      {/* Natural History Videos Section */}
      <section className="page-card rounded-[1.5rem] p-5">
        <button
          type="button"
          onClick={toggleVideosSection}
          className="flex w-full items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-app-accent/30 bg-app-accent/10">
              <PlayIcon className="h-4.5 w-4.5 text-app-accent" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white group-hover:text-app-accent transition">
                Natural History Videos
              </span>
              <p className="text-xs text-app-muted mt-0.5">
                {showVideosSection
                  ? "Wildlife documentary video feeds and natural history presentations"
                  : "Click to expand and view documentary videos about this species"}
              </p>
            </div>
          </div>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-app-soft transition-transform duration-300 ${
            showVideosSection ? "rotate-180" : ""
          }`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showVideosSection && (
          <div className="mt-5 border-t border-white/8 pt-5">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => handleRefreshSection("videos")}
                disabled={refreshingSection === "videos"}
                title="Re-search natural history video media"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-app-soft hover:text-app-accent hover:bg-white/5 transition cursor-pointer border border-white/5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingSection === "videos" ? "animate-spin text-app-accent" : ""}`} />
                <span>Refresh Videos</span>
              </button>
            </div>

            {loadingVideos ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Loader2 className="h-8 w-8 text-app-accent animate-spin" />
                <span className="text-sm font-medium text-app-soft">Searching natural history documentaries...</span>
              </div>
            ) : videos.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.10fr)]">
                {/* Left Column: Text info about the currently selected video */}
                <div className="flex flex-col justify-between rounded-[1.25rem] border border-white/7 bg-black/15 p-5 min-h-[16rem]">
                  <div>
                    <span className="rounded-full border border-app-accent/20 bg-app-accent/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-app-accent">
                      {videos[currentVideoIndex].type}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold text-white">{videos[currentVideoIndex].title}</h3>
                    {(videos[currentVideoIndex].channelName || videos[currentVideoIndex].views !== undefined) && (
                      <p className="mt-1 text-xs text-app-soft">
                        {videos[currentVideoIndex].channelName && `Channel: ${videos[currentVideoIndex].channelName}`}
                        {videos[currentVideoIndex].channelName && videos[currentVideoIndex].views !== undefined && " • "}
                        {videos[currentVideoIndex].views !== undefined && `${videos[currentVideoIndex].views.toLocaleString()} views`}
                      </p>
                    )}
                    <div className="mt-3 h-[12rem] overflow-y-auto pr-2 text-sm leading-7 text-app-muted custom-scrollbar">
                      {videos[currentVideoIndex].description || "No description available."}
                    </div>
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
              <div className="rounded-[1.25rem] border border-white/7 bg-black/15 p-6 text-center">
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
          </div>
        )}
      </section>

      {/* 3D Model Viewer — collapsible */}
      {primaryImageUrl && (
        <section className="page-card rounded-[1.5rem] p-5">
          <button
            type="button"
            onClick={toggle3DSection}
            className="flex w-full items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-app-accent/30 bg-app-accent/10">
                <Box className="h-4.5 w-4.5 text-app-accent" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-white group-hover:text-app-accent transition">
                  Interactive 3D Model
                </span>
                <p className="text-xs text-app-muted mt-0.5">
                  {show3DSection
                    ? "Background-removed, depth-displaced 3D scene — drag to rotate, scroll to zoom"
                    : "Click to expand and generate a real-time 3D depth scene from the species image"}
                </p>
              </div>
            </div>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-app-soft transition-transform duration-300 ${
              show3DSection ? "rotate-180" : ""
            }`}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </div>
          </button>

          {show3DSection && (
            <div className="mt-5 border-t border-white/8 pt-5">
              <SpeciesViewer3D
                imageUrl={primaryImageUrl}
                name={animal.commonName}
              />
            </div>
          )}
        </section>
      )}

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
