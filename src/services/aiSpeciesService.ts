import { askNaturalist } from "./aiNaturalist";
import { getSettings } from "./cache";
import { reportError } from "./errorReporter";
import { searchSpeciesVideos } from "./youtubeService";
import type { Animal } from "../types/animal";

export async function getSpeciesSuggestionsFromAI(query: string): Promise<{ scientificName: string; commonName: string }[]> {
  const settings = getSettings();
  if (!settings.aiEnabled || !settings.groqApiKey) {
    return [];
  }

  const prompt = `You are a biology search assistant.
For the search query: "${query}", return a JSON list of the top 8 actual animal species (living or recently extinct) that a user is most likely looking for.
Avoid listing viruses, bacteria, fungi, plants, or obscure parasites unless specifically requested.
Return a raw JSON array matching this format (no explanations, no markdown blocks):
[
  { "scientificName": "Panthera leo", "commonName": "Lion" },
  { "scientificName": "Zalophus californianus", "commonName": "California Sea Lion" }
]`;

  try {
    const response = await askNaturalist({
      question: prompt,
      history: [],
      apiKey: settings.groqApiKey,
      model: settings.aiModel,
    });

    let text = response.answer.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
      text = text.replace(/\s*```$/, "");
    }
    const data = JSON.parse(text.trim());
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        scientificName: String(item.scientificName || "").trim(),
        commonName: String(item.commonName || "").trim(),
      })).filter((item) => item.scientificName);
    }
  } catch (err) {
    reportError(`AI suggestions failed for query "${query}"`, err);
  }
  return [];
}

export async function hydrateSpeciesWithAI(animal: Animal): Promise<Animal> {
  const settings = getSettings();
  const schema = `{
    "classification": {
      "kingdom": "string (REQUIRED, e.g. 'Animalia')",
      "phylum": "string (REQUIRED, e.g. 'Chordata')",
      "className": "string (REQUIRED, e.g. 'Mammalia')",
      "order": "string (REQUIRED, e.g. 'Carnivora')",
      "family": "string (REQUIRED, e.g. 'Felidae')",
      "genus": "string (REQUIRED, e.g. 'Panthera')",
      "species": "string (REQUIRED, specific epithet or binomial, e.g. 'leo' or 'Panthera leo')"
    },
    "averageLifespanYears": number (REQUIRED, estimate from family/order averages if unknown),
    "shortDescription": "string (1 compelling sentence summary, NEVER empty)",
    "detailedDescription": "string (a rich 3-5 sentence paragraph covering appearance, behavior, ecology, diet, and interesting adaptations. NEVER generic.)",
    "coolFacts": ["5 unique, specific, interesting facts about this exact species"],
    "habitat": ["list at least 2-3 specific habitat types, e.g. 'Deep-sea hydrothermal vents', 'Coral reefs', 'Tropical rainforest canopy'"],
    "diet": "Herbivore" | "Carnivore" | "Omnivore" | "Detritivore" | "Filter Feeder" | "Scavenger" | "Planktivore",
    "activityPattern": "Diurnal" | "Nocturnal" | "Crepuscular" | "Cathemeral",
    "continents": ["list ALL continents/oceans where this species is found"],
    "conservationStatus": "Least Concern" | "Near Threatened" | "Vulnerable" | "Endangered" | "Critically Endangered" | "Extinct" | "Data Deficient",
    "size": {
      "lengthCm": number (REQUIRED, estimate from related species if exact data unavailable),
      "heightCm": number | null,
      "wingspanCm": number | null
    },
    "weightKg": number (REQUIRED, estimate from family averages if unknown)
  }`;

  const prompt = `You are a world-class zoologist and naturalist. Provide comprehensive natural history data for the species:
Common name: '${animal.commonName}'
Scientific name: '${animal.scientificName}'
Classification: ${animal.classification.kingdom} > ${animal.classification.phylum} > ${animal.classification.className} > ${animal.classification.order} > ${animal.classification.family} > ${animal.classification.genus}

CRITICAL RULES:
1. You MUST respond ONLY with a raw, valid JSON object. No markdown, no explanations, no code blocks.
2. NEVER use "Unknown" for ANY field. You are a zoologist — resolve and fill in all classification levels (kingdom, phylum, className, order, family, genus, species) with correct scientific names if they are currently 'Unknown'.
3. For numeric fields (lifespan, weight, size), ALWAYS provide a number. If exact data is unavailable, estimate based on the average for the family or order. For example, if a specific shrimp species' weight is unknown, use the typical weight range for shrimp in that family.
4. For "diet", choose the most accurate option. Many marine invertebrates are "Filter Feeder" or "Detritivore", not just "Carnivore/Herbivore/Omnivore".
5. For "activityPattern", estimate based on the ecology of the species. Deep-sea species are typically "Cathemeral", nocturnal hunters are "Nocturnal", etc.
6. For "conservationStatus", use "Data Deficient" instead of "Unknown" when the IUCN hasn't assessed the species.
7. "coolFacts" MUST have exactly 5 specific, unique, interesting facts about THIS species. Never use generic facts.
8. "habitat" must list at least 2 specific habitat types (not just "Ocean" — say "Deep-sea glass sponge reefs" or "Indo-Pacific coral reefs").
9. "continents" must list the actual continents/ocean basins. Use "Oceans" for pelagic/deep-sea species, and specify which oceans in the habitat field.
10. All string values MUST be in double quotes.

Schema:
${schema}

Example (for Panthera leo):
{
  "classification": {
    "kingdom": "Animalia",
    "phylum": "Chordata",
    "className": "Mammalia",
    "order": "Carnivora",
    "family": "Felidae",
    "genus": "Panthera",
    "species": "leo"
  },
  "averageLifespanYears": 15,
  "shortDescription": "The lion is the only truly social cat, forming prides of up to 30 individuals across African savannas and the Gir Forest of India.",
  "detailedDescription": "The lion (Panthera leo) is a muscular, deep-chested cat with a short, rounded head, reduced neck, and round ears. Males are distinguished by their thick mane, which protects the neck during fights. Lions are apex predators that hunt cooperatively, primarily targeting large ungulates like zebra, wildebeest, and buffalo. They are the most social of all wild cats, living in prides consisting of related females, their cubs, and a coalition of males. Lions spend 16-20 hours per day resting and are most active at dusk and dawn.",
  "coolFacts": [
    "A lion's roar can be heard from 8 kilometers (5 miles) away, the loudest of any big cat.",
    "Female lions do 85-90% of the hunting for the pride.",
    "Lion cubs are born with rosette spots that fade as they mature.",
    "Lions can sprint at speeds up to 80 km/h but only in short bursts.",
    "The Barbary lion of North Africa went extinct in the wild in the 1920s but survives in captive breeding programs."
  ],
  "habitat": ["African savanna", "Semi-arid grasslands", "Dry deciduous forest"],
  "diet": "Carnivore",
  "activityPattern": "Crepuscular",
  "continents": ["Africa", "Asia"],
  "conservationStatus": "Vulnerable",
  "size": { "lengthCm": 250, "heightCm": 120, "wingspanCm": null },
  "weightKg": 190
}`;

  const response = await askNaturalist({
    question: prompt,
    history: [],
    apiKey: settings.groqApiKey,
    model: settings.aiModel,
  });

  try {
    let text = response.answer.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
      text = text.replace(/\s*```$/, "");
    }
    const data = JSON.parse(text.trim());

    // Search for real YouTube videos in parallel (don't block on this)
    const videosPromise = searchSpeciesVideos(animal.commonName, animal.scientificName);

    const result: Animal = {
      ...animal,
      classification: {
        kingdom: data.classification?.kingdom ?? animal.classification.kingdom,
        phylum: data.classification?.phylum ?? animal.classification.phylum,
        className: data.classification?.className ?? animal.classification.className,
        order: data.classification?.order ?? animal.classification.order,
        family: data.classification?.family ?? animal.classification.family,
        genus: data.classification?.genus ?? animal.classification.genus,
        species: data.classification?.species ?? animal.classification.species,
      },
      averageLifespanYears: data.averageLifespanYears ?? animal.averageLifespanYears,
      shortDescription: data.shortDescription ?? animal.shortDescription,
      detailedDescription: data.detailedDescription ?? animal.detailedDescription,
      coolFacts: Array.isArray(data.coolFacts) && data.coolFacts.length > 0 ? data.coolFacts : animal.coolFacts,
      habitat: Array.isArray(data.habitat) && data.habitat.length > 0 ? data.habitat : animal.habitat,
      diet: data.diet ?? animal.diet,
      activityPattern: data.activityPattern ?? animal.activityPattern,
      continents: Array.isArray(data.continents) && data.continents.length > 0 ? data.continents : animal.continents,
      conservationStatus: data.conservationStatus ?? animal.conservationStatus,
      size: {
        ...animal.size,
        ...data.size,
      },
      weightKg: data.weightKg ?? animal.weightKg,
      partial: false,
      lastFetchedAt: new Date().toISOString(),
    };

    // Await YouTube video results and attach them
    try {
      const videos = await videosPromise;
      if (videos.length > 0) {
        result.videos = videos;
      }
    } catch (err) {
      console.debug("[ai-species] YouTube video search failed, continuing without videos", err);
    }

    return result;
  } catch (error) {
    reportError(`Failed to parse AI species hydration JSON for ${animal.commonName}`, error);
    throw error;
  }
}
