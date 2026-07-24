import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CompareTable } from "../components/CompareTable";
import { BirdIcon, GlobeGridIcon, MammalIcon, BrainSparkIcon } from "../components/icons";
import { animals, animalMap } from "../data/animals";
import { PageHeader } from "../components/PageHeader";
import { getSettings, getCachedSpecies } from "../services/cache";
import { generateComparisonSummary } from "../services/aiNaturalist";
import { hydrateSpeciesProfile } from "../services/speciesStore";
import { CompareSpeciesSelect } from "../components/CompareSpeciesSelect";
import type { Animal } from "../types/animal";
import { marked } from "marked";

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlLeft = searchParams.get("left");
  const urlRight = searchParams.get("right");

  const [leftId, setLeftId] = useState(() => urlLeft || animals[0].id);
  const [rightId, setRightId] = useState(() => urlRight || animals[1].id);

  const [leftAnimal, setLeftAnimal] = useState<Animal | null>(
    () => animalMap.get(leftId) ?? getCachedSpecies(leftId) ?? animals[0]
  );
  const [rightAnimal, setRightAnimal] = useState<Animal | null>(
    () => animalMap.get(rightId) ?? getCachedSpecies(rightId) ?? animals[1]
  );

  // Sync state if URL query params change (e.g. via navigation or context menu)
  useEffect(() => {
    if (urlLeft && urlLeft !== leftId) setLeftId(urlLeft);
    if (urlRight && urlRight !== rightId) setRightId(urlRight);
  }, [urlLeft, urlRight, leftId, rightId]);

  // Hydrate Left Animal profile from 21k index / static / cache
  useEffect(() => {
    let active = true;
    const staticOrCached = animalMap.get(leftId) ?? getCachedSpecies(leftId);
    if (staticOrCached) {
      setLeftAnimal(staticOrCached);
    } else {
      hydrateSpeciesProfile(leftId)
        .then((res) => {
          if (active && res.animal) setLeftAnimal(res.animal);
        })
        .catch((err) => console.error("Error hydrating left compare species:", err));
    }
    return () => {
      active = false;
    };
  }, [leftId]);

  // Hydrate Right Animal profile from 21k index / static / cache
  useEffect(() => {
    let active = true;
    const staticOrCached = animalMap.get(rightId) ?? getCachedSpecies(rightId);
    if (staticOrCached) {
      setRightAnimal(staticOrCached);
    } else {
      hydrateSpeciesProfile(rightId)
        .then((res) => {
          if (active && res.animal) setRightAnimal(res.animal);
        })
        .catch((err) => console.error("Error hydrating right compare species:", err));
    }
    return () => {
      active = false;
    };
  }, [rightId]);

  function handleSelectLeft(id: string, animal?: Animal) {
    setLeftId(id);
    if (animal) setLeftAnimal(animal);
    const next = new URLSearchParams(searchParams);
    next.set("left", id);
    if (rightId) next.set("right", rightId);
    setSearchParams(next);
  }

  function handleSelectRight(id: string, animal?: Animal) {
    setRightId(id);
    if (animal) setRightAnimal(animal);
    const next = new URLSearchParams(searchParams);
    if (leftId) next.set("left", leftId);
    next.set("right", id);
    setSearchParams(next);
  }

  const left = leftAnimal ?? animals[0];
  const right = rightAnimal ?? animals[1];

  const settings = getSettings();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSummary("");
    setError("");
    setLoading(false);
  }, [leftId, rightId]);

  async function handleGenerateSummary() {
    setLoading(true);
    setError("");
    try {
      const result = await generateComparisonSummary(left, right);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate comparison insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-frame">
      <PageHeader
        title="Compare"
        description="Compare any two species side-by-side. Search across all 21,000+ indexed species or right-click any species in search to compare."
        storageKey="compare"
      />

      {/* Searchable Species Selectors */}
      <section className="page-card rounded-[1.75rem] p-5 mt-4 relative z-30 !overflow-visible">
        <div className="grid gap-4 md:grid-cols-2">
          <CompareSpeciesSelect
            label="Left species"
            selectedId={leftId}
            selectedAnimal={leftAnimal}
            onSelect={handleSelectLeft}
          />
          <CompareSpeciesSelect
            label="Right species"
            selectedId={rightId}
            selectedAnimal={rightAnimal}
            onSelect={handleSelectRight}
          />
        </div>
        {left.id === right.id ? (
          <div className="warning-banner mt-4">
            You are comparing the same species on both sides. Select a different species in one of the search dropdowns to inspect differences.
          </div>
        ) : null}
      </section>

      {/* Species Profile Cards */}
      <section className="grid gap-4 xl:grid-cols-2">
        {[left, right].map((animal, index) => (
          <article key={animal.id} className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              {animal.classification?.className === "Mammalia" ? (
                <MammalIcon className="h-5 w-5" />
              ) : (
                <BirdIcon className="h-5 w-5" />
              )}
              <span className="text-xs uppercase tracking-[0.22em]">
                {index === 0 ? "Left profile" : "Right profile"}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{animal.commonName}</h2>
            <p className="mt-1 italic text-app-muted">{animal.scientificName}</p>
            <p className="mt-4 text-sm leading-7 text-app-muted">{animal.shortDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag-chip">{animal.classification?.className || "Unknown Class"}</span>
              <span className="tag-chip">{animal.conservationStatus}</span>
              <span className="tag-chip">{animal.diet}</span>
            </div>
          </article>
        ))}
      </section>

      {/* At a glance summary */}
      <section className="page-card rounded-[1.6rem] p-5">
        <div className="flex items-center gap-3 text-app-accent">
          <GlobeGridIcon className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.22em]">At a glance</span>
        </div>
        <p className="mt-3 text-sm leading-7 text-app-muted">
          {left.commonName} and {right.commonName} overlap in{" "}
          {left.habitat?.filter((item) => right.habitat?.includes(item)).join(", ") ||
            "no currently shared habitat labels"}
          , while their conservation statuses are {left.conservationStatus} and {right.conservationStatus}.
        </p>
      </section>

      {/* Detailed Side-by-Side Comparison Table */}
      <CompareTable left={left} right={right} />

      {/* AI Naturalist Comparison Insights */}
      <section className="page-card rounded-[1.75rem] p-6 mt-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-3 text-app-accent">
            <BrainSparkIcon className="h-5 w-5 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.22em] font-semibold">
              AI Naturalist Comparison Insights
            </span>
          </div>
          {summary && !loading && (
            <button
              onClick={handleGenerateSummary}
              className="text-xs text-app-accent hover:underline cursor-pointer select-none"
            >
              Regenerate Analysis
            </button>
          )}
        </div>

        {!settings.aiEnabled ? (
          <div className="text-sm leading-6 text-app-muted">
            AI Comparison Summary is disabled in Settings. Re-enable AI Naturalist in settings to compare these species.
          </div>
        ) : loading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 text-sm text-app-soft">
              <div className="spinner-dots shrink-0" aria-hidden="true">
                <span className="bg-app-accent" />
                <span className="bg-app-accent" />
                <span className="bg-app-accent" />
              </div>
              <span>
                Generating comparative analysis for {left.commonName} and {right.commonName}...
              </span>
            </div>
            <div className="space-y-2.5 animate-pulse pt-2">
              <div className="h-4 w-1/3 bg-white/5 rounded-md" />
              <div className="h-3 w-full bg-white/5 rounded-md" />
              <div className="h-3 w-5/6 bg-white/5 rounded-md" />
              <div className="h-3 w-4/5 bg-white/5 rounded-md" />
            </div>
          </div>
        ) : error ? (
          <div className="warning-banner">
            {error}
            <button
              onClick={handleGenerateSummary}
              className="ml-3 underline text-app-text font-semibold hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : summary ? (
          <div
            className="prose prose-invert max-w-none text-sm leading-7 text-app-muted [&_h1]:text-white [&_h2]:text-white [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_strong]:text-white [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1"
            dangerouslySetInnerHTML={{ __html: marked.parse(summary, { async: false }) as string }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-app-muted">
              Get an in-depth, AI-powered comparison of physical traits, survival mechanisms, evolutionary split, and behaviors for these species.
            </p>
            <button
              onClick={handleGenerateSummary}
              className="primary-button mt-4 px-6 py-2.5 text-xs rounded-xl flex items-center gap-2 cursor-pointer select-none"
            >
              <BrainSparkIcon className="h-4 w-4" />
              Compare with AI Naturalist
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
