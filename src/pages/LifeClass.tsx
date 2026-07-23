import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Link, useParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import { SpeciesImage } from "../components/SpeciesImage";
import {
  AmphibianIcon,
  BinocularsIcon,
  BirdIcon,
  BranchIcon,
  DotSpeciesIcon,
  FamilyIcon,
  FungiIcon,
  GlobeGridIcon,
  LeafClusterIcon,
  LeafIcon,
  MammalIcon,
  MarineIcon,
  MicrobeIcon,
  PawIcon,
  ReptileIcon,
  TreeLogoIcon,
} from "../components/icons";
import { animals } from "../data/animals";
import { getNodeCoverData } from "../data/classCovers";
import { findNodePath, findTreeNode, flattenTree, treeOfLife, type TreeNode } from "../data/treeOfLife";
import { getAllCachedSpecies, getHiddenSpecies } from "../services/cache";
import { previewAnimalFromHit, searchSpeciesLocal } from "../services/speciesStore";
import type { Animal } from "../types/animal";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CONTINENT_COUNTRIES: Record<string, Set<number>> = {
  Africa: new Set([12, 24, 72, 108, 120, 132, 140, 144, 148, 174, 175, 178, 180, 204, 226, 231, 232, 260, 262, 266, 270, 288, 324, 384, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 624, 638, 646, 678, 686, 694, 706, 710, 716, 729, 732, 788, 800, 818, 834, 894]),
  Asia: new Set([4, 31, 48, 50, 64, 96, 104, 116, 142, 156, 158, 268, 356, 360, 364, 368, 376, 392, 398, 400, 408, 410, 414, 417, 418, 422, 458, 462, 496, 524, 512, 586, 608, 634, 643, 682, 703, 704, 784, 760, 762, 764, 792, 860]),
  Europe: new Set([8, 20, 40, 56, 70, 100, 112, 191, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 438, 440, 442, 470, 492, 498, 499, 528, 578, 616, 620, 642, 688, 703, 705, 724, 752, 756, 804, 826]),
  "North America": new Set([28, 44, 52, 84, 124, 188, 192, 214, 222, 320, 332, 340, 388, 484, 558, 591, 659, 662, 670, 780]),
  "South America": new Set([32, 68, 76, 152, 170, 218, 328, 600, 604, 740, 858, 862]),
  Australia: new Set([36, 540, 548, 598]),
  Antarctica: new Set([10]),
};

const FAMOUS_IDS = [
  "african-lion", "bengal-tiger", "gray-wolf", "snow-leopard", "african-elephant",
  "bald-eagle", "peregrine-falcon", "emperor-penguin", "blue-whale", "giant-pacific-octopus",
  "red-panda", "komodo-dragon", "green-sea-turtle", "poison-dart-frog", "capybara",
];

const STATUS_OPTIONS = ["All", "Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered", "Extinct"];
const HABITAT_OPTIONS = ["All", "Ocean", "Rainforest", "Savannah", "Forest", "Desert", "Freshwater", "Arctic"];
const DIET_OPTIONS = ["All", "Carnivore", "Herbivore", "Omnivore", "Filter Feeder", "Detritivore"];

