import { animalMap, animals } from "./animals";
import type { Continent } from "../types/animal";

export type BiomeIcon =
  | "savanna"
  | "rainforest"
  | "forest"
  | "mountain"
  | "desert"
  | "tundra"
  | "wetland"
  | "river"
  | "reef"
  | "kelp"
  | "ocean"
  | "coast";

export type Ecosystem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  climate: string;
  region: string;
  continents: Continent[];
  articleTitle: string;
  atlasLabel: string;
  icon: BiomeIcon;
  habitatFilters: string[];
  featuredSpeciesIds: string[];
  highlights: string[];
  fieldNotes: string[];
};

export const ecosystems: Ecosystem[] = [
  {
    id: "african-savanna",
    title: "African Savanna",
    subtitle: "Fire-shaped grassland mosaics with open canopies and migratory grazers.",
    description: "Savannas balance grasses, scattered trees, seasonal rains, and heavy herbivory. Their food webs are driven by movement, visibility, and pulse productivity.",
    climate: "Warm tropical grassland with wet and dry seasons",
    region: "East and Southern Africa",
    continents: ["Africa"],
    articleTitle: "Savanna",
    atlasLabel: "Grassland Frontier",
    icon: "savanna",
    habitatFilters: ["Savannah", "Grassland", "Open Woodland", "Dry Woodland"],
    featuredSpeciesIds: ["african-lion", "african-elephant", "giraffe", "cheetah"],
    highlights: ["Seasonal rainfall", "Frequent fire", "Long-distance herbivore movement"],
    fieldNotes: ["Open sightlines favor pursuit predators.", "Tree cover arrives in patches, not continuous canopy."],
  },
  {
    id: "tropical-rainforest",
    title: "Tropical Rainforest",
    subtitle: "Layered evergreen forest with dense canopy and extreme species richness.",
    description: "Humid equatorial forests concentrate productivity across canopy, understory, and floodplain systems, supporting highly specialized niches.",
    climate: "Hot, humid, high rainfall year-round",
    region: "Amazonia, Congo, Southeast Asia",
    continents: ["Africa", "Asia", "South America"],
    articleTitle: "Tropical rainforest",
    atlasLabel: "Canopy Basin",
    icon: "rainforest",
    habitatFilters: ["Rainforest", "Wetland", "Mangrove"],
    featuredSpeciesIds: ["bengal-tiger", "poison-dart-frog", "capybara"],
    highlights: ["Dense canopy stratification", "High humidity", "Explosive biodiversity"],
    fieldNotes: ["Moisture stability supports amphibians and epiphytes.", "River corridors restructure movement through dense forest."],
  },
  {
    id: "temperate-forest",
    title: "Temperate Forest",
    subtitle: "Seasonal woodland with layered understory and broadleaf-to-conifer transitions.",
    description: "Temperate forests are shaped by rainfall, winter chill, and seasonal resource pulses, often supporting wide-ranging mammals and migratory birds.",
    climate: "Cool winters, moist growing seasons",
    region: "North America, Europe, East Asia",
    continents: ["Asia", "Europe", "North America"],
    articleTitle: "Temperate deciduous forest",
    atlasLabel: "Seasonal Forests",
    icon: "forest",
    habitatFilters: ["Forest", "Temperate Forest", "Wetland"],
    featuredSpeciesIds: ["gray-wolf", "red-fox", "bald-eagle", "red-panda"],
    highlights: ["Strong seasonality", "Mast years", "Mixed canopy structure"],
    fieldNotes: ["Seasonal cover changes alter hunting and visibility.", "Large predators depend on corridor continuity."],
  },
  {
    id: "taiga",
    title: "Taiga",
    subtitle: "Conifer-dominated boreal forest stretched across the northern high latitudes.",
    description: "The boreal forest is cold, acidic, and expansive, storing vast carbon while supporting migratory birds, wolves, and northern herbivores.",
    climate: "Long cold winters, short mild summers",
    region: "Canada, Alaska, Scandinavia, Siberia",
    continents: ["Europe", "Asia", "North America"],
    articleTitle: "Taiga",
    atlasLabel: "Boreal Belt",
    icon: "forest",
    habitatFilters: ["Forest", "Tundra", "Mountain"],
    featuredSpeciesIds: ["gray-wolf", "red-fox"],
    highlights: ["Conifer dominance", "Peaty soils", "Short summer burst"],
    fieldNotes: ["Snow cover changes predator-prey movement.", "Large intact blocks matter more than edge habitat."],
  },
  {
    id: "alpine",
    title: "Alpine Highlands",
    subtitle: "Cold, steep, high-elevation terrain above the treeline.",
    description: "Alpine systems combine elevation, thin air, cold, and isolation, producing compressed seasons and habitat specialists.",
    climate: "Cold mountain climate with sharp elevation gradients",
    region: "Himalaya, Andes, Rockies, Alps",
    continents: ["Asia", "Europe", "North America", "South America"],
    articleTitle: "Alpine tundra",
    atlasLabel: "Highland Range",
    icon: "mountain",
    habitatFilters: ["Mountain", "Alpine", "Temperate Forest"],
    featuredSpeciesIds: ["snow-leopard", "red-panda", "gray-wolf"],
    highlights: ["Treeline transition", "Thin air", "Topographic isolation"],
    fieldNotes: ["Short growing seasons compress food availability.", "Terrain creates refuge-driven predator strategies."],
  },
  {
    id: "desert",
    title: "Desert",
    subtitle: "Arid landscapes where water scarcity sets the rules.",
    description: "Deserts range from hot sand seas to cold continental basins, but all are defined by limited precipitation and strong thermal stress.",
    climate: "Arid to hyper-arid with sharp temperature swings",
    region: "Sahara, Gobi, Namib, Atacama",
    continents: ["Africa", "Asia", "Australia", "North America", "South America"],
    articleTitle: "Desert",
    atlasLabel: "Dryland Expanse",
    icon: "desert",
    habitatFilters: ["Desert", "Cold Desert", "Dry Forest", "Dry Woodland"],
    featuredSpeciesIds: ["komodo-dragon", "snow-leopard", "cheetah"],
    highlights: ["Water stress", "Sparse cover", "Strong thermal gradients"],
    fieldNotes: ["Night-day temperature swings shape behavior.", "Patchy productivity creates hotspot feeding grounds."],
  },
  {
    id: "mediterranean-scrub",
    title: "Mediterranean Scrub",
    subtitle: "Dry-summer shrublands shaped by drought, browsing, and recurrent fire.",
    description: "Mediterranean-type ecosystems feature low woody vegetation, bright open structure, and strong adaptation to seasonal drought and burn cycles.",
    climate: "Mild wet winters, hot dry summers",
    region: "Mediterranean Basin, California, Chile, Cape, SW Australia",
    continents: ["Africa", "Australia", "Europe", "North America", "South America"],
    articleTitle: "Chaparral",
    atlasLabel: "Sclerophyll Belt",
    icon: "coast",
    habitatFilters: ["Grassland", "Dry Woodland", "Coast"],
    featuredSpeciesIds: ["red-fox", "peregrine-falcon"],
    highlights: ["Dry summer stress", "Shrub dominance", "Fire adaptation"],
    fieldNotes: ["Open shrub structure supports ambush and scan-hunt tactics.", "Seasonal drought limits sustained surface water."],
  },
  {
    id: "freshwater-wetland",
    title: "Freshwater Wetland",
    subtitle: "Slow-water marsh, swamp, bog, and floodplain habitat rich in edges.",
    description: "Wetlands mix standing water, emergent vegetation, nutrient retention, and nursery habitat, making them disproportionately important for biodiversity.",
    climate: "Hydrology-driven rather than single-climate limited",
    region: "Global inland lowlands",
    continents: ["Africa", "Asia", "Europe", "North America", "South America", "Australia"],
    articleTitle: "Swamp",
    atlasLabel: "Marsh Mosaic",
    icon: "wetland",
    habitatFilters: ["Wetland", "Freshwater Lake", "Estuary"],
    featuredSpeciesIds: ["capybara", "axolotl", "bald-eagle"],
    highlights: ["High edge complexity", "Nursery habitat", "Strong nutrient cycling"],
    fieldNotes: ["Wetland margins are often the richest movement corridors.", "Water depth and seasonality matter as much as region."],
  },
  {
    id: "river-floodplain",
    title: "River Floodplain",
    subtitle: "Dynamic freshwater corridors with seasonal flood pulses.",
    description: "Floodplain systems constantly rewrite habitat shape through flow, sediment, and overbank water, supporting migratory feeding and spawning cycles.",
    climate: "Flow-regulated freshwater system",
    region: "Major river basins worldwide",
    continents: ["Africa", "Asia", "Europe", "North America", "South America", "Australia"],
    articleTitle: "River",
    atlasLabel: "Pulse Corridor",
    icon: "river",
    habitatFilters: ["Wetland", "Freshwater Lake", "Grassland"],
    featuredSpeciesIds: ["capybara", "axolotl"],
    highlights: ["Seasonal inundation", "Sediment renewal", "Migration corridors"],
    fieldNotes: ["Flood timing can matter more than total rainfall.", "Edge habitats shift year to year."],
  },
  {
    id: "mangrove",
    title: "Mangrove Coast",
    subtitle: "Salt-tolerant tidal forest where roots, mud, and nurseries meet.",
    description: "Mangroves stabilize coasts, buffer storms, and form critical nursery habitat between terrestrial and marine systems.",
    climate: "Warm tropical intertidal",
    region: "Tropical coasts and estuaries",
    continents: ["Africa", "Asia", "Australia", "North America", "South America"],
    articleTitle: "Mangrove",
    atlasLabel: "Tidal Forest",
    icon: "coast",
    habitatFilters: ["Mangrove", "Coast", "Estuary", "Ocean"],
    featuredSpeciesIds: ["bengal-tiger", "bottlenose-dolphin", "green-sea-turtle"],
    highlights: ["Intertidal roots", "Brackish nurseries", "Storm buffering"],
    fieldNotes: ["Root tangles create refuge for juveniles.", "Salinity and tidal exposure decide zone boundaries."],
  },
  {
    id: "estuary",
    title: "Estuary",
    subtitle: "Mixing zones where rivers meet the sea and salinity gradients create layered habitat.",
    description: "Estuaries are productive transition zones with tidal exchange, mudflats, seagrass, and nursery pathways for fish, birds, and marine mammals.",
    climate: "Brackish coastal transition",
    region: "River mouths worldwide",
    continents: ["Africa", "Asia", "Europe", "North America", "South America", "Australia"],
    articleTitle: "Estuary",
    atlasLabel: "Brackish Gate",
    icon: "coast",
    habitatFilters: ["Estuary", "Coast", "Ocean", "Wetland"],
    featuredSpeciesIds: ["bottlenose-dolphin", "green-sea-turtle"],
    highlights: ["Salinity gradient", "Nursery waters", "Tidal exchange"],
    fieldNotes: ["Estuaries are transition habitats, not just coastal endpoints.", "Species use them as feeding and staging areas."],
  },
  {
    id: "seagrass",
    title: "Seagrass Meadow",
    subtitle: "Shallow marine grasslands that store carbon and shelter grazers.",
    description: "Seagrass beds are productive nearshore systems that stabilize sediments, trap carbon, and support juvenile fish, turtles, and invertebrates.",
    climate: "Shallow sunlit coastal marine waters",
    region: "Warm and temperate coasts",
    continents: ["Africa", "Asia", "Australia", "North America", "South America", "Oceans"],
    articleTitle: "Seagrass meadow",
    atlasLabel: "Blue Prairie",
    icon: "coast",
    habitatFilters: ["Seagrass Meadow", "Coast", "Ocean"],
    featuredSpeciesIds: ["green-sea-turtle", "bottlenose-dolphin"],
    highlights: ["Carbon storage", "Shallow nursery habitat", "Sediment stabilization"],
    fieldNotes: ["Water clarity controls meadow depth.", "Grazers and storms both reshape the canopy."],
  },
  {
    id: "coral-reef",
    title: "Coral Reef",
    subtitle: "Sunlit carbonate cities built by corals, algae, and reef communities.",
    description: "Reefs create three-dimensional habitat complexity that supports extremely dense marine biodiversity in warm clear waters.",
    climate: "Warm shallow tropical marine",
    region: "Tropical seas",
    continents: ["Africa", "Asia", "Australia", "North America", "South America", "Oceans"],
    articleTitle: "Coral reef",
    atlasLabel: "Reef Belt",
    icon: "reef",
    habitatFilters: ["Ocean", "Coast", "Seagrass Meadow", "Estuary"],
    featuredSpeciesIds: ["green-sea-turtle", "bottlenose-dolphin"],
    highlights: ["Structural complexity", "Clear warm water", "High species turnover"],
    fieldNotes: ["Reef edges and lagoons can host different food webs meters apart.", "Thermal stress events can transform the system rapidly."],
  },
  {
    id: "kelp-forest",
    title: "Kelp Forest",
    subtitle: "Cold coastal underwater forests driven by nutrient-rich currents.",
    description: "Kelp systems are vertical marine habitats with canopy, midwater, and seafloor structure, supporting fish, invertebrates, and marine mammals.",
    climate: "Cold temperate nutrient-rich coast",
    region: "Pacific rim and other cool coasts",
    continents: ["North America", "South America", "Asia", "Australia", "Oceans"],
    articleTitle: "Kelp forest",
    atlasLabel: "Subtidal Canopy",
    icon: "kelp",
    habitatFilters: ["Kelp Forest", "Ocean", "Coast"],
    featuredSpeciesIds: ["giant-pacific-octopus", "bottlenose-dolphin"],
    highlights: ["Wave energy", "Nutrient upwelling", "Vertical marine structure"],
    fieldNotes: ["Canopy density shifts with storms and urchin grazing.", "Cold currents drive productivity."],
  },
  {
    id: "open-ocean",
    title: "Open Ocean",
    subtitle: "Pelagic water columns where life follows light, depth, and migrating prey.",
    description: "The pelagic ocean is vast, mobile, and layered by depth, with species tracking temperature, prey density, and migration corridors.",
    climate: "Marine and current-driven across global basins",
    region: "Global pelagic waters",
    continents: ["Oceans"],
    articleTitle: "Ocean",
    atlasLabel: "Blue Expanse",
    icon: "ocean",
    habitatFilters: ["Ocean", "Open Sea"],
    featuredSpeciesIds: ["blue-whale", "bottlenose-dolphin", "green-sea-turtle"],
    highlights: ["Long migrations", "Depth layering", "Patchy productivity"],
    fieldNotes: ["The open ocean is structured by fronts and currents, not empty water.", "Feeding hotspots are transient but critical."],
  },
  {
    id: "deep-ocean",
    title: "Deep Ocean",
    subtitle: "Dark, high-pressure waters below the reach of sunlight.",
    description: "The deep ocean is a low-light, high-pressure environment where food often arrives as pulses from above or from localized chemosynthetic systems.",
    climate: "Cold, dark, high-pressure marine zone",
    region: "Aphotic global ocean",
    continents: ["Oceans"],
    articleTitle: "Hydrothermal vent",
    atlasLabel: "Abyssal Realm",
    icon: "ocean",
    habitatFilters: ["Ocean", "Open Sea"],
    featuredSpeciesIds: ["blue-whale", "giant-pacific-octopus"],
    highlights: ["Aphotic zone", "High pressure", "Slow nutrient delivery"],
    fieldNotes: ["Energy limitation shapes body plans and movement.", "Coastal shelf drops can connect shallow and deep faunas."],
  },
  {
    id: "tundra",
    title: "Tundra",
    subtitle: "Cold treeless landscapes with permafrost and short growing seasons.",
    description: "Tundra ecosystems are wind-exposed, low-stature, and highly seasonal, with productivity compressed into brief summers.",
    climate: "Polar or subpolar with long winters",
    region: "Arctic and subarctic margins",
    continents: ["Europe", "Asia", "North America", "Antarctica"],
    articleTitle: "Tundra",
    atlasLabel: "Ice Margin",
    icon: "tundra",
    habitatFilters: ["Tundra", "Arctic", "Ice Shelf", "Ocean"],
    featuredSpeciesIds: ["gray-wolf", "emperor-penguin"],
    highlights: ["Permafrost", "Low vegetation", "Brief summer pulse"],
    fieldNotes: ["Seasonality is more intense than habitat structure.", "Sea-ice linked tundra margins behave differently from inland plains."],
  },
  {
    id: "polar-sea-ice",
    title: "Polar Sea Ice",
    subtitle: "Seasonal ice platforms at the edge of the marine food web.",
    description: "Sea ice organizes light, algal blooms, predator access, and breeding platforms in both Arctic and Antarctic waters.",
    climate: "Polar marine with ice-season dynamics",
    region: "Arctic and Antarctic coasts",
    continents: ["Antarctica", "Oceans"],
    articleTitle: "Sea ice",
    atlasLabel: "Ice Shelf Edge",
    icon: "tundra",
    habitatFilters: ["Ice Shelf", "Ocean", "Arctic"],
    featuredSpeciesIds: ["emperor-penguin", "blue-whale"],
    highlights: ["Ice-edge blooms", "Breeding platforms", "Rapid seasonal retreat"],
    fieldNotes: ["Sea ice is habitat, not just weather.", "Breakup timing can decide breeding success."],
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

export function ecosystemsForContinent(continent: Continent) {
  return ecosystems.filter((ecosystem) => ecosystem.continents.includes(continent));
}

export function findMatchingEcosystem(animal: { id: string; habitat: string[]; continents: Continent[] }): Ecosystem {
  // 1. Direct match by featured species ID
  const directMatch = ecosystems.find((e) => e.featuredSpeciesIds.includes(animal.id));
  if (directMatch) return directMatch;

  // 2. Score by habitat and continent overlap
  let bestEcosystem = ecosystems[0];
  let maxScore = -1;

  const animalHabitats = (animal.habitat || []).map((h) => h.toLowerCase());
  const animalContinents = new Set(animal.continents || []);

  for (const eco of ecosystems) {
    let score = 0;

    // Habitat filter matches
    for (const hFilter of eco.habitatFilters) {
      const lowerFilter = hFilter.toLowerCase();
      for (const ah of animalHabitats) {
        if (ah === lowerFilter) {
          score += 4;
        } else if (ah.includes(lowerFilter) || lowerFilter.includes(ah)) {
          score += 2;
        }
      }
    }

    // Continent overlap matches
    for (const c of eco.continents) {
      if (animalContinents.has(c)) {
        score += 1.5;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestEcosystem = eco;
    }
  }

  return bestEcosystem;
}
