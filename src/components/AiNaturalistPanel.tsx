import { useMemo, useState } from "react";
import { animals } from "../data/animals";

const promptChips = [
  "Tell me about the African lion",
  "Which endangered species live in Asia?",
  "Show nocturnal mammals",
  "Compare dolphin and whale habitats",
  "What species live in wetlands?",
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function findMentionedAnimals(prompt: string) {
  const query = normalize(prompt);
  return animals.filter((animal) => query.includes(normalize(animal.commonName)) || query.includes(normalize(animal.scientificName)));
}

function answerPrompt(prompt: string) {
  const query = normalize(prompt);
  const mentioned = findMentionedAnimals(prompt);

  if (mentioned.length === 1 && (query.startsWith("tell me about") || query.includes("about "))) {
    const animal = mentioned[0];
    return `${animal.commonName}: ${animal.shortDescription} It is a ${animal.diet.toLowerCase()} ${animal.classification.className.toLowerCase()} active primarily during ${animal.activityPattern.toLowerCase()} periods. Habitats: ${animal.habitat.join(", ")}. Conservation status: ${animal.conservationStatus}.`;
  }

  if (query.includes("endangered") && query.includes("asia")) {
    const results = animals.filter((animal) => animal.continents.includes("Asia") && (animal.conservationStatus === "Endangered" || animal.conservationStatus === "Critically Endangered"));
    return results.length > 0
      ? `Endangered or critically endangered species in Asia from the local index: ${results.map((animal) => animal.commonName).join(", ")}.`
      : "No endangered Asian species are currently in the local index.";
  }

  if (query.includes("nocturnal mammals")) {
    const results = animals.filter((animal) => animal.activityPattern === "Nocturnal" && animal.classification.className === "Mammalia");
    return results.length > 0
      ? `Nocturnal mammals in the local directory: ${results.map((animal) => animal.commonName).join(", ")}.`
      : "No nocturnal mammals are currently listed.";
  }

  if (query.includes("wetland")) {
    const results = animals.filter((animal) => animal.habitat.includes("Wetland"));
    return results.length > 0
      ? `Wetland-linked records include ${results.map((animal) => animal.commonName).join(", ")}.`
      : "No wetland-linked species are currently listed.";
  }

  if ((query.includes("compare") || query.includes("difference")) && mentioned.length >= 2) {
    const [left, right] = mentioned;
    return `${left.commonName} vs ${right.commonName}: ${left.commonName} is a ${left.classification.className.toLowerCase()} associated with ${left.habitat.join(", ")}, while ${right.commonName} is a ${right.classification.className.toLowerCase()} associated with ${right.habitat.join(", ")}. Their conservation statuses are ${left.conservationStatus} and ${right.conservationStatus}.`;
  }

  if (mentioned.length === 1) {
    const animal = mentioned[0];
    return `${animal.commonName}: ${animal.shortDescription} Status: ${animal.conservationStatus}. Continents: ${animal.continents.join(", ")}.`;
  }

  if (query.includes("classif")) {
    const animal = mentioned[0] ?? animals.find((entry) => query.includes(normalize(entry.commonName)));
    if (!animal) {
      return "Name the species you want classified and I will answer from the local taxonomy fields.";
    }

    return `${animal.commonName} classification: ${animal.classification.kingdom} > ${animal.classification.phylum} > ${animal.classification.className} > ${animal.classification.order} > ${animal.classification.family} > ${animal.classification.genus} > ${animal.classification.species}.`;
  }

  if (query.includes("habitat") || query.includes("where")) {
    const habitatMatches = animals.filter((animal) => animal.habitat.some((habitat) => query.includes(normalize(habitat))));
    if (habitatMatches.length > 0) {
      return `Matching habitat records: ${habitatMatches.map((animal) => animal.commonName).join(", ")}.`;
    }
  }

  return "I can answer from the local Biblos dataset about species identity, habitats, activity patterns, continents, conservation status, and straightforward comparisons. Try naming a species, a biome, a continent, or a behavior.";
}

export function AiNaturalistPanel({ initialPrompt = "" }: { initialPrompt?: string }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    initialPrompt
      ? [
          { role: "user", content: initialPrompt },
          { role: "assistant", content: answerPrompt(initialPrompt) },
        ]
      : [],
  );

  const suggested = useMemo(() => promptChips, []);

  function submit(nextPrompt: string) {
    const clean = nextPrompt.trim();
    if (!clean) {
      return;
    }

    setHistory((current) => [
      ...current,
      { role: "user", content: clean },
      { role: "assistant", content: answerPrompt(clean) },
    ]);
    setPrompt("");
  }

  return (
    <section className="page-card rounded-[1.75rem] p-5 md:p-6">
      <div className="warning-banner mb-5">
        AI Naturalist answers only from local Biblos records in this MVP. Use it for fast synthesis, then open the related species pages for the full entry.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {suggested.map((chip) => (
          <button key={chip} type="button" className="tag-chip text-left transition hover:border-app-accent/35 hover:text-app-text" onClick={() => submit(chip)}>
            {chip}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
        <div className="grid gap-4">
          {history.length === 0 ? (
            <p className="text-sm leading-7 text-app-muted">Ask about an animal, continent, habitat, behavior, or comparison.</p>
          ) : (
            history.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={entry.role === "assistant" ? "rounded-2xl border border-app-accent/12 bg-app-accent/6 p-4" : "rounded-2xl border border-white/6 bg-white/[0.03] p-4"}>
                <span className="text-xs uppercase tracking-[0.18em] text-app-soft">{entry.role}</span>
                <p className="mt-2 text-sm leading-7 text-app-text">{entry.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask about an animal, biome, continent, or comparison..."
            className="min-h-12 flex-1 rounded-[1.1rem] border border-white/8 bg-black/25 px-4 text-app-text placeholder:text-app-muted"
          />
          <button type="button" className="primary-button" onClick={() => submit(prompt)}>
            Ask Naturalist
          </button>
        </div>
      </div>
    </section>
  );
}
