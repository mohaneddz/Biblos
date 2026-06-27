import type { ActivityPattern, Animal, ConservationStatus, Continent } from "../types/animal";

export type AnimalSearchFilters = {
  query: string;
  className: string;
  habitat: string;
  diet: string;
  activityPattern: ActivityPattern | "";
  conservationStatus: ConservationStatus | "";
  continent: Continent | "";
};

function normalize(value: string) {
  return value.toLowerCase().trim();
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
    .toLowerCase();
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
  if (common.startsWith(q) || scientific.startsWith(q)) {
    return 60;
  }
  if (haystack.includes(q)) {
    return 20;
  }

  return 0;
}

export function searchAnimals(animals: Animal[], filters: AnimalSearchFilters) {
  const query = normalize(filters.query);

  return animals
    .filter((animal) => {
      if (query && !animalHaystack(animal).includes(query)) {
        return false;
      }
      if (filters.className && animal.classification.className !== filters.className) {
        return false;
      }
      if (filters.habitat && !animal.habitat.includes(filters.habitat)) {
        return false;
      }
      if (filters.diet && animal.diet !== filters.diet) {
        return false;
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
