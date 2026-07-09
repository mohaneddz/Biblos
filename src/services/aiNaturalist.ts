import { invoke } from "@tauri-apps/api/core";
import { animals } from "../data/animals";
import { ecosystems } from "../data/ecosystems";
import { flattenTree, treeOfLife } from "../data/treeOfLife";

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

const corpus: NaturalistContextHit[] = [
  ...animals.map((animal) => ({
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
    ].join("\n"),
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
  return corpus
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
  const contextHits = retrieveNaturalistContext(params.question);
  let context = contextHits.map((hit) => `[${hit.kind.toUpperCase()}] ${hit.payload}`).join("\n\n");

  if (params.extraContext) {
    context = `${params.extraContext}\n\n${context}`;
  }

  const answer = await invoke<string>("ask_ai_naturalist", {
    question: params.question,
    history: params.history,
    context,
    groqApiKey: params.apiKey?.trim() || null,
    model: params.model?.trim() || null,
  });

  return { answer, contextHits };
}