function nodeIcon(node: TreeNode) {
  const className = "h-4 w-4";
  switch (node.icon) {
    case "life":
      return <TreeLogoIcon className={className} />;
    case "microbe":
    case "archaea":
      return <MicrobeIcon className={className} />;
    case "leaf":
      return <LeafIcon className={className} />;
    case "fungi":
      return <FungiIcon className={className} />;
    case "animal":
    case "mammal":
      return <MammalIcon className={className} />;
    case "bird":
      return <BirdIcon className={className} />;
    case "reptile":
      return <ReptileIcon className={className} />;
    case "amphibian":
      return <AmphibianIcon className={className} />;
    case "marine":
      return <MarineIcon className={className} />;
    case "family":
      return <FamilyIcon className={className} />;
    case "genus":
      return <BranchIcon className={className} />;
    case "species":
      return <DotSpeciesIcon className={className} />;
    case "invertebrate":
      return <BinocularsIcon className={className} />;
    default:
      return <BranchIcon className={className} />;
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const TAXON_EQUIVALENTS: Record<string, string[]> = {
  metazoa: ["animalia", "animal", "animals", "metazoa"],
  animalia: ["animalia", "animal", "animals", "metazoa"],
  chordata: ["chordata", "chordate", "chordates", "vertebrata", "vertebrates"],
  mammalia: ["mammalia", "mammal", "mammals"],
  aves: ["aves", "bird", "birds"],
  reptilia: ["reptilia", "reptile", "reptiles"],
  amphibia: ["amphibia", "amphibian", "amphibians"],
  actinopterygii: ["actinopterygii", "fish", "fishes", "osteichthyes", "ray-finned fishes"],
  chondrichthyes: ["chondrichthyes", "cartilaginous fishes", "elasmobranchii"],
  insecta: ["insecta", "insect", "insects"],
  arachnida: ["arachnida", "arachnid", "arachnids"],
  cephalopoda: ["cephalopoda", "cephalopod", "cephalopods"],
  mollusca: ["mollusca", "mollusk", "mollusks"],
  arthropoda: ["arthropoda", "arthropod", "arthropods"],
  cnidaria: ["cnidaria", "cnidarian", "cnidarians"],
  plantae: ["plantae", "plant", "plants"],
  fungi: ["fungi", "fungus"],
  bacteria: ["bacteria", "bacterium"],
  archaea: ["archaea", "archaeon"],
};

function isTaxonomicEquivalent(val1: string, val2: string): boolean {
  const n1 = normalize(val1);
  const n2 = normalize(val2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  const eq1 = TAXON_EQUIVALENTS[n1];
  if (eq1 && eq1.includes(n2)) return true;

  const eq2 = TAXON_EQUIVALENTS[n2];
  if (eq2 && eq2.includes(n1)) return true;

  return false;
}

function nodeMatchesAnimal(node: TreeNode, animal: Animal): boolean {
  if (node.speciesIds?.length) return node.speciesIds.includes(animal.id);
  if (node.id === "life" || node.rank === "Root") return true;

  if (node.scope && Object.keys(node.scope).length > 0) {
    const scopeMatch = Object.entries(node.scope).every(([key, value]) => {
      const classificationKey = key as keyof Animal["classification"];
      const targetVal = animal.classification[classificationKey];
      if (!targetVal) return false;
      return isTaxonomicEquivalent(targetVal, value as string);
    });
    if (scopeMatch) return true;
  }

  const normId = normalize(node.id);
  const normLabel = normalize(node.label);
  const classValues = Object.values(animal.classification).filter(Boolean);

  for (const val of classValues) {
    if (isTaxonomicEquivalent(val, normId) || isTaxonomicEquivalent(val, normLabel)) {
      return true;
    }
  }

  return false;
}

function getAnimalsForNode(node: TreeNode, availableAnimals: Animal[]) {
  const branch = flattenTree(node);
  return availableAnimals.filter((animal) => branch.some((branchNode) => nodeMatchesAnimal(branchNode, animal)));
}

function DistributionMap({ continents }: { continents: string[] }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  return (
    <div className="relative h-[26rem] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#080e0c]">
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
        <button type="button" onClick={() => setZoom((value) => Math.min(value * 1.5, 8))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white hover:bg-white/10 transition cursor-pointer">+</button>
        <button type="button" onClick={() => { setZoom(1); setCenter([0, 20]); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-xs text-white hover:bg-white/10 transition cursor-pointer">↺</button>
        <button type="button" onClick={() => setZoom((value) => Math.max(value / 1.5, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white hover:bg-white/10 transition cursor-pointer">−</button>
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-[10px] text-white/50">
        <span className="inline-block h-2.5 w-5 rounded-sm bg-app-accent/80" /> Recorded range
      </div>
      <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "100%" }}>
        <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ zoom: nextZoom, coordinates }: { zoom: number; coordinates: [number, number] }) => { setZoom(nextZoom); setCenter(coordinates); }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => {
              const present = continents.some((continent) => CONTINENT_COUNTRIES[continent]?.has(Number(geo.id)));
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={present ? "rgba(221,191,135,0.82)" : "#141b17"}
                  stroke={present ? "rgba(221,191,135,0.28)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={0.4}
                  style={{ default: { outline: "none" }, hover: { outline: "none", fill: present ? "rgba(240,211,156,0.98)" : "#1e2823", cursor: "pointer" }, pressed: { outline: "none" } }}
                  onMouseEnter={(event: MouseEvent) => setTooltip({ name: geo.properties.name, x: event.clientX, y: event.clientY })}
                  onMouseMove={(event: MouseEvent) => setTooltip((current) => current ? { ...current, x: event.clientX, y: event.clientY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltip ? <div className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-black/90 px-3 py-1.5 text-xs text-white shadow-xl" style={{ left: tooltip.x + 12, top: tooltip.y - 4 }}>{tooltip.name}</div> : null}
    </div>
  );
}

function FamousAnimals({ animals: classAnimals }: { animals: Animal[] }) {
  const famous = [...classAnimals].sort((a, b) => {
    const aRank = FAMOUS_IDS.indexOf(a.id);
    const bRank = FAMOUS_IDS.indexOf(b.id);
    return (aRank < 0 ? 999 : aRank) - (bRank < 0 ? 999 : bRank);
  }).slice(0, 4);

  if (famous.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="page-section-title flex items-center gap-2"><PawIcon className="h-5 w-5 text-app-accent" />Most famous species</h2>
          <p className="mt-1 text-sm text-app-muted">Recognizable ambassadors from this branch of life.</p>
        </div>
        <span className="tag-chip font-medium text-app-accent">{famous.length} highlights</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {famous.map((animal) => (
          <Link key={animal.id} to={`/species/${animal.id}`} className="group relative h-52 overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/20 hover:border-app-accent/30 transition shadow-lg">
            <SpeciesImage animal={animal} className="h-full w-full" fitClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-lg font-semibold text-white group-hover:text-app-accent transition">{animal.commonName}</p>
              <p className="mt-1 text-xs italic text-app-muted">{animal.scientificName}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function LifeClass() {
  const { id = "" } = useParams();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedHabitat, setSelectedHabitat] = useState("All");
  const [selectedDiet, setSelectedDiet] = useState("All");
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState("All");

  const [dbSpecies, setDbSpecies] = useState<Animal[]>([]);
  const [storageVersion, setStorageVersion] = useState(0);

  const node = findTreeNode(treeOfLife, id);
  const coverData = useMemo(() => getNodeCoverData(node?.id), [node?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setQuery("");
    setSelectedStatus("All");
    setSelectedHabitat("All");
    setSelectedDiet("All");
    setSelectedFamilyFilter("All");
  }, [id]);

  useEffect(() => {
    const handler = () => setStorageVersion((value) => value + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  // Fetch up to 500 species from local SQLite database index for this node's term
  useEffect(() => {
    if (!node) return;
    const searchTerm = node.scope?.order || node.scope?.family || node.scope?.className || node.scope?.phylum || node.scope?.kingdom || node.label;
    searchSpeciesLocal(searchTerm, 500, 0).then((res) => {
      if (res && res.hits && res.hits.length > 0) {
        const previewAnimals = res.hits.map(previewAnimalFromHit);
        setDbSpecies(previewAnimals);
      }
    }).catch(() => {});
  }, [node]);

  const availableAnimals = useMemo(() => {
    const hidden = getHiddenSpecies();
    const merged = new Map<string, Animal>(animals.map((animal) => [animal.id, animal]));
    for (const animal of getAllCachedSpecies()) merged.set(animal.id, animal);
    for (const animal of dbSpecies) {
      if (!merged.has(animal.id)) merged.set(animal.id, animal);
    }
    return [...merged.values()].filter((animal) => !hidden.includes(animal.id));
  }, [dbSpecies, storageVersion]);

  const classAnimals = useMemo(() => {
    if (!node) return [];
    const directMatches = getAnimalsForNode(node, availableAnimals);
    if (directMatches.length > 0) return directMatches;

    // Fallback matching by order, family, className, phylum, or kingdom
    const term = normalize(node.scope?.order || node.scope?.family || node.scope?.className || node.scope?.phylum || node.scope?.kingdom || node.label);
    return availableAnimals.filter((animal) => {
      const cls = animal.classification;
      return (
        normalize(cls.order || "").includes(term) ||
        normalize(cls.family || "").includes(term) ||
        normalize(cls.className || "").includes(term) ||
        normalize(cls.phylum || "").includes(term) ||
        normalize(cls.kingdom || "").includes(term) ||
        normalize(animal.shortDescription || "").includes(term)
      );
    });
  }, [node, availableAnimals]);

  const families = useMemo(() => {
    const set = new Set(classAnimals.map((a) => a.classification.family).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [classAnimals]);

  const filteredAnimals = useMemo(() => {
    let result = classAnimals;

    if (query.trim()) {
      const q = normalize(query);
      result = result.filter((animal) =>
        normalize([
          animal.commonName,
          animal.scientificName,
          animal.shortDescription,
          ...Object.values(animal.classification),
          ...animal.habitat,
        ].join(" ")).includes(q)
      );
    }

    if (selectedStatus !== "All") {
      result = result.filter((a) => a.conservationStatus === selectedStatus);
    }

    if (selectedHabitat !== "All") {
      result = result.filter((a) => a.habitat.some((h) => h.toLowerCase().includes(selectedHabitat.toLowerCase())));
    }

    if (selectedDiet !== "All") {
      result = result.filter((a) => a.diet.toLowerCase() === selectedDiet.toLowerCase());
    }

    if (selectedFamilyFilter !== "All") {
      result = result.filter((a) => a.classification.family === selectedFamilyFilter);
    }

    return result;
  }, [classAnimals, query, selectedStatus, selectedHabitat, selectedDiet, selectedFamilyFilter]);

  const path = node ? findNodePath(treeOfLife, node.id) ?? [node] : [];
  const coverAnimal = classAnimals.find((a) => a.images && a.images.length > 0);
  const continents = [...new Set(classAnimals.flatMap((animal) => animal.continents))];
  const habitats = [...new Set(classAnimals.flatMap((animal) => animal.habitat))];
  const genera = new Set(classAnimals.map((animal) => animal.classification.genus).filter(Boolean));
  const threatened = classAnimals.filter((animal) => ["Vulnerable", "Endangered", "Critically Endangered"].includes(animal.conservationStatus)).length;

  if (!node) {
    return (
      <div className="page-frame">
        <section className="page-card rounded-[1.7rem] p-8 text-center">
          <h1 className="page-title text-3xl">Life Class not found</h1>
          <p className="mt-2 text-sm text-app-muted">The requested taxonomy branch does not exist or has been renamed.</p>
          <Link to="/tree" className="primary-button mt-5 inline-flex">
            Back to Tree of Life
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-frame">
      {/* Interactive Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-app-soft">
        <Link to="/tree" className="hover:text-app-accent transition flex items-center gap-1.5">
          <TreeLogoIcon className="h-3.5 w-3.5 text-app-accent" />
          Tree of Life
        </Link>
        {path.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-2">
            <span className="text-white/20">›</span>
            {item.id === node.id ? (
              <span className="font-bold text-app-accent">{item.label}</span>
            ) : (
              <Link to={`/life-class/${item.id}`} className="hover:text-app-accent transition">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Hero Banner Header with Curated HD Cover Image */}
      <section className={`relative min-h-[28rem] overflow-hidden rounded-[2.2rem] border border-white/12 bg-gradient-to-br ${coverData.gradient} shadow-2xl`}>
        {coverAnimal && coverAnimal.images && coverAnimal.images.length > 0 ? (
          <SpeciesImage
            animal={coverAnimal}
            className="absolute inset-0 h-full w-full"
            fitClassName="h-full w-full object-cover opacity-50 transition duration-700 hover:scale-105"
          />
        ) : (
          <img
            src={coverData.heroUrl}
            alt={node.label}
            className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-700 hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050806]/95 via-[#050806]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-black/30 to-transparent" />

        <div className="relative flex min-h-[28rem] max-w-4xl flex-col justify-end p-6 md:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-app-accent/40 bg-app-accent/20 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.24em] text-app-accent backdrop-blur-md shadow-lg">
              Taxon Rank · {node.rank}
            </span>
            {node.wikiTitle ? (
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(node.wikiTitle)}`}
                target="_blank"
                rel="noreferrer"
                className="ghost-button !min-h-0 !py-1 !px-3 text-xs opacity-90 hover:opacity-100 cursor-pointer backdrop-blur-md"
              >
                Wikipedia ↗
              </a>
            ) : null}
            {coverData.attribution ? (
              coverData.sourceUrl ? (
                <a
                  href={coverData.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost-button !min-h-0 !py-1 !px-3 text-xs text-app-soft opacity-80 hover:opacity-100 cursor-pointer backdrop-blur-md"
                  title={coverData.attribution}
                >
                  📷 {coverData.attribution.length > 45 ? coverData.attribution.slice(0, 42) + "..." : coverData.attribution} ↗
                </a>
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-app-soft backdrop-blur-md">
                  📷 {coverData.attribution}
                </span>
              )
            ) : null}
          </div>

          <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.03em] text-white md:text-7xl drop-shadow-lg">
            {node.label}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-app-muted md:text-lg drop-shadow">
            {node.description || coverData.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <PawIcon className="h-3.5 w-3.5 text-app-accent" />
              {classAnimals.length} indexed species
            </span>
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <BranchIcon className="h-3.5 w-3.5 text-app-accent" />
              {families.length - 1} families
            </span>
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <GlobeGridIcon className="h-3.5 w-3.5 text-app-accent" />
              {continents.length} continents
            </span>
            {threatened > 0 ? (
              <span className="tag-chip border-amber-500/30 bg-amber-500/15 text-amber-300 backdrop-blur-md">
                <LeafClusterIcon className="h-3.5 w-3.5 text-amber-400" />
                {threatened} at-risk
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stat Tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Species", classAnimals.length, PawIcon, "Indexed species in branch"],
          ["Families", Math.max(1, families.length - 1), BranchIcon, "Distinct biological families"],
          ["Genera", Math.max(1, genera.size), TreeLogoIcon, "Represented taxonomic genera"],
          ["At-risk records", threatened, LeafClusterIcon, "Vulnerable / Endangered"],
        ].map(([label, value, Icon, desc]) => {
          const StatIcon = Icon as typeof PawIcon;
          return (
            <div key={label as string} className="page-card rounded-[1.4rem] p-5 hover:border-app-accent/20 transition">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-app-accent/20 bg-app-accent/10 text-app-accent">
                  <StatIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white leading-tight">{value as number}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-app-muted font-medium mt-0.5">{label as string}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-app-soft border-t border-white/6 pt-2">{desc as string}</p>
            </div>
          );
        })}
      </section>

      {/* Sub-classes / Child Lineages Grid (Compact Portrait Cards) */}
      {node.children && node.children.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="page-section-title flex items-center gap-2">
                <BranchIcon className="h-5 w-5 text-app-accent" /> Sub-classes & Lineages in {node.label}
              </h2>
              <p className="mt-1 text-sm text-app-muted">Direct taxonomic subdivisions under this rank.</p>
            </div>
            <span className="tag-chip font-medium text-app-accent">{node.children.length} sub-branches</span>
          </div>
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {node.children.map((child) => {
              const childCount = getAnimalsForNode(child, availableAnimals).length;
              const childCover = getNodeCoverData(child.id);
              return (
                <Link
                  key={child.id}
                  to={`/life-class/${child.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[1.4rem] border border-white/12 bg-black/40 p-4 transition duration-300 hover:scale-[1.03] hover:border-app-accent/40 hover:shadow-xl hover:no-underline aspect-[3/4]"
                >
                  <img
                    src={childCover.heroUrl}
                    alt={child.label}
                    className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-110 group-hover:opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-app-accent backdrop-blur-md">
                      {nodeIcon(child)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-app-accent bg-app-accent/20 border border-app-accent/30 px-2 py-0.5 rounded-full backdrop-blur-md">
                      {child.rank}
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <h3 className="text-base font-bold text-white group-hover:text-app-accent transition leading-tight">
                      {child.label}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-app-muted opacity-80">
                      {child.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-medium text-app-soft">
                      <span>{childCount > 0 ? `${childCount} species` : "Explore"}</span>
                      <span className="flex items-center gap-0.5 text-app-accent group-hover:translate-x-1 transition">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* About & Classification Path */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="page-card rounded-[1.7rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="page-section-title">About {node.label}</h2>
              <p className="mt-1 text-sm text-app-muted">Taxonomic field guide and catalog context.</p>
            </div>
            {node.wikiTitle ? (
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(node.wikiTitle)}`}
                target="_blank"
                rel="noreferrer"
                className="ghost-button text-xs cursor-pointer shrink-0"
              >
                Source ↗
              </a>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-app-muted">
            {node.description} Biblos connects this classification to local species records, habitat observations, and conservation context so the branch can be explored as a living collection rather than a static label.
          </p>
          {habitats.length > 0 ? (
            <div className="mt-6 border-t border-white/8 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-app-soft mb-2.5">Associated Habitats</p>
              <div className="flex flex-wrap gap-2">
                {habitats.slice(0, 10).map((habitat) => (
                  <button
                    type="button"
                    key={habitat}
                    onClick={() => setSelectedHabitat(habitat)}
                    className={`tag-chip interactive-chip cursor-pointer ${selectedHabitat === habitat ? "!border-app-accent !bg-app-accent/20 !text-app-accent font-bold" : ""}`}
                  >
                    {habitat}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="page-card rounded-[1.7rem] p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-app-soft">Classification path</p>
          <div className="mt-4 space-y-2.5">
            {path.map((item, index) => {
              const isCurrent = item.id === node.id;
              return (
                <Link
                  key={item.id}
                  to={`/life-class/${item.id}`}
                  className={`flex items-center gap-3 text-sm p-2 rounded-xl transition ${
                    isCurrent
                      ? "bg-app-accent/10 border border-app-accent/25 text-white font-semibold"
                      : "hover:bg-white/5 text-app-muted hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      isCurrent
                        ? "bg-app-accent text-black font-bold"
                        : "border border-app-accent/20 bg-app-accent/8 text-app-accent"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-app-soft shrink-0">{item.rank}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Famous Species */}
      <FamousAnimals animals={classAnimals} />

      {/* Distribution Map */}
      <section>
        <div className="mb-4">
          <h2 className="page-section-title flex items-center gap-2">
            <GlobeGridIcon className="h-5 w-5 text-app-accent" /> Where {node.label} is found
          </h2>
          <p className="mt-1 text-sm text-app-muted">Continent-level distribution of indexed species in this branch.</p>
        </div>
        <DistributionMap continents={continents} />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {continents.length > 0 ? (
            continents.map((continent) => (
              <span key={continent} className="tag-chip">
                {continent}
              </span>
            ))
          ) : (
            <span className="text-sm text-app-muted">Distribution data will appear as species records are added.</span>
          )}
        </div>
      </section>

      {/* Search Species & Advanced Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <PawIcon className="h-5 w-5 text-app-accent" /> Search & Filter species in {node.label}
            </h2>
            <p className="mt-1 text-sm text-app-muted">Explore and filter species in this branch across multiple dimensions.</p>
          </div>
          <span className="tag-chip font-medium text-app-accent">{filteredAnimals.length} matches</span>
        </div>

        <SearchBar value={query} onChange={setQuery} placeholder={`Search ${node.label.toLowerCase()} species by common or scientific name...`} />

        {/* Filter Controls Row */}
        <div className="page-card rounded-[1.4rem] p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-black/40 backdrop-blur-md">
          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-app-soft mb-1.5 block">Conservation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-app-accent transition cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-stone-900 text-white">{opt}</option>
              ))}
            </select>
          </div>

          {/* Habitat Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-app-soft mb-1.5 block">Habitat Environment</label>
            <select
              value={selectedHabitat}
              onChange={(e) => setSelectedHabitat(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-app-accent transition cursor-pointer"
            >
              {HABITAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-stone-900 text-white">{opt}</option>
              ))}
            </select>
          </div>

          {/* Diet Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-app-soft mb-1.5 block">Dietary Profile</label>
            <select
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-app-accent transition cursor-pointer"
            >
              {DIET_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-stone-900 text-white">{opt}</option>
              ))}
            </select>
          </div>

          {/* Family Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-app-soft mb-1.5 block">Taxonomic Family</label>
            <select
              value={selectedFamilyFilter}
              onChange={(e) => setSelectedFamilyFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-app-accent transition cursor-pointer"
            >
              {families.map((fam) => (
                <option key={fam} value={fam} className="bg-stone-900 text-white">{fam}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(query || selectedStatus !== "All" || selectedHabitat !== "All" || selectedDiet !== "All" || selectedFamilyFilter !== "All") ? (
          <div className="flex items-center justify-between text-xs text-app-soft px-1">
            <span>Active filters applied</span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedStatus("All");
                setSelectedHabitat("All");
                setSelectedDiet("All");
                setSelectedFamilyFilter("All");
              }}
              className="text-app-accent hover:underline cursor-pointer font-medium"
            >
              Reset all filters
            </button>
          </div>
        ) : null}

        {/* Results Grid */}
        <div className="mt-5">
          {filteredAnimals.length > 0 ? (
            <div className="page-grid page-grid-3">
              {filteredAnimals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <div className="page-card rounded-[1.7rem] p-10 text-center border border-white/10 bg-black/30">
              <p className="text-xl font-semibold text-white">No species match these filter criteria</p>
              <p className="mt-2 text-sm text-app-muted">Try clearing some filters or searching for a different scientific name.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedStatus("All");
                  setSelectedHabitat("All");
                  setSelectedDiet("All");
                  setSelectedFamilyFilter("All");
                }}
                className="primary-button mt-4 inline-flex !py-2 !px-4 text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
