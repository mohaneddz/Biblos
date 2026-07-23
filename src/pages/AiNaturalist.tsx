import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AiNaturalistPanel } from "../components/AiNaturalistPanel";
import { getSettings } from "../services/cache";

export default function AiNaturalist() {
  const [searchParams] = useSearchParams();
  const species = searchParams.get("species") ?? "";
  const settings = getSettings();
  const [isBannerHidden, setIsBannerHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biblos.naturalist.banner-hidden") === "true";
    }
    return false;
  });
  const [showHelp, setShowHelp] = useState(false);

  const toggleBanner = () => {
    setIsBannerHidden((prev) => {
      const next = !prev;
      window.localStorage.setItem("biblos.naturalist.banner-hidden", String(next));
      return next;
    });
  };

  return (
    <div className="p-4 md:p-6 h-full min-h-0 flex flex-col gap-4 overflow-hidden">
      <section className="page-card rounded-[1.75rem] p-6 transition-all duration-300 ease-in-out shrink-0 flex-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="page-title select-none">AI Naturalist</h1>
            
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isBannerHidden ? "max-h-0 opacity-0 mt-0" : "max-h-[12rem] opacity-100 mt-3"
              }`}
            >
              <p className="page-lede text-app-muted pr-2 leading-relaxed">
                A Groq-backed natural history assistant over the Biblos corpus, using local retrieval across taxonomy, biome, behavior, conservation, and comparison records before each answer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-app-soft hover:bg-white/[0.08] hover:text-white transition duration-200 cursor-pointer select-none"
              title="How it works"
            >
              <span className="text-sm font-semibold">?</span>
            </button>
            <button
              type="button"
              onClick={toggleBanner}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-app-soft hover:bg-white/[0.08] hover:text-white transition duration-200 cursor-pointer select-none"
              title={isBannerHidden ? "Show description" : "Hide description"}
            >
              {isBannerHidden ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>
      {settings.aiEnabled ? (
        <AiNaturalistPanel
          initialPrompt={species ? `Tell me about ${species}` : ""}
          speciesName={species}
        />
      ) : (
        <section className="page-card rounded-[1.75rem] p-6">
          <div className="warning-banner">AI Naturalist is disabled in Settings. Re-enable local AI features to use this panel.</div>
        </section>
      )}

      {showHelp && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4 animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(25,30,27,0.98),rgba(10,13,11,0.98))] p-6 shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-xl font-semibold text-white tracking-wide">
                How AI Naturalist Works
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-app-soft hover:text-white transition cursor-pointer text-lg font-medium"
              >
                ✕
              </button>
            </div>
            
            <div className="mt-4 space-y-4 text-sm leading-6">
              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-app-accent font-semibold block mb-1">Model</span>
                <p className="text-white font-medium">{settings.aiModel}</p>
                <p className="text-app-muted mt-0.5">The response pass happens locally in Tauri, meaning your Groq API key is stored safely on your machine.</p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-app-accent font-semibold block mb-1">Retrieval System (RAG)</span>
                <p className="text-app-muted">Before answering, Biblos runs a local vector/keyword retrieval pass over your species database, taxonomy tree, and biome records. The most relevant details are injected directly into the LLM context to ground its answers and prevent hallucinations.</p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-app-accent font-semibold block mb-1">Recommended Queries</span>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-app-muted">
                  <li>Compare two species in one habitat (e.g. "Compare the lion and cheetah").</li>
                  <li>Ask where a species belongs in the taxonomy tree.</li>
                  <li>Ask which biomes fit a specific species.</li>
                  <li>Inquire about endangered, nocturnal, marine, or mountain groups.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="primary-button px-5 py-2 text-xs rounded-xl min-h-0 cursor-pointer"
                onClick={() => setShowHelp(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
