import { animalMap } from "../data/animals";
import type { Animal, AppSettings } from "../types/animal";

const FAVORITES_KEY = "biblos.favorites";
const RECENTS_KEY = "biblos.recent";
const BOOKMARKS_KEY = "biblos.bookmarks";
const SETTINGS_KEY = "biblos.settings";
const SPECIES_PREFIX = "biblos.species.";

const defaultSettings: AppSettings = {
  dataMode: "mock",
  theme: "dark-academic",
  aiEnabled: true,
  storageLocation: "Browser LocalStorage",
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

export function getFavorites() {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(id: string) {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getBookmarkedSpecies() {
  return readJson<string[]>(BOOKMARKS_KEY, []);
}

export function toggleBookmark(id: string) {
  const current = getBookmarkedSpecies();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeJson(BOOKMARKS_KEY, next);
  return next;
}

export function getRecentlyViewedIds() {
  return readJson<string[]>(RECENTS_KEY, []);
}

export function pushRecentlyViewed(id: string) {
  const deduped = [id, ...getRecentlyViewedIds().filter((entry) => entry !== id)].slice(0, 8);
  writeJson(RECENTS_KEY, deduped);
  return deduped;
}

export function getRecentlyViewedAnimals() {
  return getRecentlyViewedIds()
    .map((id) => resolveAnimal(id))
    .filter((animal): animal is Animal => Boolean(animal));
}

export function getCachedSpecies(id: string) {
  return readJson<Animal | null>(`${SPECIES_PREFIX}${id}`, null);
}

export function setCachedSpecies(animal: Animal) {
  writeJson(`${SPECIES_PREFIX}${animal.id}`, animal);
}

export function clearSpeciesCache() {
  if (!hasStorage()) {
    return;
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(SPECIES_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
}

export function getSettings() {
  return { ...defaultSettings, ...readJson<AppSettings>(SETTINGS_KEY, defaultSettings) };
}

export function updateSettings(partial: Partial<AppSettings>) {
  const next = { ...getSettings(), ...partial };
  writeJson(SETTINGS_KEY, next);
  return next;
}
