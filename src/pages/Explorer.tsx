import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { continents } from "../data/discovery";
import { animals } from "../data/animals";
import type { Continent } from "../types/animal";
import {
  AlertShieldIcon,
  BinocularsIcon,
  BirdIcon,
  BranchIcon,
  ChevronRightIcon,
  GlobeGridIcon,
  LeafClusterIcon,
  LeafIcon,
  MammalIcon,
  MarineIcon,
  MicrobeIcon,
  MoonIcon,
  MountainIcon,
  PawIcon,
  ReptileIcon,
  ShieldIcon,
  SunIcon,
  SunriseIcon,
  TreeLogoIcon,
} from "../components/icons";
import { getNodeCoverData } from "../data/classCovers";

// Curated visuals for Habitat Cards (High-definition Unsplash photography)
const HABITAT_CARDS = [
  {
    id: "tropical-rainforest",
    title: "Tropical Rainforest",
    link: "/ecosystems/tropical-rainforest",
    imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80",
    blurb: "Dense canopy layers, warm precipitation, and Earth's richest biodiversity hotspots.",
  },
  {
    id: "coral-reef",
    title: "Coral Reef",
    link: "/ecosystems/coral-reef",
    imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80",
    blurb: "Shallow, sunlit marine ecosystems supporting 25% of all ocean life.",
  },
  {
    id: "african-savanna",
    title: "African Savanna",
    link: "/ecosystems/african-savanna",
    imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    blurb: "Vast tropical grasslands defined by seasonal rain and megafauna migrations.",
  },
  {
    id: "deep-ocean",
    title: "Deep Ocean & Hydrothermal Vents",
    link: "/ecosystems/deep-ocean",
    imageUrl: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=800&q=80",
    blurb: "High-pressure, lightless abyss reliant on marine snow and chemosynthesis.",
  },
  {
    id: "temperate-forest",
    title: "Temperate Deciduous Forest",
    link: "/ecosystems/temperate-forest",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    blurb: "Four distinct seasons with broadleaf trees shedding foliage annually.",
  },
  {
    id: "desert",
    title: "Arid Desert",
    link: "/ecosystems/desert",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    blurb: "Extreme temperatures and scarce moisture with highly adapted specialists.",
  },
  {
    id: "freshwater-wetland",
    title: "Freshwater Wetlands & Rivers",
    link: "/ecosystems/freshwater-wetland",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    blurb: "Marshes, bogs, and river floodplains providing vital filtration and nurseries.",
  },
  {
    id: "mangrove",
    title: "Mangrove Coast",
    link: "/ecosystems/mangrove",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    blurb: "Salt-tolerant intertidal tidal forests with submerged prop roots protecting coastal nurseries.",
  },
  {
    id: "arctic-tundra",
    title: "Arctic Tundra",
    link: "/ecosystems/arctic-tundra",
    imageUrl: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
    blurb: "Treeless, frozen permafrost landscapes enduring extreme polar winters.",
  },
];

// Curated Classes for Lineage Cards
const CLASS_CARDS = [
  { id: "mammalia", label: "Mammalia", desc: "Mammals", icon: MammalIcon },
  { id: "aves", label: "Aves", desc: "Birds", icon: BirdIcon },
  { id: "reptilia", label: "Reptilia", desc: "Reptiles", icon: ReptileIcon },
  { id: "amphibia", label: "Amphibia", desc: "Amphibians", icon: LeafIcon },
  { id: "actinopterygii", label: "Actinopterygii", desc: "Ray-finned Fishes", icon: MarineIcon },
  { id: "insecta", label: "Insecta", desc: "Insects & Invertebrates", icon: BinocularsIcon },
  { id: "plantae", label: "Plantae", desc: "Plants & Flora", icon: LeafClusterIcon },
  { id: "fungi", label: "Fungi", desc: "Mushrooms & Yeasts", icon: TreeLogoIcon },
  { id: "bacteria", label: "Bacteria", desc: "Microbes & Prokaryotes", icon: MicrobeIcon },
  { id: "archaea", label: "Archaea", desc: "Extremophiles", icon: MicrobeIcon },
];

