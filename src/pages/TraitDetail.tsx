import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
import { SearchBar } from "../components/SearchBar";
import {
  BinocularsIcon,
  BranchIcon,
  ChevronRightIcon,
  GlobeGridIcon,
  LeafClusterIcon,
  PawIcon,
  TreeLogoIcon,
} from "../components/icons";
import { animals } from "../data/animals";
import { getAllCachedSpecies, getHiddenSpecies } from "../services/cache";
import { previewAnimalFromHit, searchSpeciesLocal } from "../services/speciesStore";
import type { Animal } from "../types/animal";

type TraitCategory = "diet" | "status" | "activity";

type TraitConfig = {
  title: string;
  category: TraitCategory;
  tagline: string;
  gradient: string;
  icon: typeof PawIcon;
  badge: string;
  imageUrl?: string;
};

const TRAIT_CONFIGS: Record<string, TraitConfig> = {
  // Diets
  carnivore: {
    title: "Carnivore",
    category: "diet",
    tagline: "Predators and meat-eaters adapted for hunting, scavenging, and meat consumption.",
    gradient: "from-[#12080a] via-[#0b0607] to-[#040705]",
    icon: PawIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1600&q=80",
  },
  herbivore: {
    title: "Herbivore",
    category: "diet",
    tagline: "Plant-eaters, grazers, and browsers driving nutrient transfer in ecosystems.",
    gradient: "from-[#08120c] via-[#060e0a] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=1600&q=80",
  },
  omnivore: {
    title: "Omnivore",
    category: "diet",
    tagline: "Versatile feeders consuming both animal prey and plant material across seasons.",
    gradient: "from-[#121008] via-[#0e0c06] to-[#040705]",
    icon: TreeLogoIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1600&q=80",
  },
  insectivore: {
    title: "Insectivore",
    category: "diet",
    tagline: "Specialized feeders focused on insects, arachnids, and small invertebrates.",
    gradient: "from-[#0a1208] via-[#070e06] to-[#040705]",
    icon: BinocularsIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=1600&q=80",
  },
  piscivore: {
    title: "Piscivore",
    category: "diet",
    tagline: "Aquatic and aerial hunters specializing in fish and aquatic prey.",
    gradient: "from-[#081012] via-[#060c0e] to-[#040705]",
    icon: GlobeGridIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1516683011827-46882a229ad5?auto=format&fit=crop&w=1600&q=80",
  },
  "filter feeder": {
    title: "Filter Feeder",
    category: "diet",
    tagline: "Marine strainers consuming plankton and suspended organic matter from water.",
    gradient: "from-[#080d12] via-[#060a0e] to-[#040705]",
    icon: GlobeGridIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1600&q=80",
  },
  detritivore: {
    title: "Detritivore",
    category: "diet",
    tagline: "Essential recyclers breaking down decaying matter and returning nutrients to soil.",
    gradient: "from-[#120e08] via-[#0e0b06] to-[#040705]",
    icon: BranchIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=1600&q=80",
  },
  autotroph: {
    title: "Autotroph",
    category: "diet",
    tagline: "Photosynthetic plants and algae converting light energy into organic fuel.",
    gradient: "from-[#08120c] via-[#060e0a] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "Dietary Profile",
    imageUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=80",
  },

  // Conservation Statuses
  "critically endangered": {
    title: "Critically Endangered",
    category: "status",
    tagline: "Facing an extremely high risk of extinction in the immediate future.",
    gradient: "from-[#14080a] via-[#0f0607] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1600&q=80",
  },
  endangered: {
    title: "Endangered",
    category: "status",
    tagline: "Facing a very high risk of extinction in the wild.",
    gradient: "from-[#140a08] via-[#0f0706] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=80",
  },
  vulnerable: {
    title: "Vulnerable",
    category: "status",
    tagline: "Facing a high risk of endangerment in the wild unless threats are mitigated.",
    gradient: "from-[#141008] via-[#0f0c06] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1600&q=80",
  },
  "near threatened": {
    title: "Near Threatened",
    category: "status",
    tagline: "Close to qualifying for or likely to qualify for a threatened category in the near future.",
    gradient: "from-[#141208] via-[#0f0d06] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=1600&q=80",
  },
  "least concern": {
    title: "Least Concern",
    category: "status",
    tagline: "Evaluated species with stable or widespread populations in healthy numbers.",
    gradient: "from-[#08120c] via-[#060e0a] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1600&q=80",
  },
  extinct: {
    title: "Extinct",
    category: "status",
    tagline: "No reasonable doubt that the last individual of the species has died.",
    gradient: "from-[#0c0c0c] via-[#080808] to-[#040705]",
    icon: LeafClusterIcon,
    badge: "IUCN Conservation Status",
    imageUrl: "https://images.unsplash.com/photo-1569742918414-0498b584d412?auto=format&fit=crop&w=1600&q=80",
  },

  // Activity Patterns
  diurnal: {
    title: "Diurnal",
    category: "activity",
    tagline: "Organisms active during daylight hours, relying on vision and solar thermal energy.",
    gradient: "from-[#141008] via-[#0f0c06] to-[#040705]",
    icon: BinocularsIcon,
    badge: "Activity Rhythm",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80",
  },
  nocturnal: {
    title: "Nocturnal",
    category: "activity",
    tagline: "Creatures active during nighttime hours with heightened night vision, echolocation, or scent.",
    gradient: "from-[#0d0814] via-[#09060f] to-[#040705]",
    icon: BinocularsIcon,
    badge: "Activity Rhythm",
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80",
  },
  crepuscular: {
    title: "Crepuscular",
    category: "activity",
    tagline: "Species primarily active during twilight hours of dawn and dusk.",
    gradient: "from-[#100814] via-[#0c060f] to-[#040705]",
    icon: BinocularsIcon,
    badge: "Activity Rhythm",
    imageUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1600&q=80",
  },
};

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

