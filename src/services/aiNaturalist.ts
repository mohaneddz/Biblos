import { invoke } from "@tauri-apps/api/core";
import { animals } from "../data/animals";
import { ecosystems } from "../data/ecosystems";
import { flattenTree, treeOfLife } from "../data/treeOfLife";
import type { Animal } from "../types/animal";
import { getSpeciesMedia } from "./speciesMedia";
import { getSettings } from "./cache";

export type NaturalistContextHit = {
  id: string;
  title: string;
  kind: "species" | "biome" | "taxonomy";
  score: number;
  excerpt: string;
  payload: string;
};

type NaturalistMessage = {
  role: "user" | "assistant";
  content: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

export type ChatSettings = {
  model: string;
  useLocal: boolean;
  useCached: boolean;
  useWebSearch: boolean;
  useImages: boolean;
  fontSize: "sm" | "base" | "lg" | "xl";
};

export function getChatSettings(): ChatSettings {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {
      model: "llama-3.3-70b-versatile",
      useLocal: true,
      useCached: true,
      useWebSearch: true,
      useImages: true,
      fontSize: "base",
    };
  }
  try {
    const raw = window.localStorage.getItem("biblos.chat-settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        model: parsed.model ?? "llama-3.3-70b-versatile",
        useLocal: parsed.useLocal ?? true,
        useCached: parsed.useCached ?? true,
        useWebSearch: parsed.useWebSearch ?? true,
        useImages: parsed.useImages ?? true,
        fontSize: parsed.fontSize ?? "base",
      };
    }
  } catch {
    // ignore
  }
  return {
    model: "llama-3.3-70b-versatile",
    useLocal: true,
    useCached: true,
    useWebSearch: true,
    useImages: true,
    fontSize: "base",
  };
}