// Dietary Profile Cards with Photography & SVG Icons
const DIET_CARDS = [
  {
    key: "carnivore",
    label: "Carnivore",
    desc: "Meat-eaters & hunters",
    icon: PawIcon,
    imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "herbivore",
    label: "Herbivore",
    desc: "Plant-eaters & grazers",
    icon: LeafClusterIcon,
    imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "omnivore",
    label: "Omnivore",
    desc: "Versatile plant & meat feeders",
    icon: TreeLogoIcon,
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "insectivore",
    label: "Insectivore",
    desc: "Bug & small invertebrate specialists",
    icon: BinocularsIcon,
    imageUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "piscivore",
    label: "Piscivore",
    desc: "Fish-eating hunters",
    icon: MarineIcon,
    imageUrl: "https://images.unsplash.com/photo-1516683011827-46882a229ad5?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "filter feeder",
    label: "Filter Feeder",
    desc: "Marine plankton strainers",
    icon: GlobeGridIcon,
    imageUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "detritivore",
    label: "Detritivore",
    desc: "Soil recyclers & decomposers",
    icon: BranchIcon,
    imageUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "autotroph",
    label: "Autotroph",
    desc: "Photosynthetic plants & algae",
    icon: LeafIcon,
    imageUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
  },
];

// Conservation Status Cards with Photography & SVG Icons
const CONSERVATION_CARDS = [
  {
    key: "critically endangered",
    label: "Critically Endangered",
    desc: "Extremely high extinction risk",
    icon: AlertShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "endangered",
    label: "Endangered",
    desc: "High threat tier in the wild",
    icon: ShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "vulnerable",
    label: "Vulnerable",
    desc: "High risk unless threats cease",
    icon: ShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "near threatened",
    label: "Near Threatened",
    desc: "Close to qualifying for threat tier",
    icon: ShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "least concern",
    label: "Least Concern",
    desc: "Stable & widespread populations",
    icon: ShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "extinct",
    label: "Extinct",
    desc: "No remaining individuals",
    icon: ShieldIcon,
    imageUrl: "https://images.unsplash.com/photo-1569742918414-0498b584d412?auto=format&fit=crop&w=800&q=80",
  },
];

// Activity Pattern Cards with Photography & SVG Icons (No Emojis!)
const ACTIVITY_CARDS = [
  {
    key: "diurnal",
    label: "Diurnal",
    tag: "Daylight Active",
    desc: "Active during daylight hours",
    icon: SunIcon,
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "nocturnal",
    label: "Nocturnal",
    tag: "Night Active",
    desc: "Active under cover of night",
    icon: MoonIcon,
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "crepuscular",
    label: "Crepuscular",
    tag: "Twilight Active",
    desc: "Active during dawn and dusk",
    icon: SunriseIcon,
    imageUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=800&q=80",
  },
];

