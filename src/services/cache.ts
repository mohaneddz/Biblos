import { invoke } from "@tauri-apps/api/core";
import { animalMap } from "../data/animals";
import type { Animal, AppSettings, Folder } from "../types/animal";

const FAVORITES_KEY = "biblos.favorites";
const RECENTS_KEY = "biblos.recent";
const BOOKMARKS_KEY = "biblos.bookmarks";
const FOLDERS_KEY = "biblos.folders";
const SETTINGS_KEY = "biblos.settings";
const SPECIES_PREFIX = "biblos.species.";
const SECTION_STATES_KEY = "biblos.section_states";

export interface SectionStates {
  gallery: boolean;
  videos: boolean;
}

const defaultSectionStates: SectionStates = {
  gallery: true,
  videos: false,
};

const defaultSettings: AppSettings = {
  dataMode: "mock",
  theme: "dark-academic",
  aiEnabled: true,
  groqApiKey: "",
  aiModel: "llama-3.3-70b-versatile",
  ecosystemMediaSource: "wikipedia",
  storageLocation: "Browser LocalStorage",
  enableErrorToasts: true,
  enableErrorConsoleLogs: true,
  youtubeApiKey: "",
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function resolveAnimal(id: string) {
  return getCachedSpecies(id) ?? animalMap.get(id) ?? null;
}

const HIDDEN_KEY = "biblos.hidden";

function notifyCacheUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("biblos-cache-updated"));
  }
}

export function getFavorites() {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(id: string) {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeJson(FAVORITES_KEY, next);
  notifyCacheUpdated();
  return next;
}

export function getBookmarkedSpecies() {
  return readJson<string[]>(BOOKMARKS_KEY, []);
}

export function toggleBookmark(id: string) {
  const current = getBookmarkedSpecies();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeJson(BOOKMARKS_KEY, next);
  notifyCacheUpdated();
  return next;
}

export function getRecentlyViewedIds() {
  return readJson<string[]>(RECENTS_KEY, []);
}

export function pushRecentlyViewed(id: string) {
  const deduped = [id, ...getRecentlyViewedIds().filter((entry) => entry !== id)].slice(0, 8);
  writeJson(RECENTS_KEY, deduped);
  notifyCacheUpdated();
  return deduped;
}

export function getRecentlyViewedAnimals() {
  return getRecentlyViewedIds()
    .map((id) => resolveAnimal(id))
    .filter((animal): animal is Animal => Boolean(animal));
}

export function clearRecentlyViewed() {
  writeJson(RECENTS_KEY, []);
  notifyCacheUpdated();
}

// --- Folder Management ---
export function getFolders(): Folder[] {
  return readJson<Folder[]>(FOLDERS_KEY, []);
}

export function saveFolders(folders: Folder[]) {
  writeJson(FOLDERS_KEY, folders);
  notifyCacheUpdated();
}

export function createFolder(name: string, description?: string, icon = "folder"): Folder {
  const newFolder: Folder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    description: description?.trim() || "",
    icon,
    animalIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const folders = getFolders();
  saveFolders([newFolder, ...folders]);
  return newFolder;
}

export function updateFolder(id: string, updates: Partial<Omit<Folder, "id" | "createdAt">>): Folder | null {
  const folders = getFolders();
  const index = folders.findIndex((f) => f.id === id);
  if (index === -1) return null;
  const updated: Folder = {
    ...folders[index],
    ...updates,
    updatedAt: Date.now(),
  };
  folders[index] = updated;
  saveFolders(folders);
  return updated;
}

export function deleteFolder(id: string) {
  const folders = getFolders().filter((f) => f.id !== id);
  saveFolders(folders);
}

export function addAnimalToFolder(folderId: string, animalId: string) {
  const folders = getFolders();
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return;
  if (!folders[index].animalIds.includes(animalId)) {
    folders[index].animalIds.push(animalId);
    folders[index].updatedAt = Date.now();
    saveFolders(folders);
  }
}

export function removeAnimalFromFolder(folderId: string, animalId: string) {
  const folders = getFolders();
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return;
  folders[index].animalIds = folders[index].animalIds.filter((id) => id !== animalId);
  folders[index].updatedAt = Date.now();
  saveFolders(folders);
}

export function toggleAnimalInFolder(folderId: string, animalId: string) {
  const folders = getFolders();
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return;
  const hasAnimal = folders[index].animalIds.includes(animalId);
  if (hasAnimal) {
    folders[index].animalIds = folders[index].animalIds.filter((id) => id !== animalId);
  } else {
    folders[index].animalIds.push(animalId);
  }
  folders[index].updatedAt = Date.now();
  saveFolders(folders);
}

export function getFoldersForAnimal(animalId: string): Folder[] {
  return getFolders().filter((f) => f.animalIds.includes(animalId));
}


export function getCachedSpecies(id: string) {
  return readJson<Animal | null>(`${SPECIES_PREFIX}${id}`, null);
}

export function setCachedSpecies(animal: Animal) {
  writeJson(`${SPECIES_PREFIX}${animal.id}`, animal);
  notifyCacheUpdated();
}

export function deleteCachedSpecies(id: string) {
  if (hasStorage()) {
    window.localStorage.removeItem(`${SPECIES_PREFIX}${id}`);
    // Also remove from favorites, bookmarks, recents
    const favs = getFavorites().filter((item) => item !== id);
    writeJson(FAVORITES_KEY, favs);
    const books = getBookmarkedSpecies().filter((item) => item !== id);
    writeJson(BOOKMARKS_KEY, books);
    const recs = getRecentlyViewedIds().filter((item) => item !== id);
    writeJson(RECENTS_KEY, recs);

    // Add to hidden species list so it vanishes from all directory views instantly
    const currentHidden = getHiddenSpecies();
    if (!currentHidden.includes(id)) {
      writeJson(HIDDEN_KEY, [...currentHidden, id]);
    }
  }

  // Also purge from backend SQLite store if running in Tauri
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    void invoke("delete_species_local", { id }).catch(() => {/* ignore */});
  }

  notifyCacheUpdated();
}

