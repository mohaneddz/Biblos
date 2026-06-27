import { animalMap, animals } from "./animals";
import type { Continent } from "../types/animal";

export type Ecosystem = {
  id: string;
  title: string;
  description: string;
  climate: string;
  region: string;
  atlasLabel: string;
  continents: Continent[];
  habitatFilters: string[];
  featuredSpeciesIds: string[];
  imagePath: string;
};

export const ecosystems: Ecosystem[] = [
  {
    id: "african-savannah",
    title: "African Savannah",
    description: "Open grasslands and scattered woodland that sustain grazers, browsers, and fast-moving predators.",
    climate: "Warm tropical grassland with wet and dry seasons",
    region: "East and Southern Africa",
    atlasLabel: "Grassland Frontier",
    continents: ["Africa"],
    habitatFilters: ["Savannah", "Grassland", "Open Woodland", "Dry Woodland"],
    featuredSpeciesIds: ["african-lion", "african-elephant", "giraffe", "cheetah"],
    imagePath: "/images/biomes/african-savannah.svg",
  },
  {
    id: "amazon-rainforest",
    title: "Amazon Rainforest",
    description: "A layered equatorial forest where dense canopy, river corridors, and humid understory support extreme biodiversity.",
    climate: "Hot, humid equatorial rainforest",
    region: "Amazon Basin",
    atlasLabel: "Canopy Basin",
    continents: ["South America"],
    habitatFilters: ["Rainforest", "Wetland"],
    featuredSpeciesIds: ["poison-dart-frog", "capybara"],
    imagePath: "/images/biomes/amazon-rainforest.svg",
  },
  {
    id: "coral-reef",
    title: "Coral Reef",
    description: "Shallow sunlit seas built by corals, algae, and reef fish communities around structurally complex habitat.",
    climate: "Warm shallow tropical marine waters",
    region: "Tropical Coasts",
    atlasLabel: "Reef Belt",
    continents: ["Africa", "Asia", "Australia", "North America", "South America", "Oceans"],
    habitatFilters: ["Ocean", "Coast", "Seagrass Meadow", "Estuary"],
    featuredSpeciesIds: ["green-sea-turtle", "bottlenose-dolphin"],
    imagePath: "/images/biomes/coral-reef.svg",
  },
  {
    id: "arctic-tundra",
    title: "Arctic Tundra",
    description: "A cold, wind-shaped biome of sea ice margins, permafrost, and short-lived summer productivity.",
    climate: "Polar climate with long winters and short summers",
    region: "Polar Fringe",
    atlasLabel: "Ice Margin",
    continents: ["Antarctica", "North America", "Europe", "Asia"],
    habitatFilters: ["Tundra", "Arctic", "Ice Shelf", "Ocean"],
    featuredSpeciesIds: ["emperor-penguin", "gray-wolf"],
    imagePath: "/images/biomes/arctic-tundra.svg",
  },
  {
    id: "sahara-desert",
    title: "Sahara Desert",
    description: "An arid landscape of dunes, stone plains, and sparse vegetation where heat and water scarcity govern survival.",
    climate: "Extremely arid desert with severe day-night temperature swings",
    region: "North African Drylands",
    atlasLabel: "Dryland Expanse",
    continents: ["Africa"],
    habitatFilters: ["Desert", "Cold Desert", "Dry Woodland"],
    featuredSpeciesIds: ["cheetah", "snow-leopard"],
    imagePath: "/images/biomes/sahara-desert.svg",
  },
  {
    id: "deep-ocean",
    title: "Deep Ocean",
    description: "A dark, high-pressure marine realm where food arrives in pulses and mobility spans immense distances.",
    climate: "Cold, dark, high-pressure marine zone",
    region: "Pelagic and Deep Sea",
    atlasLabel: "Blue Expanse",
    continents: ["Oceans"],
    habitatFilters: ["Ocean", "Open Sea"],
    featuredSpeciesIds: ["blue-whale", "giant-pacific-octopus"],
    imagePath: "/images/biomes/deep-ocean.svg",
  },
  {
    id: "temperate-forest",
    title: "Temperate Forest",
    description: "Cooler mountain and broadleaf forests where seasonal change, dense understory, and canopy cover shape wildlife movement.",
    climate: "Temperate forest climate with cool winters and moist growing seasons",
    region: "Eastern Highlands",
    atlasLabel: "Seasonal Forests",
    continents: ["Asia", "Europe", "North America"],
    habitatFilters: ["Forest", "Temperate Forest", "Wetland"],
    featuredSpeciesIds: ["red-panda", "gray-wolf", "bald-eagle"],
    imagePath: "/images/biomes/temperate-forest.svg",
  },
  {
    id: "alpine-mountains",
    title: "Alpine Mountains",
    description: "High-elevation slopes and ridgelines where thin air, cold, and topographic isolation shape specialist fauna.",
    climate: "Cold mountain climate with strong elevation gradients",
    region: "Asian Highlands",
    atlasLabel: "Highland Range",
    continents: ["Asia"],
    habitatFilters: ["Mountain", "Alpine", "Temperate Forest"],
    featuredSpeciesIds: ["snow-leopard", "red-panda", "gray-wolf"],
    imagePath: "/images/biomes/alpine-mountains.svg",
  },
];

export function getEcosystemById(id: string) {
  return ecosystems.find((ecosystem) => ecosystem.id === id);
}

export function getEcosystemSpecies(ecosystem: Ecosystem) {
  return animals.filter((animal) => ecosystem.habitatFilters.some((habitat) => animal.habitat.includes(habitat)));
}

export function getFeaturedEcosystemSpecies(ecosystem: Ecosystem) {
  return ecosystem.featuredSpeciesIds
    .map((id) => animalMap.get(id))
    .filter((animal): animal is NonNullable<typeof animal> => Boolean(animal));
}
