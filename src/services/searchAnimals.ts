import type { ActivityPattern, Animal, ConservationStatus, Continent } from "../types/animal";

const CLASS_ALIASES: Record<string, string[]> = {
  reptilia: ["reptilia", "squamata", "testudines", "crocodylia"],
  archaea: ["archaea", "euryarchaeota", "thermoproteota", "asgardarchaeota", "halobacteria", "methanococci", "thermococci", "lokiarchaeia"],
  bacteria: ["bacteria", "pseudomonadota", "bacillota", "actinomycetota", "cyanobacteriota", "bacilli", "gammaproteobacteria", "alphaproteobacteria"],
  fungi: ["fungi", "ascomycota", "basidiomycota", "pezizomycetes", "agaricomycetes"],
  plantae: ["plantae", "bryophyta", "pteridophyta", "pinophyta", "magnoliophyta", "gymnosperms", "angiosperms"],
};

export type AnimalSearchFilters = {
  query: string;
  className: string;
  kingdom?: string;
  phylum?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  taxon?: string;
  habitat: string;
  diet: string;
  activityPattern: ActivityPattern | "";
  conservationStatus: ConservationStatus | "";
  continent: Continent | "";
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function animalHaystack(animal: Animal) {
  return [
    animal.commonName,
    animal.scientificName,
    animal.shortDescription,
    animal.detailedDescription,
    animal.habitat.join(" "),
    animal.diet,
    animal.continents.join(" "),
    animal.classification.kingdom,
    animal.classification.phylum,
    animal.classification.className,
    animal.classification.order,
    animal.classification.family,
    animal.classification.genus,
    animal.classification.species,
    animal.coolFacts.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreAnimal(animal: Animal, query: string) {
  if (!query) {
    return 0;
  }

  const q = normalize(query);
  const common = normalize(animal.commonName);
  const scientific = normalize(animal.scientificName);
  const haystack = animalHaystack(animal);

  if (common === q || scientific === q) {
    return 100;
  }

  // Head-noun match: query is the last word of the common name.
  // e.g. "Bengal Tiger" for query "tiger" → this animal IS a tiger.
  const words = common.split(/\s+/);
  if (words.length > 1 && words[words.length - 1] === q) {
    return 80;
  }

  if (common.startsWith(q) || scientific.startsWith(q)) {
    return 60;
  }

  // Query appears as a complete word somewhere in the name
  if (words.includes(q)) {
    return 50;
  }

  if (haystack.includes(q)) {
    return 20;
  }

  return 0;
}

export function searchAnimals(animals: Animal[], filters: AnimalSearchFilters) {
  const query = normalize(filters.query);
  const habitatFilter = filters.habitat ? normalize(filters.habitat) : "";
  const dietFilter = filters.diet ? normalize(filters.diet) : "";
  const classFilter = filters.className ? normalize(filters.className) : "";
  const taxonFilter = filters.taxon ? normalize(filters.taxon) : "";
  const taxonomyFilters = [
    ["kingdom", filters.kingdom],
    ["phylum", filters.phylum],
    ["className", filters.className],
    ["order", filters.order],
    ["family", filters.family],
    ["genus", filters.genus],
    ["species", filters.species],
  ] as const;

  return animals
    .filter((animal) => {
      if (query && !animalHaystack(animal).includes(query)) {
        return false;
      }
      // Fuzzy class & taxonomy match: check all taxonomy fields (kingdom, phylum, className, order, family, genus)
      if (classFilter) {
        const acceptedClasses = CLASS_ALIASES[classFilter] ?? [classFilter];
        const taxonomyValues = Object.values(animal.classification).filter(Boolean).map(normalize);
        const matchesClass = acceptedClasses.some((acceptedClass) =>
          taxonomyValues.some((val) => val.includes(acceptedClass) || acceptedClass.includes(val))
        );
        if (!matchesClass) return false;
      }
      for (const [key, value] of taxonomyFilters) {
        if (key === "className" || !value) continue;
        const taxonomyValue = normalize(animal.classification[key] || "");
        const taxonomyFilter = normalize(value);
        if (!taxonomyValue.includes(taxonomyFilter) && !taxonomyFilter.includes(taxonomyValue)) {
          // Also check across all taxonomy fields if exact key match fails
          const allTaxonomy = Object.values(animal.classification).filter(Boolean).map(normalize).join(" ");
          if (!allTaxonomy.includes(taxonomyFilter)) return false;
        }
      }
      if (taxonFilter) {
        const classification = Object.values(animal.classification).map(normalize).join(" ");
        if (!classification.includes(taxonFilter)) return false;
      }
      // Fuzzy habitat match: "forest" matches "Tropical rainforest canopy"
      if (habitatFilter) {
        const habitatHaystack = animal.habitat.map(normalize).join(" ");
        if (!habitatHaystack.includes(habitatFilter)) return false;
      }
      // Fuzzy diet match: "herb" matches "Herbivore"
      if (dietFilter) {
        if (!normalize(animal.diet).includes(dietFilter)) return false;
      }
      if (filters.activityPattern && animal.activityPattern !== filters.activityPattern) {
        return false;
      }
      if (filters.conservationStatus && animal.conservationStatus !== filters.conservationStatus) {
        return false;
      }
      if (filters.continent && !animal.continents.includes(filters.continent)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const scoreDiff = scoreAnimal(b, query) - scoreAnimal(a, query);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return a.commonName.localeCompare(b.commonName);
    });
}
