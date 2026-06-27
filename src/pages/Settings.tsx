import { useState } from "react";
import { clearSpeciesCache, getSettings, updateSettings } from "../services/cache";
import type { AppSettings } from "../types/animal";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [cacheMessage, setCacheMessage] = useState("Cached species records and media are ready for reuse.");

  function apply(partial: Partial<AppSettings>) {
    setSettings(updateSettings(partial));
  }

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-lede">
          Only local behavior is configurable in this MVP: whether Biblos favors cached records, whether the AI panel is visible, and how local state is stored.
        </p>
      </section>

      <section className="page-grid page-grid-2">
        <div className="page-card rounded-[1.5rem] p-5">
          <h2 className="page-section-title">Data Mode</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["mock", "Directory only", "Use the baked-in local dataset."],
              ["cached", "Cached-first", "Prefer cached enrichments after records are refreshed."],
              ["live", "Local refresh mode", "Allow the refresh button to augment records and cache the result locally."],
            ].map(([value, label, description]) => (
              <label key={value} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-app-text">
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
        </div>

        <div className="page-card rounded-[1.5rem] p-5">
          <h2 className="page-section-title">AI Features</h2>
          <label className="mt-4 flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
            <span className="text-app-text">Enable local AI Naturalist panel</span>
            <input type="checkbox" checked={settings.aiEnabled} onChange={(event) => apply({ aiEnabled: event.target.checked })} />
          </label>
          <div className="stat-tile mt-4">
            <span className="stat-label">Theme</span>
            <strong>{settings.theme}</strong>
          </div>
          <div className="stat-tile mt-4">
            <span className="stat-label">Storage location</span>
            <strong>{settings.storageLocation}</strong>
          </div>
        </div>
      </section>

      <section className="page-card rounded-[1.5rem] p-5">
        <h2 className="page-section-title">Cache Management</h2>
        <p className="mt-3 text-sm leading-7 text-app-muted">{cacheMessage}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              clearSpeciesCache();
              setCacheMessage("Species cache cleared from LocalStorage.");
            }}
          >
            Clear species cache
          </button>
        </div>
      </section>
    </div>
  );
}
