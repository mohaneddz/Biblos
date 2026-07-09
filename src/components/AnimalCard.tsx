import { useState } from "react";
import { Link } from "react-router-dom";
import { SpeciesImage } from "./SpeciesImage";
import type { Animal } from "../types/animal";
import {
  getBookmarkedSpecies,
  getFavorites,
  toggleBookmark,
  toggleFavorite,
  deleteCachedSpecies,
  hideSpecies,
  getCachedSpecies,
} from "../services/cache";
import { BookmarkSolidIcon, HeartSolidIcon, HeartIcon, BookmarkIcon } from "./icons";
import { toastService } from "../services/toastService";
import { confirmService } from "../services/confirmService";
import { hydrateSpeciesWithAI } from "../services/speciesStore";
import { reportError } from "../services/errorReporter";

type AnimalCardProps = {
  animal: Animal;
};

export function AnimalCard({ animal }: AnimalCardProps) {
  const isFavorite = getFavorites().includes(animal.id);
  const isBookmarked = getBookmarkedSpecies().includes(animal.id);
  const isCached = animal.id.startsWith("gbif-") || getCachedSpecies(animal.id) !== null;
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleToggleFavorite = () => {
    toggleFavorite(animal.id);
    toastService.success(`${isFavorite ? "Removed from" : "Added to"} favorites`);
  };

  const handleToggleBookmark = () => {
    toggleBookmark(animal.id);
    toastService.success(`${isBookmarked ? "Removed from" : "Added to"} bookmarks`);
  };

  const handleCopyCommonName = () => {
    navigator.clipboard.writeText(animal.commonName)
      .then(() => toastService.success("Copied common name to clipboard"))
      .catch((err) => reportError("Failed to copy common name", err));
  };

  const handleCopyScientificName = () => {
    navigator.clipboard.writeText(animal.scientificName)
      .then(() => toastService.success("Copied scientific name to clipboard"))
      .catch((err) => reportError("Failed to copy scientific name", err));
  };

  const handleCopyImageUrl = () => {
    const imgUrl = animal.heroImage ?? animal.images[0] ?? "";
    if (imgUrl) {
      navigator.clipboard.writeText(imgUrl)
        .then(() => toastService.success("Copied image URL to clipboard"))
        .catch((err) => reportError("Failed to copy image URL", err));
    } else {
      toastService.info("No reference image URL available for this species");
    }
  };

  const handleHide = () => {
    hideSpecies(animal.id);
    toastService.success(`Hidden "${animal.commonName}" from directory`);
  };

  const handleDelete = () => {
    confirmService.show({
      title: "Delete Cached Data",
      message: `Are you sure you want to delete all cached profile data for "${animal.commonName}"?`,
      confirmText: "Delete",
      onConfirm: () => {
        deleteCachedSpecies(animal.id);
        toastService.success(`Deleted cached data for "${animal.commonName}"`);
      },
    });
  };

  const handleAIEnrich = async () => {
    toastService.info(`Starting AI enrichment for "${animal.commonName}"...`);
    try {
      await hydrateSpeciesWithAI(animal);
      toastService.success(`AI enrichment completed for "${animal.commonName}"`);
    } catch (err) {
      reportError(`AI enrichment failed for "${animal.commonName}"`, err);
    }
  };

  // Prevent menu overflow
  const x = menuPos ? Math.min(menuPos.x, window.innerWidth - 200) : 0;
  const y = menuPos ? Math.min(menuPos.y, window.innerHeight - 340) : 0;

  const btnClass = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-medium text-app-text hover:bg-white/10 transition cursor-pointer";

  return (
    <>
      <Link
        to={`/species/${animal.id}`}
        className="page-card interactive-card group flex h-full flex-col overflow-hidden rounded-[1.65rem] hover:no-underline cursor-pointer"
        onContextMenu={handleContextMenu}
      >
        <div className="relative h-[13rem] overflow-hidden border-b border-white/8">
          <SpeciesImage
            animal={animal}
            className="h-full w-full"
            fitClassName="h-full w-full object-cover transition duration-500"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,5,0.02),rgba(3,6,5,0.82))]" />
          

          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-app-accent/90">Species Entry</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">{animal.commonName}</h3>
                <p className="mt-1 text-sm italic text-app-muted">{animal.scientificName}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <p className="text-sm leading-7 text-app-muted">{animal.shortDescription}</p>
          {animal.habitat.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {animal.habitat.slice(0, 3).map((item) => (
                <span key={item} className="tag-chip">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
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
          <div
            className="mt-auto flex items-center justify-between border-t border-white/7 pt-4"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <span className="text-[11px] uppercase tracking-wider text-app-soft/85">
              {animal.classification.family}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-app-soft hover:text-app-accent transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggleFavorite();
                }}
                title={isFavorite ? "Remove favorite" : "Add favorite"}
              >
                {isFavorite ? (
                  <HeartSolidIcon className="h-4.5 w-4.5 text-app-accent" />
                ) : (
                  <HeartIcon className="h-4.5 w-4.5" />
                )}
              </button>
              <button
                type="button"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-app-soft hover:text-app-accent transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggleBookmark();
                }}
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                {isBookmarked ? (
                  <BookmarkSolidIcon className="h-4.5 w-4.5 text-app-accent" />
                ) : (
                  <BookmarkIcon className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Custom Context Menu */}
      {menuPos && (
        <>
          <div
            className="fixed inset-0 z-[100] cursor-default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuPos(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuPos(null);
            }}
          />
          <div
            style={{ top: y, left: x }}
            className="fixed z-[101] w-48 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/85 backdrop-blur-md p-1.5 shadow-2xl animate-fade-in"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleToggleFavorite();
                setMenuPos(null);
              }}
            >
              {isFavorite ? (
                <>
                  <HeartSolidIcon className="h-4 w-4 text-app-accent" />
                  <span>Remove favorite</span>
                </>
              ) : (
                <>
                  <HeartIcon className="h-4 w-4 text-app-soft" />
                  <span>Add to favorites</span>
                </>
              )}
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleToggleBookmark();
                setMenuPos(null);
              }}
            >
              {isBookmarked ? (
                <>
                  <BookmarkSolidIcon className="h-4 w-4 text-app-accent" />
                  <span>Remove bookmark</span>
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-4 w-4 text-app-soft" />
                  <span>Bookmark species</span>
                </>
              )}
            </button>

            <hr className="my-1 border-t border-white/10" />

            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleCopyCommonName();
                setMenuPos(null);
              }}
            >
              <svg className="h-4 w-4 text-app-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy common name</span>
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleCopyScientificName();
                setMenuPos(null);
              }}
            >
              <svg className="h-4 w-4 text-app-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy scientific name</span>
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleCopyImageUrl();
                setMenuPos(null);
              }}
            >
              <svg className="h-4 w-4 text-app-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span>Copy image URL</span>
            </button>

            <hr className="my-1 border-t border-white/10" />

            <button
              type="button"
              className={btnClass}
              onClick={() => {
                void handleAIEnrich();
                setMenuPos(null);
              }}
            >
              <svg className="h-4 w-4 text-app-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>Enrich with AI</span>
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                handleHide();
                setMenuPos(null);
              }}
            >
              <svg className="h-4 w-4 text-app-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <span>Hide species</span>
            </button>

            {isCached && (
              <>
                <hr className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  className={`${btnClass} text-red-400 hover:bg-red-500/10 hover:text-red-300`}
                  onClick={() => {
                    handleDelete();
                    setMenuPos(null);
                  }}
                >
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span>Delete cached data</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
