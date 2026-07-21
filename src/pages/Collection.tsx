import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { animalMap } from "../data/animals";
import {
  getBookmarkedSpecies,
  getCachedSpecies,
  getFavorites,
  getRecentlyViewedAnimals,
  getHiddenSpecies,
  getFolders,
  deleteFolder,
  removeAnimalFromFolder,
  addAnimalToFolder,
  clearHiddenSpecies,
  showSpecies,
  clearRecentlyViewed,
} from "../services/cache";
import type { Animal, Folder } from "../types/animal";
import { PageHeader } from "../components/PageHeader";
import {
  HeartSolidIcon,
  BookmarkSolidIcon,
  FolderIcon,
  FolderPlusIcon,
  ClockIcon,
} from "../components/icons";
import { FolderModal } from "../components/FolderModal";
import { FolderIconDisplay } from "../components/FolderIconDisplay";
import { confirmService } from "../services/confirmService";
import { toastService } from "../services/toastService";
import { SpeciesImage } from "../components/SpeciesImage";

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "fav";

  const [version, setVersion] = useState(0);
  const [filterQuery, setFilterQuery] = useState("");

  // Folder modal states
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAddingSpeciesToFolder, setIsAddingSpeciesToFolder] = useState(false);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState("");

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const setTab = (tabKey: string) => {
    setSearchParams({ tab: tabKey }, { replace: true });
    setFilterQuery("");
    setSelectedFolderId(null);
  };

  const hidden = getHiddenSpecies();

  const favoriteAnimals = useMemo(() => {
    return getFavorites()
      .filter((id) => !hidden.includes(id))
      .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
      .filter((a): a is Animal => Boolean(a));
  }, [hidden]);

  const bookmarkedAnimals = useMemo(() => {
    return getBookmarkedSpecies()
      .filter((id) => !hidden.includes(id))
      .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
      .filter((a): a is Animal => Boolean(a));
  }, [hidden]);

  const recentlyViewed = useMemo(() => {
    return getRecentlyViewedAnimals().filter((animal) => !hidden.includes(animal.id));
  }, [hidden]);

  const folders = useMemo(() => {
    return getFolders();
  }, [version]);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f) => f.id === selectedFolderId) ?? null;
  }, [folders, selectedFolderId]);

  const selectedFolderAnimals = useMemo(() => {
    if (!selectedFolder) return [];
    return selectedFolder.animalIds
      .filter((id) => !hidden.includes(id))
      .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
      .filter((a): a is Animal => Boolean(a));
  }, [selectedFolder, hidden]);

  const hiddenAnimals = useMemo(() => {
    return hidden
      .map((id) => getCachedSpecies(id) ?? animalMap.get(id))
      .filter((a): a is Animal => Boolean(a));
  }, [hidden]);

  // Filtered lists based on filterQuery
  const filteredFavorites = useMemo(() => {
    if (!filterQuery.trim()) return favoriteAnimals;
    const q = filterQuery.toLowerCase();
    return favoriteAnimals.filter(
      (a) =>
        a.commonName.toLowerCase().includes(q) ||
        a.scientificName.toLowerCase().includes(q) ||
        a.classification.family.toLowerCase().includes(q)
    );
  }, [favoriteAnimals, filterQuery]);

  const filteredBookmarks = useMemo(() => {
    if (!filterQuery.trim()) return bookmarkedAnimals;
    const q = filterQuery.toLowerCase();
    return bookmarkedAnimals.filter(
      (a) =>
        a.commonName.toLowerCase().includes(q) ||
        a.scientificName.toLowerCase().includes(q) ||
        a.classification.family.toLowerCase().includes(q)
    );
  }, [bookmarkedAnimals, filterQuery]);

  const filteredFolderAnimals = useMemo(() => {
    if (!filterQuery.trim()) return selectedFolderAnimals;
    const q = filterQuery.toLowerCase();
    return selectedFolderAnimals.filter(
      (a) =>
        a.commonName.toLowerCase().includes(q) ||
        a.scientificName.toLowerCase().includes(q) ||
        a.classification.family.toLowerCase().includes(q)
    );
  }, [selectedFolderAnimals, filterQuery]);

  // All available species for adding to a folder
  const availableSpeciesForFolder = useMemo(() => {
    if (!selectedFolder) return [];
    const existingIds = new Set(selectedFolder.animalIds);

    // Combine static animals + cached species
    const allAnimals = Array.from(animalMap.values());
    const q = speciesSearchQuery.toLowerCase().trim();

    return allAnimals.filter(
      (a) =>
        !existingIds.has(a.id) &&
        (!q ||
          a.commonName.toLowerCase().includes(q) ||
          a.scientificName.toLowerCase().includes(q))
    );
  }, [selectedFolder, speciesSearchQuery]);

  const handleDeleteFolder = (folder: Folder) => {
    confirmService.show({
      title: "Delete Folder",
      message: `Are you sure you want to delete the folder "${folder.name}"? This will not delete the species from Biblos.`,
      confirmText: "Delete Folder",
      onConfirm: () => {
        deleteFolder(folder.id);
        toastService.success(`Deleted folder "${folder.name}"`);
        if (selectedFolderId === folder.id) {
          setSelectedFolderId(null);
        }
      },
    });
  };

  const handleClearRecents = () => {
    confirmService.show({
      title: "Clear Recently Viewed",
      message: "Are you sure you want to clear your recently viewed history?",
      confirmText: "Clear History",
      onConfirm: () => {
        clearRecentlyViewed();
        toastService.success("Cleared recently viewed history");
      },
    });
  };

  const tabs = [
    { key: "fav", label: "Favorites", count: favoriteAnimals.length, icon: HeartSolidIcon },
    { key: "bookm", label: "Bookmarks", count: bookmarkedAnimals.length, icon: BookmarkSolidIcon },
    { key: "folders", label: "Folders", count: folders.length, icon: FolderIcon },
    { key: "others", label: "Others", count: recentlyViewed.length, icon: ClockIcon },
  ];

  return (
    <div className="page-frame">
      <PageHeader
        title="Collection"
        description="Your personal sanctuary for saved species, research bookmarks, custom categories, and discovery history."
        storageKey="collection"
      />

      {/* Modern Subpage Tabs Navigation */}
      <div className="border-b border-white/10 pb-1">
        <nav className="flex flex-wrap gap-2 sm:gap-3" aria-label="Collection tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-medium transition cursor-pointer sm:text-sm ${
                  isActive
                    ? "bg-app-accent/15 text-app-accent border border-app-accent/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "bg-white/[0.03] text-app-muted border border-white/5 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-app-accent" : "text-app-soft"}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive
                      ? "bg-app-accent/25 text-app-accent"
                      : "bg-white/10 text-app-soft"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: FAVORITES */}
      {activeTab === "fav" && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="page-section-title">Favorite Species</h2>
              <p className="text-xs text-app-muted mt-1">Species you have starred for quick reference.</p>
            </div>

            <div className="flex items-center gap-3">
              {favoriteAnimals.length > 0 && (
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter favorites..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-app-muted focus:border-app-accent focus:outline-none"
                />
              )}
              <Link to="/species" className="ghost-button text-xs min-h-0 py-2">
                + Add species
              </Link>
            </div>
          </div>

          {filteredFavorites.length > 0 ? (
            <div className="page-grid page-grid-3">
              {filteredFavorites.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : favoriteAnimals.length > 0 ? (
            <div className="page-card rounded-[1.5rem] p-6 text-center text-sm text-app-muted">
              No favorites match "{filterQuery}".
            </div>
          ) : (
            <div className="page-card rounded-[1.5rem] p-8 text-center space-y-3">
              <HeartSolidIcon className="h-10 w-10 text-app-soft/40 mx-auto" />
              <p className="text-sm text-app-text font-medium">No favorites saved yet</p>
              <p className="text-xs text-app-muted max-w-sm mx-auto">
                Click the heart icon on any species card to bookmark your top animals here.
              </p>
              <Link to="/species" className="primary-button inline-flex text-xs px-4 py-2 mt-2">
                Browse Species Directory
              </Link>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: BOOKMARKS */}
      {activeTab === "bookm" && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="page-section-title">Research Bookmarks</h2>
              <p className="text-xs text-app-muted mt-1">Target species saved for current reading & study.</p>
            </div>

            <div className="flex items-center gap-3">
              {bookmarkedAnimals.length > 0 && (
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter bookmarks..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-app-muted focus:border-app-accent focus:outline-none"
                />
              )}
              <Link to="/explorer" className="ghost-button text-xs min-h-0 py-2">
                Explore species
              </Link>
            </div>
          </div>

          {filteredBookmarks.length > 0 ? (
            <div className="page-grid page-grid-3">
              {filteredBookmarks.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : bookmarkedAnimals.length > 0 ? (
            <div className="page-card rounded-[1.5rem] p-6 text-center text-sm text-app-muted">
              No bookmarks match "{filterQuery}".
            </div>
          ) : (
            <div className="page-card rounded-[1.5rem] p-8 text-center space-y-3">
              <BookmarkSolidIcon className="h-10 w-10 text-app-soft/40 mx-auto" />
              <p className="text-sm text-app-text font-medium">No bookmarks saved yet</p>
              <p className="text-xs text-app-muted max-w-sm mx-auto">
                Save species from the explorer or species directory to build your focused reading list.
              </p>
              <Link to="/explorer" className="primary-button inline-flex text-xs px-4 py-2 mt-2">
                Open Species Explorer
              </Link>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CUSTOM FOLDERS */}
      {activeTab === "folders" && (
        <section className="space-y-6 animate-fade-in">
          {/* FOLDER DETAIL VIEW */}
          {selectedFolder ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(null)}
                    className="text-xs font-medium text-app-accent hover:underline mb-2 flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to all folders
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-app-accent">
                      <FolderIconDisplay iconKey={selectedFolder.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedFolder.name}
                      </h2>
                      {selectedFolder.description && (
                        <p className="text-xs text-app-muted mt-0.5">{selectedFolder.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingSpeciesToFolder(true)}
                    className="primary-button text-xs py-2 px-3 min-h-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Add species</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(selectedFolder);
                      setIsFolderModalOpen(true);
                    }}
                    className="ghost-button text-xs py-2 px-3 min-h-0 cursor-pointer"
                  >
                    Edit Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(selectedFolder)}
                    className="ghost-button text-xs py-2 px-3 min-h-0 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {selectedFolderAnimals.length > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-app-soft font-medium uppercase tracking-wider">
                    {selectedFolderAnimals.length} {selectedFolderAnimals.length === 1 ? "Species" : "Species"} in this folder
                  </p>
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter species in folder..."
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-app-muted focus:border-app-accent focus:outline-none"
                  />
                </div>
              )}

              {filteredFolderAnimals.length > 0 ? (
                <div className="page-grid page-grid-3">
                  {filteredFolderAnimals.map((animal) => (
                    <div key={animal.id} className="relative group">
                      <AnimalCard animal={animal} />
                      <button
                        type="button"
                        onClick={() => {
                          removeAnimalFromFolder(selectedFolder.id, animal.id);
                          toastService.success(`Removed "${animal.commonName}" from folder`);
                        }}
                        title="Remove from this folder"
                        className="absolute top-3 right-3 z-20 h-7 w-7 rounded-full bg-black/70 hover:bg-red-600/90 text-white flex items-center justify-center text-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : selectedFolderAnimals.length > 0 ? (
                <div className="page-card rounded-[1.5rem] p-6 text-center text-sm text-app-muted">
                  No species match "{filterQuery}".
                </div>
              ) : (
                <div className="page-card rounded-[1.5rem] p-8 text-center space-y-3">
                  <FolderIcon className="h-10 w-10 text-app-soft/40 mx-auto" />
                  <p className="text-sm text-app-text font-medium">This folder is currently empty</p>
                  <p className="text-xs text-app-muted max-w-sm mx-auto">
                    Add species to "{selectedFolder.name}" using the button below or right-click any animal card across Biblos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingSpeciesToFolder(true)}
                    className="primary-button inline-flex text-xs px-4 py-2 mt-2 cursor-pointer"
                  >
                    + Add Species to Folder
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ALL FOLDERS GRID VIEW */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="page-section-title">Custom Categories & Folders</h2>
                  <p className="text-xs text-app-muted mt-1">Organize animals into your own customized categories.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="primary-button text-xs py-2 px-4 min-h-0 cursor-pointer flex items-center gap-2 self-start"
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  <span>+ Create Folder</span>
                </button>
              </div>

              {folders.length > 0 ? (
                <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="interactive-card group relative flex flex-col justify-between rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/20 cursor-pointer overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-app-accent shadow-inner">
                            <FolderIconDisplay iconKey={folder.icon} className="h-4.5 w-4.5" />
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolder(folder);
                                setIsFolderModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-app-soft hover:text-white hover:bg-white/10 transition cursor-pointer text-xs"
                              title="Edit folder"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder);
                              }}
                              className="p-1 rounded-lg text-app-soft hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer text-xs"
                              title="Delete folder"
                            >
                              🗑
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-app-accent transition truncate" title={folder.name}>
                          {folder.name}
                        </h3>

                        <p className="mt-1 text-[11px] text-app-muted line-clamp-2 min-h-[1.75rem] leading-snug">
                          {folder.description || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5 text-[11px] text-app-soft">
                        <span className="font-medium">
                          {folder.animalIds.length} {folder.animalIds.length === 1 ? "species" : "species"}
                        </span>
                        <span className="text-app-accent font-medium group-hover:translate-x-0.5 transition text-[10px]">
                          View →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="page-card rounded-[1.5rem] p-8 text-center space-y-3">
                  <FolderPlusIcon className="h-10 w-10 text-app-soft/40 mx-auto" />
                  <p className="text-sm text-app-text font-medium">No custom folders yet</p>
                  <p className="text-xs text-app-muted max-w-sm mx-auto">
                    Create custom folders to categorize species by habitat, endangerment, diet, or personal themes.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(null);
                      setIsFolderModalOpen(true);
                    }}
                    className="primary-button inline-flex text-xs px-4 py-2 mt-2 cursor-pointer"
                  >
                    + Create Your First Folder
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: OTHERS / RECENTS */}
      {activeTab === "others" && (
        <section className="space-y-8 animate-fade-in">
          {/* Recently Viewed */}
          <div className="page-card rounded-[1.5rem] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h2 className="page-section-title">Recently Viewed Species</h2>
                <p className="text-xs text-app-muted mt-0.5">Your recent exploration trail across Biblos.</p>
              </div>

              {recentlyViewed.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRecents}
                  className="ghost-button text-xs py-1.5 px-3 min-h-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  Clear recents
                </button>
              )}
            </div>

            {recentlyViewed.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {recentlyViewed.map((animal) => (
                  <Link
                    key={animal.id}
                    to={`/species/${animal.id}`}
                    className="interactive-card rounded-[1.2rem] border border-white/7 bg-white/[0.03] p-4 flex gap-4 items-center"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 shrink-0">
                      <SpeciesImage animal={animal} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{animal.commonName}</p>
                      <p className="text-xs italic text-app-muted truncate">{animal.scientificName}</p>
                      <p className="mt-1 text-xs text-app-soft truncate">{animal.shortDescription}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-app-muted py-2">No recent entries yet.</p>
            )}
          </div>

          {/* Hidden Species Management */}
          {hiddenAnimals.length > 0 && (
            <div className="page-card rounded-[1.5rem] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div>
                  <h2 className="page-section-title">Hidden Species</h2>
                  <p className="text-xs text-app-muted mt-0.5">Species currently hidden from your directory lists.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    clearHiddenSpecies();
                    toastService.success("Unhid all species");
                  }}
                  className="ghost-button text-xs py-1.5 px-3 min-h-0 cursor-pointer"
                >
                  Unhide All
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {hiddenAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className="rounded-[1.2rem] border border-white/7 bg-white/[0.02] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">{animal.commonName}</p>
                      <p className="text-xs italic text-app-muted">{animal.scientificName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        showSpecies(animal.id);
                        toastService.success(`Unhid "${animal.commonName}"`);
                      }}
                      className="primary-button text-xs py-1 px-3 min-h-0 cursor-pointer"
                    >
                      Unhide
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* FOLDER MODAL (Create / Edit) */}
      <FolderModal
        folder={editingFolder}
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
      />

      {/* ADD SPECIES TO SELECTED FOLDER MODAL */}
      {selectedFolder && isAddingSpeciesToFolder && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4 animate-fade-in"
          onClick={() => setIsAddingSpeciesToFolder(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,30,27,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                  <FolderIconDisplay iconKey={selectedFolder.icon} className="h-5 w-5 text-app-accent" />
                  <span>Add Species to "{selectedFolder.name}"</span>
                </h2>
              </div>
              <button
                type="button"
                className="text-app-soft hover:text-white transition p-1 cursor-pointer"
                onClick={() => setIsAddingSpeciesToFolder(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={speciesSearchQuery}
                onChange={(e) => setSpeciesSearchQuery(e.target.value)}
                placeholder="Search species name..."
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-app-muted/40 focus:border-app-accent focus:outline-none mb-3"
              />

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {availableSpeciesForFolder.length > 0 ? (
                  availableSpeciesForFolder.map((animal) => (
                    <div
                      key={animal.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 overflow-hidden rounded-lg border border-white/10 shrink-0">
                          <SpeciesImage animal={animal} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{animal.commonName}</p>
                          <p className="text-[11px] italic text-app-muted truncate">{animal.scientificName}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addAnimalToFolder(selectedFolder.id, animal.id);
                          toastService.success(`Added "${animal.commonName}" to folder`);
                        }}
                        className="primary-button text-[11px] py-1 px-3 min-h-0 cursor-pointer shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-app-muted py-6">
                    {speciesSearchQuery ? "No matching species found." : "All species are already in this folder!"}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-3">
              <button
                type="button"
                className="primary-button text-xs py-1.5 px-4 rounded-xl min-h-0 cursor-pointer"
                onClick={() => setIsAddingSpeciesToFolder(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