export function deleteSpeciesRecordOnly(id: string) {
  if (hasStorage()) {
    window.localStorage.removeItem(`${SPECIES_PREFIX}${id}`);
  }
  notifyCacheUpdated();
}

export function getHiddenSpecies() {
  return readJson<string[]>(HIDDEN_KEY, []);
}

export function hideSpecies(id: string) {
  const current = getHiddenSpecies();
  if (!current.includes(id)) {
    const next = [...current, id];
    writeJson(HIDDEN_KEY, next);
  }
  notifyCacheUpdated();
}

export function showSpecies(id: string) {
  const current = getHiddenSpecies();
  const next = current.filter((item) => item !== id);
  writeJson(HIDDEN_KEY, next);
  notifyCacheUpdated();
}

export function clearHiddenSpecies() {
  if (hasStorage()) {
    window.localStorage.removeItem(HIDDEN_KEY);
  }
  notifyCacheUpdated();
}

export function clearSpeciesCache() {
  if (!hasStorage()) {
    return;
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(SPECIES_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
  notifyCacheUpdated();
}

export function clearLookupSpeciesCache() {
  if (!hasStorage()) {
    return;
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(SPECIES_PREFIX) && key.includes("gbif-"))
    .forEach((key) => window.localStorage.removeItem(key));
  notifyCacheUpdated();
}

export function clearLibraryData() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(FAVORITES_KEY);
  window.localStorage.removeItem(RECENTS_KEY);
  window.localStorage.removeItem(BOOKMARKS_KEY);
  window.localStorage.removeItem(FOLDERS_KEY);
  notifyCacheUpdated();
}

export function factoryReset() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.clear();
  notifyCacheUpdated();
}

export function getSettings() {
  return { ...defaultSettings, ...readJson<AppSettings>(SETTINGS_KEY, defaultSettings) };
}

export function getAllCachedSpecies(): Animal[] {
  if (!hasStorage()) {
    return [];
  }
  const species: Animal[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(SPECIES_PREFIX)) {
      try {
        const value = window.localStorage.getItem(key);
        if (value) {
          const animal = JSON.parse(value) as Animal;
          species.push(animal);
        }
      } catch {
        // ignore
      }
    }
  }
  return species;
}

export function updateSettings(partial: Partial<AppSettings>) {
  const next = { ...getSettings(), ...partial };
  writeJson(SETTINGS_KEY, next);
  return next;
}

export function getSectionStates(): SectionStates {
  return readJson<SectionStates>(SECTION_STATES_KEY, defaultSectionStates);
}

export function saveSectionStates(partial: Partial<SectionStates>): SectionStates {
  const current = getSectionStates();
  const next = { ...current, ...partial };
  writeJson(SECTION_STATES_KEY, next);
  return next;
}
