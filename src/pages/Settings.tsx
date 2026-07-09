import { useEffect, useState } from "react";
import { clearSpeciesCache, clearLookupSpeciesCache, clearLibraryData, factoryReset, getBookmarkedSpecies, getFavorites, getRecentlyViewedIds, getSettings, updateSettings, getHiddenSpecies, clearHiddenSpecies } from "../services/cache";
import type { AppSettings } from "../types/animal";
import { confirmService } from "../services/confirmService";
import { BrainSparkIcon, DatabaseIcon, GlobeGridIcon, KeyIcon, SettingsIcon, TuneIcon } from "../components/icons";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [cacheMessage, setCacheMessage] = useState("Cached species records and local enrichments are ready for reuse.");
  const [, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  function apply(partial: Partial<AppSettings>) {
    setSettings(updateSettings(partial));
  }

  const favorites = getFavorites().length;
  const bookmarks = getBookmarkedSpecies().length;
  const recents = getRecentlyViewedIds().length;
  const hiddenCount = getHiddenSpecies().length;

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.85rem] p-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-lede">Settings now manages data mode, Groq-backed AI access, media source behavior, and the local cache footprint instead of acting as a placeholder panel.</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="grid gap-4">
          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <DatabaseIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Data Mode</span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ["mock", "Directory only", "Use the baked-in local species directory and cached enrichments."],
                ["cached", "Cached first", "Prefer local cached profiles when available and refresh only when asked."],
                ["live", "Live refresh", "Allow manual species hydration and remote biodiversity lookups on demand."],
              ].map(([value, label, description]) => (
                <label key={value} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-app-text">
                  <input
                    type="radio"
                    name="dataMode"
                    value={value}
                    checked={settings.dataMode === value}
                    onChange={() => apply({ dataMode: value as AppSettings["dataMode"] })}
                    className="mr-3"
                  />
                  <span className="font-medium">{label}</span>
                  <p className="mt-2 text-sm leading-6 text-app-muted">{description}</p>
                </label>
              ))}
            </div>
          </section>

          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <BrainSparkIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">AI Naturalist</span>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <span className="text-app-text">Enable AI Naturalist</span>
                <input type="checkbox" checked={settings.aiEnabled} onChange={(event) => apply({ aiEnabled: event.target.checked })} />
              </label>

              <label className="grid gap-2 text-sm text-app-muted">
                <span>Groq model</span>
                <select
                  value={settings.aiModel}
                  onChange={(event) => apply({ aiModel: event.target.value })}
                  className="rounded-[1rem] border border-white/8 bg-black/25 px-4 py-3 text-app-text cursor-pointer"
                >
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  <option value="gemma2-9b-it">gemma2-9b-it</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-app-muted">
                <span className="inline-flex items-center gap-2">
                  <KeyIcon className="h-4 w-4 text-app-accent" />
                  Optional Groq API key override
                </span>
                <input
                  type="password"
                  value={settings.groqApiKey}
                  onChange={(event) => apply({ groqApiKey: event.target.value })}
                  placeholder="Uses .env GROQ_API_KEY when left blank"
                  className="rounded-[1rem] border border-white/8 bg-black/25 px-4 py-3 text-app-text placeholder:text-app-muted"
                />
                <span className="text-xs leading-6 text-app-soft">Stored locally in browser storage for this app profile if you choose to override the environment key.</span>
              </label>

              <label className="grid gap-2 text-sm text-app-muted">
                <span className="inline-flex items-center gap-2">
                  <KeyIcon className="h-4 w-4 text-app-accent" />
                  YouTube Data API key
                </span>
                <input
                  type="password"
                  value={settings.youtubeApiKey ?? ""}
                  onChange={(event) => apply({ youtubeApiKey: event.target.value })}
                  placeholder="Required for species video search"
                  className="rounded-[1rem] border border-white/8 bg-black/25 px-4 py-3 text-app-text placeholder:text-app-muted"
                />
                <span className="text-xs leading-6 text-app-soft">Free tier: 10,000 units/day (~100 video searches). Get a key from Google Cloud Console → APIs & Services → YouTube Data API v3.</span>
              </label>
            </div>
          </section>
        </div>

        <div className="grid gap-4">
          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <GlobeGridIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Media + Source Mode</span>
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm leading-7 text-app-muted">Biome cards now resolve real imagery from Wikipedia page summaries. This keeps the ecosystem library image-backed without shipping bundled placeholder SVG scenes.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="tag-chip">{settings.ecosystemMediaSource}</span>
                <span className="tag-chip">{settings.theme}</span>
                <span className="tag-chip">{settings.storageLocation}</span>
              </div>
            </div>
          </section>

          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <TuneIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Logs & Notifications</span>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 cursor-pointer hover:bg-white/[0.05] transition">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-app-text font-medium">Enable Error Toasts</span>
                  <span className="text-xs text-app-muted">Show error notifications in the bottom-right corner</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableErrorToasts !== false}
                  onChange={(event) => apply({ enableErrorToasts: event.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 cursor-pointer hover:bg-white/[0.05] transition">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-app-text font-medium">Enable Console Logging</span>
                  <span className="text-xs text-app-muted">Print error messages to the browser developer tools console</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableErrorConsoleLogs !== false}
                  onChange={(event) => apply({ enableErrorConsoleLogs: event.target.checked })}
                />
              </label>
            </div>
          </section>

          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <TuneIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Local Footprint</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="stat-tile">
                <span className="stat-label">Favorites</span>
                <strong>{favorites}</strong>
              </div>
              <div className="stat-tile">
                <span className="stat-label">Bookmarks</span>
                <strong>{bookmarks}</strong>
              </div>
              <div className="stat-tile">
                <span className="stat-label">Recent Views</span>
                <strong>{recents}</strong>
              </div>
              <div className="stat-tile">
                <span className="stat-label">Hidden</span>
                <strong>{hiddenCount}</strong>
              </div>
            </div>
          </section>

          <section className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              <SettingsIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.22em]">Cache Control</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-app-muted">{cacheMessage}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="ghost-button text-sm cursor-pointer"
                onClick={() => {
                  clearSpeciesCache();
                  setCacheMessage("All cached species records cleared from local storage.");
                }}
              >
                Clear all species cache
              </button>
              <button
                type="button"
                className="ghost-button text-sm cursor-pointer"
                onClick={() => {
                  clearLookupSpeciesCache();
                  setCacheMessage("All looked-up species cache cleared. Local static species are retained.");
                }}
              >
                Clear looked-up species only
              </button>
              <button
                type="button"
                className="ghost-button text-sm cursor-pointer"
                onClick={() => {
                  clearLibraryData();
                  setCacheMessage("Favorites, bookmarks, and recent views cleared.");
                }}
              >
                Clear library data
              </button>
              <button
                type="button"
                className="ghost-button text-sm cursor-pointer"
                onClick={() => {
                  clearHiddenSpecies();
                  setCacheMessage("All hidden species filters have been reset.");
                }}
              >
                Reset hidden species
              </button>
              <button
                type="button"
                className="ghost-button text-sm border-red-500/20 hover:border-red-500/40 hover:text-red-400 text-red-500/70 cursor-pointer"
                onClick={() => {
                  confirmService.show({
                    title: "Factory Reset",
                    message: "Are you sure you want to perform a factory reset? This will wipe all settings, library lists, and cached species.",
                    confirmText: "Reset Everything",
                    onConfirm: () => {
                      factoryReset();
                      setSettings(getSettings());
                      setCacheMessage("Application reset complete. All storage cleared.");
                    },
                  });
                }}
              >
                Reset application (Wipe all)
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
