import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { askNaturalist } from "../services/aiNaturalist";
import { getSettings } from "../services/cache";
import { BinocularsIcon, BrainSparkIcon, DatabaseIcon, GlobeGridIcon, LeafClusterIcon } from "./icons";
import { animals } from "../data/animals";
import type { Animal } from "../types/animal";

const promptChips = [
  "Compare the African lion and cheetah as savanna predators.",
  "Which endangered species in Biblos are tied to wetlands or estuaries?",
  "Explain where the giant Pacific octopus sits in the tree of life.",
  "Which biomes in Biblos fit the bottlenose dolphin best?",
  "Show me mountain species and explain how their habitats differ.",
];

type ChatEntry = {
  role: "user" | "assistant";
  content: string;
  refs?: Array<{ id: string; title: string; kind: string; excerpt: string }>;
};

export function AiNaturalistPanel({
  initialPrompt = "",
  speciesName = "",
}: {
  initialPrompt?: string;
  speciesName?: string;
}) {
  const settings = useMemo(() => getSettings(), []);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matchedAnimal = useMemo(() => {
    if (!speciesName) return null;
    const cleanName = speciesName.trim().toLowerCase();
    
    // Check local animals first
    const local = animals.find(
      (a) =>
        a.commonName.toLowerCase() === cleanName ||
        a.id.toLowerCase() === cleanName ||
        a.scientificName.toLowerCase() === cleanName
    );
    if (local) return local;

    // Check localStorage cache
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("biblos.species.")) {
          try {
            const cached = JSON.parse(window.localStorage.getItem(key) || "") as Animal;
            if (
              cached &&
              (cached.commonName.toLowerCase() === cleanName ||
                cached.id.toLowerCase() === cleanName ||
                cached.scientificName.toLowerCase() === cleanName)
            ) {
              return cached;
            }
          } catch {
            // ignore
          }
        }
      }
    }
    return null;
  }, [speciesName]);

  const matchedAnimalContext = useMemo(() => {
    if (!matchedAnimal) return "";
    return [
      `[SPECIES] Species: ${matchedAnimal.commonName} (${matchedAnimal.scientificName})`,
      `Taxonomy: ${matchedAnimal.classification.kingdom} > ${matchedAnimal.classification.phylum} > ${matchedAnimal.classification.className} > ${matchedAnimal.classification.order} > ${matchedAnimal.classification.family} > ${matchedAnimal.classification.genus} > ${matchedAnimal.classification.species}`,
      `Summary: ${matchedAnimal.shortDescription}`,
      `Detail: ${matchedAnimal.detailedDescription}`,
      `Habitats: ${matchedAnimal.habitat.join(", ")}`,
      `Diet: ${matchedAnimal.diet}`,
      `Activity: ${matchedAnimal.activityPattern}`,
      `Continents: ${matchedAnimal.continents.join(", ")}`,
      `Conservation: ${matchedAnimal.conservationStatus}`,
      `Facts: ${matchedAnimal.coolFacts.join(" ")}`,
    ].join("\n");
  }, [matchedAnimal]);

  async function submit(nextPrompt: string) {
    const clean = nextPrompt.trim();
    if (!clean || busy) {
      return;
    }

    setBusy(true);
    setError("");
    setHistory((current) => [...current, { role: "user", content: clean }]);

    try {
      const response = await askNaturalist({
        question: clean,
        history: history.map(({ role, content }) => ({ role, content })),
        apiKey: settings.groqApiKey,
        model: settings.aiModel,
        extraContext: matchedAnimalContext,
      });

      setHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          refs: response.contextHits.map((hit) => ({
            id: hit.id,
            title: hit.title,
            kind: hit.kind,
            excerpt: hit.excerpt,
          })),
        },
      ]);
      setPrompt("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reach AI Naturalist.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!initialPrompt) {
      return;
    }
    if (history.length > 0) {
      return;
    }
    void submit(initialPrompt);
  }, [history.length, initialPrompt]);

  return (
    <section className="page-card rounded-[1.8rem] p-5 md:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)]">
        <div>
          <div className="rounded-[1.4rem] border border-app-accent/18 bg-app-accent/7 px-4 py-4 text-sm leading-7 text-app-muted">
            AI Naturalist now runs through Groq with a simple local retrieval pass over species records, ecosystem notes, and taxonomy nodes before each answer.
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {promptChips.map((chip) => (
              <button key={chip} type="button" className="interactive-card rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-left text-sm text-app-text" onClick={() => void submit(chip)}>
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
            <div className="grid gap-4">
              {history.length === 0 ? (
                <p className="text-sm leading-7 text-app-muted">Ask for comparisons, taxonomy placement, biome fit, conservation context, or species summaries grounded in the local Biblos corpus.</p>
              ) : (
                history.map((entry, index) => (
                  <div key={`${entry.role}-${index}`} className={entry.role === "assistant" ? "rounded-[1.35rem] border border-app-accent/12 bg-app-accent/6 p-4" : "rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4"}>
                    <span className="text-xs uppercase tracking-[0.18em] text-app-soft">{entry.role === "assistant" ? "AI Naturalist" : "You"}</span>
                    <p className="mt-2 text-sm leading-7 text-app-text">{entry.content}</p>
                    {entry.refs && entry.refs.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {entry.refs.slice(0, 4).map((ref) => (
                          <div key={ref.id} className="rounded-[1rem] border border-white/7 bg-black/18 px-3 py-3 text-sm">
                            <div className="flex items-center gap-2 text-app-accent">
                              {ref.kind === "species" ? <BinocularsIcon className="h-4 w-4" /> : ref.kind === "biome" ? <LeafClusterIcon className="h-4 w-4" /> : <GlobeGridIcon className="h-4 w-4" />}
                              <span className="uppercase tracking-[0.18em] text-[0.68rem]">{ref.kind}</span>
                            </div>
                            <p className="mt-2 text-app-text">{ref.title}</p>
                            <p className="mt-1 text-app-muted">{ref.excerpt}</p>
                            {ref.kind === "species" ? (
                              <Link to={`/species/${ref.id}`} className="mt-3 inline-flex text-app-accent hover:text-app-accent-strong">
                                Open species
                              </Link>
                            ) : ref.kind === "biome" ? (
                              <Link to={`/explorer?ecosystem=${ref.id}`} className="mt-3 inline-flex text-app-accent hover:text-app-accent-strong">
                                Open biome
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 grid gap-3">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask about an animal, a branch of the tree, a biome, or a comparison..."
                className="min-h-32 rounded-[1.2rem] border border-white/8 bg-black/25 px-4 py-4 text-app-text placeholder:text-app-muted"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="primary-button" onClick={() => void submit(prompt)} disabled={busy || prompt.trim().length === 0}>
                  {busy ? "Asking Groq..." : "Ask Naturalist"}
                </button>
                {error ? <span className="text-sm text-[#f4b7a1]">{error}</span> : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-3">
          {matchedAnimal && (
            <div className="rounded-[1.4rem] border border-app-accent/35 bg-app-accent/9 p-4">
              <div className="flex items-center gap-3 text-app-accent">
                <BinocularsIcon className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.24em] font-semibold">Active Species Focus</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{matchedAnimal.commonName}</p>
              <p className="text-sm italic text-app-muted">{matchedAnimal.scientificName}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-app-soft">
                <div>
                  <span className="block font-medium">Status</span>
                  <span className="text-app-text">{matchedAnimal.conservationStatus}</span>
                </div>
                <div>
                  <span className="block font-medium">Diet</span>
                  <span className="text-app-text">{matchedAnimal.diet}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-app-muted line-clamp-3">
                {matchedAnimal.shortDescription}
              </p>
              <Link to={`/species/${matchedAnimal.id}`} className="mt-3 inline-flex items-center text-xs text-app-accent hover:underline">
                View full record &rarr;
              </Link>
            </div>
          )}
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 text-app-accent">
              <BrainSparkIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.24em]">Model</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">{settings.aiModel}</p>
            <p className="mt-2 text-sm leading-6 text-app-muted">The response pass happens in Tauri, so the key does not need to live in the browser bundle.</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 text-app-accent">
              <DatabaseIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.24em]">Retrieval</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-app-muted">The retriever scores species records, biome briefs, and taxonomy nodes, then injects the top local context into the Groq prompt.</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 text-app-accent">
              <BinocularsIcon className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.24em]">Best Queries</span>
            </div>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-app-muted">
              <li>Compare two species in one habitat.</li>
              <li>Ask where a species belongs in the taxonomy tree.</li>
              <li>Ask which Biblos biomes fit a species.</li>
              <li>Ask for endangered, nocturnal, marine, or mountain subsets.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