function getDynamicCorpus(settings: ChatSettings): NaturalistContextHit[] {
  const cachedAnimalsMap = new Map<string, Animal>();
  if (settings.useCached && typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("biblos.species.")) {
        try {
          const cached = JSON.parse(window.localStorage.getItem(key) || "") as Animal;
          if (cached && cached.id) {
            cachedAnimalsMap.set(cached.id, cached);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Combine base animals with cached animals (cached version overrides static)
  const allAnimals = settings.useLocal ? [...animals] : [];
  const combinedAnimals = allAnimals.map(a => cachedAnimalsMap.get(a.id) ?? a);
  const staticIds = new Set(allAnimals.map(a => a.id));
  
  if (settings.useCached) {
    for (const [id, cached] of cachedAnimalsMap.entries()) {
      if (!staticIds.has(id)) {
        combinedAnimals.push(cached);
      }
    }
  }

  return [
    ...combinedAnimals.map((animal) => ({
      id: animal.id,
      title: animal.commonName,
      kind: "species" as const,
      score: 0,
      excerpt: `${animal.commonName} (${animal.scientificName}) • ${animal.conservationStatus} • ${animal.habitat.join(", ")}`,
      payload: [
        `Species: ${animal.commonName} (${animal.scientificName})`,
        `Taxonomy: ${animal.classification.kingdom} > ${animal.classification.phylum} > ${animal.classification.className} > ${animal.classification.order} > ${animal.classification.family} > ${animal.classification.genus} > ${animal.classification.species}`,
        `Summary: ${animal.shortDescription}`,
        `Detail: ${animal.detailedDescription}`,
        `Habitats: ${animal.habitat.join(", ")}`,
        `Diet: ${animal.diet}`,
        `Activity: ${animal.activityPattern}`,
        `Continents: ${animal.continents.join(", ")}`,
        `Conservation: ${animal.conservationStatus}`,
        `Facts: ${animal.coolFacts.join(" ")}`,
        settings.useImages && animal.images && animal.images.length > 0
          ? `Images: ${animal.images.join(", ")}`
          : ""
      ].filter(Boolean).join("\n"),
    })),
    ...ecosystems.map((ecosystem) => ({
      id: ecosystem.id,
      title: ecosystem.title,
      kind: "biome" as const,
      score: 0,
      excerpt: `${ecosystem.title} • ${ecosystem.climate} • ${ecosystem.region}`,
      payload: [
        `Biome: ${ecosystem.title}`,
        `Subtitle: ${ecosystem.subtitle}`,
        `Climate: ${ecosystem.climate}`,
        `Region: ${ecosystem.region}`,
        `Description: ${ecosystem.description}`,
        `Highlights: ${ecosystem.highlights.join(", ")}`,
        `Field notes: ${ecosystem.fieldNotes.join(" ")}`,
        `Habitat keys: ${ecosystem.habitatFilters.join(", ")}`,
      ].join("\n"),
    })),
    ...flattenTree(treeOfLife)
      .filter((node) => node.id !== "life")
      .map((node) => ({
        id: node.id,
        title: node.label,
        kind: "taxonomy" as const,
        score: 0,
        excerpt: `${node.rank} • ${node.description}`,
        payload: [`Taxon: ${node.label}`, `Rank: ${node.rank}`, `Description: ${node.description}`].join("\n"),
      })),
  ];
}

async function searchWikipediaSummary(query: string): Promise<{ title: string; extract: string; pageUrl?: string; thumbnailUrl?: string } | null> {
  try {
    // 1. Search Wikipedia for the term
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const topResult = searchData.query?.search?.[0];
    if (!topResult) return null;

    const title = topResult.title;

    // 2. Fetch page summary for the top result
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;
    const summaryData = await summaryRes.json();

    return {
      title: summaryData.title ?? title,
      extract: summaryData.extract ?? "",
      pageUrl: summaryData.content_urls?.desktop?.page,
      thumbnailUrl: summaryData.thumbnail?.source,
    };
  } catch (err) {
    console.warn("Wikipedia lookup failed:", err);
    return null;
  }
}

function scoreHit(query: string, hit: NaturalistContextHit) {
  const q = normalize(query);
  const title = normalize(hit.title);
  const payload = normalize(hit.payload);
  const titleTokens = tokenSet(hit.title);
  const queryTokens = tokenSet(query);

  let score = 0;
  if (title === q) {
    score += 60;
  }
  if (title.includes(q) && q.length > 2) {
    score += 30;
  }
  if (payload.includes(q) && q.length > 2) {
    score += 18;
  }
  for (const token of queryTokens) {
    if (titleTokens.has(token)) {
      score += 8;
    }
    if (payload.includes(token)) {
      score += 3;
    }
  }
  if (hit.kind === "species" && /(compare|habitat|status|diet|class|family|species|animal)/.test(q)) {
    score += 3;
  }
  if (hit.kind === "biome" && /(biome|ecosystem|forest|reef|wetland|desert|ocean|savanna|tundra)/.test(q)) {
    score += 3;
  }

  return score;
}

export function retrieveNaturalistContext(query: string, limit = 6) {
  const settings = getChatSettings();
  const dynamicCorpus = getDynamicCorpus(settings);
  return dynamicCorpus
    .map((hit) => ({ ...hit, score: scoreHit(query, hit) }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export async function askNaturalist(params: {
  question: string;
  history: NaturalistMessage[];
  apiKey?: string;
  model?: string;
  extraContext?: string;
}) {
  const settings = getChatSettings();
  const corpusHits = retrieveNaturalistContext(params.question);
  let contextHits = corpusHits;

  // Check if we have any high-scoring species match in our database
  const hasHighScoringSpecies = corpusHits.some(hit => hit.kind === "species" && hit.score >= 20);

  if (settings.useWebSearch && !hasHighScoringSpecies) {
    // Attempt online search fallback
    const cleanQuery = params.question
      .replace(/^(what is|tell me about|who is|explain|what are|search|find|does anyone know about|tell me about the)\s+/i, "")
      .replace(/\?+$/, "")
      .trim();

    if (cleanQuery.length > 2) {
      const wikiData = await searchWikipediaSummary(cleanQuery);
      if (wikiData && wikiData.extract) {
        const wikiHit: NaturalistContextHit = {
          id: `wiki-${normalize(wikiData.title)}`,
          title: wikiData.title,
          kind: "species",
          score: 50,
          excerpt: wikiData.extract.slice(0, 150) + "...",
          payload: `Source: Wikipedia (${wikiData.pageUrl || ""})\nTopic: ${wikiData.title}\nSummary: ${wikiData.extract}${
            settings.useImages && wikiData.thumbnailUrl ? `\nImage: ${wikiData.thumbnailUrl}` : ""
          }`,
        };
        // Put Wikipedia search hit first in the context
        contextHits = [wikiHit, ...contextHits];
      }
    }
  }

  // For any species hits in the context, dynamically resolve their primary image and append to payload if they don't have one
  if (settings.useImages) {
    await Promise.all(
      contextHits.map(async (hit) => {
        if (hit.kind === "species" && !hit.payload.includes("Images:") && !hit.payload.includes("Image:")) {
          const animal = animals.find(a => a.id === hit.id) ||
                         animals.find(a => a.commonName.toLowerCase() === hit.title.toLowerCase());
          if (animal) {
            try {
              const mediaBundle = await getSpeciesMedia(animal, "primary");
              if (mediaBundle && mediaBundle.primary) {
                hit.payload = `${hit.payload}\nImages: ${mediaBundle.primary.url}`;
              }
            } catch (err) {
              console.warn("Failed to retrieve media for", animal.commonName, err);
            }
          }
        }
      })
    );
  }

  // Instruct LLM to render images from the reference background, one per species/subject discussed
  const imageInstruction = settings.useImages
    ? "System Instruction: If the reference background contains valid image URLs (e.g. 'Image: https://...' or 'Images: https://...'), embed an image for EACH species or subject discussed using markdown: ![Species Name](URL). Place each image directly under that species' heading section. Only embed images directly relevant to the subject. Do not hallucinate external image links. NEVER mention 'context', 'provided data', or 'system instructions' in your answer."
    : "System Instruction: DO NOT display or embed any images in your response.";

  const followupInstruction = "System Instruction: At the very end of your response, you must propose exactly 3 natural, specific follow-up questions that the user might want to ask next based on your answer. Format them exactly like this:\n[FOLLOWUP]\n1. First question?\n2. Second question?\n3. Third question?";

  let context = contextHits.map((hit) => `[${hit.kind.toUpperCase()}] ${hit.payload}`).join("\n\n");
  context = `${imageInstruction}\n\n${followupInstruction}\n\n${context}`;

  if (params.extraContext) {
    context = `${params.extraContext}\n\n${context}`;
  }

  const selectedModel = params.model?.trim() || settings.model.trim();

  const answer = await invoke<string>("ask_ai_naturalist", {
    question: params.question,
    history: params.history,
    context,
    groqApiKey: params.apiKey?.trim() || null,
    model: selectedModel || null,
  });

  return { answer, contextHits };
}

export async function generateComparisonSummary(left: Animal, right: Animal) {
  const settings = getSettings();
  
  const leftContext = [
    `Species: ${left.commonName} (${left.scientificName})`,
    `Taxonomy: ${left.classification.kingdom} > ${left.classification.phylum} > ${left.classification.className} > ${left.classification.order} > ${left.classification.family} > ${left.classification.genus} > ${left.classification.species}`,
    `Summary: ${left.shortDescription}`,
    `Detail: ${left.detailedDescription}`,
    `Habitats: ${left.habitat.join(", ")}`,
    `Diet: ${left.diet}`,
    `Activity: ${left.activityPattern}`,
    `Continents: ${left.continents.join(", ")}`,
    `Conservation: ${left.conservationStatus}`,
    `Facts: ${left.coolFacts.join(" ")}`,
  ].join("\n");

  const rightContext = [
    `Species: ${right.commonName} (${right.scientificName})`,
    `Taxonomy: ${right.classification.kingdom} > ${right.classification.phylum} > ${right.classification.className} > ${right.classification.order} > ${right.classification.family} > ${right.classification.genus} > ${right.classification.species}`,
    `Summary: ${right.shortDescription}`,
    `Detail: ${right.detailedDescription}`,
    `Habitats: ${right.habitat.join(", ")}`,
    `Diet: ${right.diet}`,
    `Activity: ${right.activityPattern}`,
    `Continents: ${right.continents.join(", ")}`,
    `Conservation: ${right.conservationStatus}`,
    `Facts: ${right.coolFacts.join(" ")}`,
  ].join("\n");

  const question = `Compare the ${left.commonName} and ${right.commonName} based on the provided ecological, taxonomic, and behavioral data. Produce an engaging, deep comparative analysis.`;

  const context = `System Instruction: Compare the two species in an interesting, deeply scientific, and engaging way. Focus on physical adaptations, evolutionary divergence (Tree of Life differences), dietary strategies, and conservation. Make the writing style elegant and structured using markdown headings (##). Keep the comparative insights rich and educational.\n\n[SPECIES 1 DETAILS]\n${leftContext}\n\n[SPECIES 2 DETAILS]\n${rightContext}`;

  const selectedModel = settings.aiModel || "llama-3.3-70b-versatile";

  const answer = await invoke<string>("ask_ai_naturalist", {
    question,
    history: [],
    context,
    groqApiKey: settings.groqApiKey?.trim() || null,
    model: selectedModel || null,
  });

  return answer;
}
