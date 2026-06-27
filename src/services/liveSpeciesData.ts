import type { Animal } from "../types/animal";

const liveEnhancements: Record<string, Partial<Animal>> = {
  "african-lion": {
    coolFacts: [
      "Lions are the only truly social big cats.",
      "A pride's roar can carry for several kilometers.",
      "Females do most cooperative hunting in a pride.",
      "Mock live note: current pride territory data can later come from open wildlife sources.",
    ],
  },
  "axolotl": {
    coolFacts: [
      "Axolotls can regenerate limbs and portions of organs.",
      "They retain external gills into adulthood.",
      "Wild populations are much rarer than captive ones.",
      "Mock live note: habitat alerts can later surface from freshwater monitoring datasets.",
    ],
  },
};

export async function fetchLiveSpeciesData(animal: Animal) {
  await new Promise((resolve) => window.setTimeout(resolve, 850));

  const enhancement = liveEnhancements[animal.id] ?? {};

  return {
    ...animal,
    ...enhancement,
    detailedDescription: `${animal.detailedDescription} This record was refreshed through the local enrichment pipeline and cached with source attribution for later reuse.`,
    sourceUrls: [
      "https://www.gbif.org/",
      "https://www.wikidata.org/",
      "https://eol.org/",
    ],
    lastFetchedAt: new Date().toISOString(),
  } satisfies Animal;
}