// Continent Regional Covers
const CONTINENT_COVERS: Record<string, string> = {
  Africa: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
  Asia: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  Europe: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "North America": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  "South America": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80",
  Australia: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
  Oceans: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  Antarctica: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CONTINENT_COUNTRIES: Record<string, Set<number>> = {
  Africa: new Set([12, 24, 72, 108, 120, 132, 140, 148, 174, 175, 178, 180, 204, 226, 231, 232, 260, 262, 266, 270, 288, 324, 384, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 624, 638, 646, 678, 686, 694, 706, 710, 716, 729, 732, 788, 800, 818, 834, 894]),
  Asia: new Set([4, 31, 48, 50, 64, 96, 104, 116, 142, 156, 158, 268, 356, 360, 364, 368, 376, 392, 398, 400, 408, 410, 414, 417, 418, 422, 458, 462, 496, 524, 512, 586, 608, 634, 643, 682, 702, 704, 760, 762, 764, 784, 792, 795, 860, 887]),
  Europe: new Set([8, 20, 40, 56, 70, 100, 112, 191, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 438, 440, 442, 470, 492, 498, 499, 528, 578, 616, 620, 642, 674, 688, 703, 705, 724, 752, 756, 804, 826]),
  "North America": new Set([28, 44, 52, 84, 124, 188, 192, 214, 222, 304, 308, 320, 332, 340, 388, 484, 558, 591, 659, 662, 670, 780, 840]),
  "South America": new Set([32, 68, 76, 152, 170, 218, 238, 254, 328, 600, 604, 740, 858, 862]),
  Australia: new Set([36, 90, 242, 540, 548, 554, 598, 882]),
  Antarctica: new Set([10]),
};

function getContinentForCountry(id: number | string): string | null {
  const num = typeof id === "string" ? parseInt(id, 10) : id;
  for (const [continent, set] of Object.entries(CONTINENT_COUNTRIES)) {
    if (set.has(num)) return continent;
  }
  return null;
}

const CONTINENT_STATS: Record<string, {
  name: string;
  tagline: string;
  keyHabitats: string[];
  iconicSpecies: string[];
}> = {
  Africa: {
    name: "Africa",
    tagline: "Vast tropical savannas, dense Congo basin rainforests, and the Sahara desert.",
    keyHabitats: ["African Savanna", "Tropical Rainforest", "Arid Desert", "Freshwater River"],
    iconicSpecies: ["African Elephant", "African Lion", "Cheetah", "Giraffe", "Gorilla"],
  },
  Asia: {
    name: "Asia",
    tagline: "Himalayan peaks, Siberian boreal forests, and Southeast Asian coral reefs.",
    keyHabitats: ["Himalayan Alpine", "Tropical Rainforest", "Steppe Grassland", "Coral Reef"],
    iconicSpecies: ["Bengal Tiger", "Giant Panda", "Snow Leopard", "Red Panda", "Komodo Dragon"],
  },
  Europe: {
    name: "Europe",
    tagline: "Temperate deciduous woodlands, Alpine meadows, and Mediterranean scrublands.",
    keyHabitats: ["Temperate Forest", "Alpine Meadow", "Mediterranean Basin", "Freshwater Wetland"],
    iconicSpecies: ["Grey Wolf", "Eurasian Lynx", "Brown Bear", "Red Fox", "Golden Eagle"],
  },
  "North America": {
    name: "North America",
    tagline: "Boreal evergreen forests, Great Plains grasslands, and Sonoran deserts.",
    keyHabitats: ["Temperate Deciduous Forest", "Arid Desert", "Great Plains", "Arctic Tundra"],
    iconicSpecies: ["Grizzly Bear", "Bald Eagle", "American Bison", "Cougar", "Monarch Butterfly"],
  },
  "South America": {
    name: "South America",
    tagline: "The Amazon rainforest canopy, Andes mountains, and Pantanal wetlands.",
    keyHabitats: ["Tropical Rainforest", "Pantanal Wetland", "Andean Alpine", "Atacama Desert"],
    iconicSpecies: ["Jaguar", "Capybara", "Green Anaconda", "Poison Dart Frog", "Harpy Eagle"],
  },
  Australia: {
    name: "Australia",
    tagline: "Outback deserts, Great Barrier Reef corals, and eucalyptus woodlands.",
    keyHabitats: ["Coral Reef", "Arid Outback", "Eucalyptus Forest", "Coastal Island"],
    iconicSpecies: ["Red Kangaroo", "Koala", "Platypus", "Whale Shark", "Tasmanian Devil"],
  },
  Antarctica: {
    name: "Antarctica",
    tagline: "Frozen polar ice sheets, sub-zero oceanic currents, and sea ice shelves.",
    keyHabitats: ["Polar Ice Cap", "Deep Ocean", "Sub-Antarctic Island", "Pelagic Sea"],
    iconicSpecies: ["Emperor Penguin", "Leopard Seal", "Blue Whale", "Adélie Penguin", "Snow Petrel"],
  },
};

export default function Explorer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedContinent = (searchParams.get("continent") as Continent | null) ?? "Africa";
  const continentSpecies = animals.filter((animal) => animal.continents.includes(selectedContinent));

  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);
  const activeContinentName = hoveredContinent ?? selectedContinent;
  const activeContinentStats = CONTINENT_STATS[activeContinentName] ?? null;
  const activeContinentSpeciesCount = animals.filter((animal) => animal.continents.includes(activeContinentName as Continent)).length;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biblos.header-collapsed.explorer") === "true";
    }
    return false;
  });

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("biblos.header-collapsed.explorer", String(next));
      return next;
    });
  };

  return (
    <div className="page-frame space-y-8">
      {/* Header Banner */}
      <section className="page-card overflow-hidden rounded-[2.2rem] p-6 md:p-8 shrink-0 relative bg-gradient-to-br from-[#0c1410] via-[#090f0c] to-[#040705] border border-white/12 shadow-2xl">
        <div className="flex flex-col justify-between min-w-0 relative z-10">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-app-accent/30 bg-app-accent/15 text-app-accent">
                  <BinocularsIcon className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="page-title select-none text-4xl md:text-5xl">Explorer Portal</h1>
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-app-soft mt-1">Ecosystems · Traits · Lineages · Regions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-app-soft hover:bg-white/[0.08] hover:text-white transition duration-200 cursor-pointer select-none"
                title={isCollapsed ? "Show description" : "Hide description"}
              >
                {isCollapsed ? "+" : "−"}
              </button>
            </div>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? "max-h-0 opacity-0 mt-0" : "max-h-[12rem] opacity-100 mt-4"
              }`}
            >
              <p className="page-lede text-app-muted max-w-3xl leading-7 text-sm md:text-base">
                Explorer is the organic discovery surface for Biblos. Jump into Earth's ecosystems, major taxonomic classes, dietary profiles, conservation tiers, circadian activity rhythms, and geographic regions.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/species" className="primary-button text-xs cursor-pointer select-none">
                  Open full directory (21,544 species)
                </Link>
                <Link to="/ecosystems" className="ghost-button text-xs cursor-pointer select-none">
                  All 15 Biomes
                </Link>
                <Link to="/tree" className="ghost-button text-xs cursor-pointer select-none">
                  Tree of Life
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Tiles Row */}
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-white/10 pt-5">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">21,544</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Indexed species</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">15</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Biomes & Habitats</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">8</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Kingdoms & Lineages</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">8</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Dietary Profiles</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">6</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Conservation Tiers</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-bold text-white">8</p>
            <p className="text-[10px] uppercase tracking-wider text-app-soft mt-0.5">Geographic Regions</p>
          </div>
        </div>
      </section>

      {/* SECTION 1: HABITATS & ECOSYSTEM CARDS GRID */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <MountainIcon className="h-5 w-5 text-app-accent" /> Ecosystems & Habitats
            </h2>
            <p className="mt-1 text-sm text-app-muted">Visual entry points into Earth's major ecological biomes and settings.</p>
          </div>
          <Link to="/ecosystems" className="ghost-button text-xs cursor-pointer">
            View all biomes <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HABITAT_CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.link}
              className="group relative flex flex-col justify-end overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#060a08] p-5 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-2xl hover:no-underline aspect-[4/3]"
            >
              <img
                src={card.imageUrl}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

              <div className="relative z-10 mt-auto">
                <h3 className="text-lg font-bold text-white group-hover:text-app-accent transition leading-snug drop-shadow-md">
                  {card.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-app-muted opacity-90 drop-shadow">
                  {card.blurb}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-app-accent group-hover:translate-x-1 transition">
                  Explore Ecosystem <ChevronRightIcon className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 2: TAXONOMIC CLASSES & DOMAINS */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <BranchIcon className="h-5 w-5 text-app-accent" /> Taxonomic Classes & Lineages
            </h2>
            <p className="mt-1 text-sm text-app-muted">Branch out by major body plans, evolutionary lineages, and biological domains.</p>
          </div>
          <Link to="/tree" className="ghost-button text-xs cursor-pointer">
            Explore Tree of Life <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {CLASS_CARDS.map((c) => {
            const cover = getNodeCoverData(c.id);
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                to={`/life-class/${c.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#060a08] p-4 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-xl hover:no-underline aspect-[3/4]"
              >
                <img
                  src={cover.heroUrl}
                  alt={c.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-base font-bold text-white group-hover:text-app-accent transition leading-tight drop-shadow-md">
                    {c.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-app-muted opacity-85">
                    {c.desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-[11px] font-medium text-app-soft">
                    <span>View Class</span>
                    <span className="text-app-accent group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: DIETARY PROFILES WITH BACKGROUND PHOTOGRAPHY */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <LeafClusterIcon className="h-5 w-5 text-app-accent" /> Dietary Profiles
            </h2>
            <p className="mt-1 text-sm text-app-muted">Explore species grouped by ecological feeding strategies and food webs.</p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {DIET_CARDS.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.key}
                to={`/explore/diet/${encodeURIComponent(d.key)}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#060a08] p-5 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-2xl hover:no-underline aspect-[4/3]"
              >
                <img
                  src={d.imageUrl}
                  alt={d.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-lg font-bold text-white group-hover:text-app-accent transition leading-snug drop-shadow-md">
                    {d.label}
                  </h3>
                  <p className="mt-1 text-xs text-app-muted leading-5 opacity-90 drop-shadow">
                    {d.desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-xs font-semibold text-app-accent">
                    <span>Explore {d.label} species</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: CONSERVATION STATUS TIER CARDS WITH BACKGROUND PHOTOGRAPHY */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <GlobeGridIcon className="h-5 w-5 text-app-accent" /> Conservation Status Tiers
            </h2>
            <p className="mt-1 text-sm text-app-muted">Focus immediately on extinction risk tiers and IUCN Red List categories.</p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {CONSERVATION_CARDS.map((status) => {
            const Icon = status.icon;
            return (
              <Link
                key={status.key}
                to={`/explore/status/${encodeURIComponent(status.key)}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#060a08] p-5 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-2xl hover:no-underline aspect-[16/9]"
              >
                <img
                  src={status.imageUrl}
                  alt={status.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-lg font-bold text-white group-hover:text-app-accent transition leading-snug drop-shadow-md">
                    {status.label}
                  </h3>
                  <p className="mt-1 text-xs text-app-muted leading-5 opacity-90 drop-shadow">
                    {status.desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2 text-xs font-semibold text-app-accent">
                    <span>View {status.label} species</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: ACTIVITY PATTERN RHYTHM CARDS WITH BACKGROUND PHOTOGRAPHY & SVG ICONS */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <BinocularsIcon className="h-5 w-5 text-app-accent" /> Activity Patterns & Circadian Rhythms
            </h2>
            <p className="mt-1 text-sm text-app-muted">Filter species by time of day activity patterns.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ACTIVITY_CARDS.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.key}
                to={`/explore/activity/${encodeURIComponent(act.key)}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#060a08] p-6 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-2xl hover:no-underline aspect-[16/10]"
              >
                <img
                  src={act.imageUrl}
                  alt={act.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-2xl font-bold text-white group-hover:text-app-accent transition drop-shadow-md">
                    {act.label}
                  </h3>
                  <p className="mt-1 text-xs text-app-muted leading-5 opacity-90 drop-shadow">
                    {act.desc}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs font-semibold text-app-accent">
                    <span>Browse {act.key} species</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: REGIONAL GEOGRAPHIC ATLAS WITH CONTINENT COVER PHOTOGRAPHY */}
      <section className="page-card rounded-[1.8rem] p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <GlobeGridIcon className="h-5 w-5 text-app-accent" /> Regional Geographic Atlas
            </h2>
            <p className="mt-1 text-sm leading-7 text-app-muted">
              Place-based browsing integrated directly into Explorer across Earth's continents and ocean basins.
            </p>
          </div>
          <Link to={`/species?continent=${encodeURIComponent(selectedContinent)}`} className="ghost-button text-xs cursor-pointer select-none">
            Open {selectedContinent} in directory
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {continents.map((continent) => {
            const coverUrl = CONTINENT_COVERS[continent] ?? CONTINENT_COVERS["Africa"];
            const isSelected = continent === selectedContinent;
            return (
              <button
                key={continent}
                type="button"
                onClick={() => setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("continent", continent);
                  return next;
                })}
                className={[
                  "group relative flex flex-col justify-between overflow-hidden rounded-[1.4rem] border p-4 text-left cursor-pointer transition duration-300 aspect-[16/10]",
                  isSelected ? "border-app-accent/60 ring-2 ring-app-accent/40" : "border-white/12 hover:border-app-accent/40",
                ].join(" ")}
              >
                <img
                  src={coverUrl}
                  alt={continent}
                  className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-35% to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                    <GlobeGridIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto">
                  <p className="text-lg font-bold text-white leading-tight drop-shadow-md group-hover:text-app-accent transition">{continent}</p>
                  <p className="text-xs text-app-muted mt-0.5 drop-shadow">
                    {animals.filter((animal) => animal.continents.includes(continent)).length} directory species
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Region Species Preview */}
        <div className="rounded-[1.6rem] border border-white/10 bg-black/50 p-5 mt-4">
          <div className="flex items-center gap-2.5 text-app-accent mb-2">
            <BirdIcon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Selected Geographic Region</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{selectedContinent}</h3>
          <p className="mt-1 text-xs text-app-muted">Featured species from {selectedContinent}:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {continentSpecies.slice(0, 20).map((animal) => (
              <Link key={animal.id} to={`/species/${animal.id}`} className="tag-chip interactive-chip">
                {animal.commonName}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: INTERACTIVE WORLD MAP EXPLORER */}
      <section className="page-card rounded-[2.2rem] p-6 md:p-8 space-y-6 overflow-hidden relative border border-white/12 bg-gradient-to-b from-[#09110c] via-[#060a08] to-[#040705] shadow-2xl">
        <div className="flex flex-wrap items-end justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 text-app-accent mb-1">
              <GlobeGridIcon className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Global Biogeography Map</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Interactive Continent Map</h2>
            <p className="mt-1 text-sm text-app-muted max-w-2xl">
              Hover over any continent to view live biogeographic stats and key species. Click a continent to jump directly into its regional species directory.
            </p>
          </div>
          {hoveredContinent && (
            <button
              type="button"
              onClick={() => navigate(`/species?continent=${encodeURIComponent(hoveredContinent)}`)}
              className="primary-button text-xs cursor-pointer select-none"
            >
              Explore {hoveredContinent} Directory <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Map Container + Tooltip Overlay Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border border-white/10 rounded-[1.8rem] bg-[#030604] p-4 md:p-6 overflow-hidden">
          {/* Map Surface (8 columns on lg) */}
          <div
            className="lg:col-span-8 relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#050b07] border border-white/8 flex items-center justify-center"
            onMouseLeave={() => setHoveredContinent(null)}
          >
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 105, center: [0, 20] }} className="h-full w-full">
              <ZoomableGroup zoom={1} maxZoom={4} minZoom={1}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties: Record<string, unknown> }> }) =>
                    geographies.map((geo) => {
                      const continent = getContinentForCountry(geo.id);
                      const isHovered = hoveredContinent === continent;
                      const isSelected = selectedContinent === continent;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            if (continent) setHoveredContinent(continent);
                          }}
                          onClick={() => {
                            if (continent) {
                              navigate(`/species?continent=${encodeURIComponent(continent)}`);
                            }
                          }}
                          style={{
                            default: {
                              fill: isHovered
                                ? "#ddbf87"
                                : isSelected
                                ? "#3b6b47"
                                : continent
                                ? "#122116"
                                : "#09120b",
                              stroke: isHovered ? "#fff8ed" : isSelected ? "#ddbf87" : "rgba(255,255,255,0.14)",
                              strokeWidth: isHovered || isSelected ? 1.2 : 0.4,
                              outline: "none",
                              transition: "all 200ms ease",
                            },
                            hover: {
                              fill: "#ddbf87",
                              stroke: "#fff8ed",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: continent ? "pointer" : "default",
                            },
                            pressed: {
                              fill: "#f0d39c",
                              stroke: "#ffffff",
                              strokeWidth: 1.5,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Hint tag on top of map */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[11px] text-app-soft flex items-center gap-2 pointer-events-none">
              <span className="h-2 w-2 rounded-full bg-app-accent animate-pulse" />
              Hover to preview stats · Click continent to view species
            </div>
          </div>

          {/* Continent Stats Panel (4 columns on lg) */}
          <div className="lg:col-span-4 h-full flex flex-col justify-between">
            {activeContinentStats ? (
              <div className="rounded-[1.5rem] border border-app-accent/30 bg-gradient-to-br from-[#0c1610] to-[#060b08] p-6 space-y-4 shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 h-32 w-32 bg-app-accent/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-app-accent">
                      Continent Stats
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-0.5">{activeContinentStats.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-app-accent/15 border border-app-accent/30 text-app-accent">
                    {activeContinentSpeciesCount} species
                  </span>
                </div>

                <p className="text-xs text-app-muted leading-5">
                  {activeContinentStats.tagline}
                </p>

                {/* Associated Habitats */}
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-app-soft mb-2">Key Biomes & Habitats</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeContinentStats.keyHabitats.map((hab) => (
                      <span key={hab} className="text-[10px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-white/90">
                        {hab}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Iconic Species */}
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-app-soft mb-2">Iconic Wildlife</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeContinentStats.iconicSpecies.map((sp) => (
                      <span key={sp} className="text-[10px] px-2.5 py-1 rounded-md bg-app-accent/10 border border-app-accent/25 text-app-accent font-medium">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/species?continent=${encodeURIComponent(activeContinentStats.name)}`)}
                  className="w-full mt-2 primary-button text-xs py-2.5 justify-center cursor-pointer select-none"
                >
                  Explore All {activeContinentStats.name} Species <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[20rem]">
                <GlobeGridIcon className="h-10 w-10 text-app-soft/60" />
                <h4 className="text-base font-semibold text-white">Select or Hover a Continent</h4>
                <p className="text-xs text-app-muted leading-5 max-w-xs">
                  Move your cursor over Africa, Asia, Europe, North America, South America, Australia, or Antarctica to display continent statistics.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
