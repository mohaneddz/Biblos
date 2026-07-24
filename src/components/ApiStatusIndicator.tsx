import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getSettings } from "../services/cache";
import { KeyIcon } from "./icons";

type IntegrationStatus = {
  label: string;
  configured: boolean;
  detail: string;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function ApiStatusIndicator() {
  const [groqEnvConfigured, setGroqEnvConfigured] = useState(false);
  // Re-reading getSettings() on every render is cheap; this counter just
  // forces that re-render whenever Settings are saved elsewhere in the app.
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void invoke<boolean>("has_groq_env_key")
      .then(setGroqEnvConfigured)
      .catch(() => setGroqEnvConfigured(false));
  }, []);

  useEffect(() => {
    const handler = () => forceRerender((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const settings = getSettings();

  const groqConfigured = Boolean(settings.groqApiKey?.trim()) || groqEnvConfigured;
  const youtubeConfigured = Boolean(settings.youtubeApiKey?.trim());

  const integrations: IntegrationStatus[] = [
    {
      label: "AI Naturalist (Groq)",
      configured: groqConfigured,
      detail: groqConfigured
        ? "Configured — chat, AI enrichment, and query parsing are active."
        : "Not configured — add a key in Settings or a .env file to enable AI features.",
    },
    {
      label: "YouTube Data API",
      configured: youtubeConfigured,
      detail: youtubeConfigured
        ? "Configured — species video search is active."
        : "Not configured — add a key in Settings to enable species video search.",
    },
    {
      label: "GBIF / iNaturalist / Wikipedia",
      configured: true,
      detail: "Always available — no key required for taxonomy, search, and cover images.",
    },
  ];

  const allConfigured = integrations.every((item) => item.configured);

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium backdrop-blur-sm transition cursor-default ${
          allConfigured
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300/90"
            : "border-amber-400/30 bg-amber-400/10 text-amber-300/90"
        }`}
        aria-label={allConfigured ? "All optional APIs configured" : "Some optional APIs are not configured"}
      >
        <KeyIcon className="h-3.5 w-3.5" />
        <span className={`h-1.5 w-1.5 rounded-full ${allConfigured ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
      </button>

      <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 origin-top-left scale-95 rounded-[1rem] border border-white/10 bg-black/90 p-3.5 opacity-0 shadow-2xl backdrop-blur-md transition duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-soft">
          Optional API Status
        </p>
        <div className="grid gap-2.5">
          {integrations.map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.configured ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-app-text">{item.label}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-app-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