export default function TraitDetail({ traitCategory }: { traitCategory?: TraitCategory }) {
  const { value = "" } = useParams();
  const normalizedKey = normalize(decodeURIComponent(value));
  
  const config: TraitConfig = TRAIT_CONFIGS[normalizedKey] ?? {
    title: decodeURIComponent(value).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: traitCategory ?? "diet",
    tagline: `Explore indexed species matching ${decodeURIComponent(value)}.`,
    gradient: "from-emerald-950/80 via-teal-950/40 to-stone-950",
    icon: PawIcon,
    badge: "Trait Detail",
  };

  const [query, setQuery] = useState("");
  const [dbSpecies, setDbSpecies] = useState<Animal[]>([]);
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setQuery("");
  }, [value]);

  useEffect(() => {
    const handler = () => setStorageVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  // Fetch SQLite species hits matching this trait
  useEffect(() => {
    searchSpeciesLocal(config.title, 300, 0)
      .then((res) => {
        if (res && res.hits && res.hits.length > 0) {
          const preview = res.hits.map(previewAnimalFromHit);
          setDbSpecies(preview);
        }
      })
      .catch(() => {});
  }, [config.title]);

  const availableAnimals = useMemo(() => {
    const hidden = getHiddenSpecies();
    const merged = new Map<string, Animal>(animals.map((a) => [a.id, a]));
    for (const cached of getAllCachedSpecies()) merged.set(cached.id, cached);
    for (const db of dbSpecies) {
      if (!merged.has(db.id)) merged.set(db.id, db);
    }
    return [...merged.values()].filter((a) => !hidden.includes(a.id));
  }, [dbSpecies, storageVersion]);

  const traitAnimals = useMemo(() => {
    const term = normalize(config.title);
    return availableAnimals.filter((a) => {
      if (config.category === "diet") {
        return normalize(a.diet).includes(term) || (a.diet.toLowerCase() === "carnivore" && term === "carnivore");
      }
      if (config.category === "status") {
        return normalize(a.conservationStatus).includes(term);
      }
      if (config.category === "activity") {
        return normalize(a.activityPattern).includes(term);
      }
      return normalize(a.diet).includes(term) || normalize(a.conservationStatus).includes(term) || normalize(a.activityPattern).includes(term);
    });
  }, [availableAnimals, config]);

  const filteredAnimals = useMemo(() => {
    if (!query.trim()) return traitAnimals;
    const q = normalize(query);
    return traitAnimals.filter((a) =>
      normalize([
        a.commonName,
        a.scientificName,
        a.shortDescription,
        ...Object.values(a.classification),
        ...a.habitat,
      ].join(" ")).includes(q)
    );
  }, [traitAnimals, query]);

  const habitats = useMemo(() => [...new Set(traitAnimals.flatMap((a) => a.habitat))], [traitAnimals]);
  const continents = useMemo(() => [...new Set(traitAnimals.flatMap((a) => a.continents))], [traitAnimals]);
  const classes = useMemo(() => [...new Set(traitAnimals.map((a) => a.classification.className).filter(Boolean))], [traitAnimals]);
  const IconComponent = config.icon;

  return (
    <div className="page-frame">
      {/* Interactive Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-app-soft">
        <Link to="/explorer" className="hover:text-app-accent transition flex items-center gap-1.5">
          <BinocularsIcon className="h-3.5 w-3.5 text-app-accent" />
          Explorer
        </Link>
        <span className="text-white/20">›</span>
        <span className="capitalize">{config.category}</span>
        <span className="text-white/20">›</span>
        <span className="font-bold text-app-accent">{config.title}</span>
      </div>

      {/* Hero Header Banner */}
      <section className="relative min-h-[24rem] overflow-hidden rounded-[2.2rem] border border-white/12 bg-[#060a08] shadow-2xl p-6 md:p-10 flex flex-col justify-end">
        {config.imageUrl && (
          <img
            src={config.imageUrl}
            alt={config.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-40% to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-app-accent/40 bg-app-accent/20 text-app-accent backdrop-blur-md">
              <IconComponent className="h-5 w-5" />
            </span>
            <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-app-accent backdrop-blur-md">
              {config.badge}
            </span>
          </div>

          <h1 className="font-display text-4xl leading-tight text-white md:text-6xl drop-shadow-md">
            {config.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-app-muted md:text-lg">
            {config.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <PawIcon className="h-3.5 w-3.5 text-app-accent" />
              {traitAnimals.length} indexed species
            </span>
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <BranchIcon className="h-3.5 w-3.5 text-app-accent" />
              {classes.length} classes
            </span>
            <span className="tag-chip border-white/15 bg-black/40 backdrop-blur-md">
              <GlobeGridIcon className="h-3.5 w-3.5 text-app-accent" />
              {continents.length} continents
            </span>
          </div>
        </div>
      </section>

      {/* Habitats & Class Distribution Badges */}
      {habitats.length > 0 ? (
        <section className="page-card rounded-[1.6rem] p-5">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-app-soft mb-3">Associated Ecosystems & Habitats</p>
          <div className="flex flex-wrap gap-2">
            {habitats.map((h) => (
              <Link key={h} to={`/species?habitat=${encodeURIComponent(h)}`} className="tag-chip interactive-chip">
                {h}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Search & Species Cards */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="page-section-title flex items-center gap-2">
              <PawIcon className="h-5 w-5 text-app-accent" /> Species with {config.title} profile
            </h2>
            <p className="mt-1 text-sm text-app-muted">Browse and filter species records for this trait.</p>
          </div>
          <Link to={`/species?${config.category === "diet" ? "diet" : config.category === "status" ? "status" : "activity"}=${encodeURIComponent(config.title)}`} className="ghost-button text-xs cursor-pointer">
            Open in main directory <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <SearchBar value={query} onChange={setQuery} placeholder={`Search ${config.title.toLowerCase()} species...`} />

        <div className="mt-5">
          {filteredAnimals.length > 0 ? (
            <div className="page-grid page-grid-3">
              {filteredAnimals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <div className="page-card rounded-[1.7rem] p-10 text-center border border-white/10 bg-black/30">
              <p className="text-xl font-semibold text-white">No species match search query</p>
              <p className="mt-2 text-sm text-app-muted">Try a different search term or view all species in directory.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
