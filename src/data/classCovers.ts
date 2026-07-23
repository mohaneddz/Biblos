export interface ClassCoverData {
  heroUrl: string;
  thumbnailUrl: string;
  gradient: string;
  tagline: string;
}

export const CLASS_COVER_IMAGES: Record<string, ClassCoverData> = {
  // --- ROOT & DOMAINS ---
  life: {
    heroUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-teal-900 to-emerald-900",
    tagline: "The interconnected web of Earth's 8.7+ million living species.",
  },
  bacteria: {
    heroUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-blue-900 to-indigo-950",
    tagline: "Single-celled prokaryotic pioneers powering Earth's biogeochemical cycles.",
  },
  pseudomonadota: {
    heroUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-purple-900 to-slate-900",
    tagline: "Metabolically versatile proteobacteria key to nitrogen fixation and symbiosis.",
  },
  bacillota: {
    heroUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
    gradient: "from-violet-950 via-fuchsia-950 to-slate-900",
    tagline: "Gram-positive endospore formers including probiotic fermenters and decomposers.",
  },
  actinomycetota: {
    heroUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
    gradient: "from-purple-950 via-slate-900 to-amber-950",
    tagline: "Soil-dwelling filamentous bacteria responsible for natural antibiotics and humus.",
  },
  cyanobacteriota: {
    heroUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-950 via-emerald-900 to-cyan-950",
    tagline: "Photosynthetic blue-green algae that created Earth's oxygen-rich atmosphere.",
  },
  archaea: {
    heroUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-red-950 to-orange-950",
    tagline: "Extremophilic ancient prokaryotes thriving in hydrothermal vents, salt flats, and hot springs.",
  },
  euryarchaeota: {
    heroUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-950 via-orange-950 to-stone-900",
    tagline: "Methanogenic and extreme halophile archaea generating methane and vivid pink salt lakes.",
  },
  thermoproteota: {
    heroUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-red-950 via-amber-950 to-zinc-900",
    tagline: "Hyperthermophiles growing in boiling sulfur springs and deep sea volcanic chimneys.",
  },
  asgardarchaeota: {
    heroUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-indigo-950 to-purple-950",
    tagline: "The evolutionary bridge linking prokaryotes to complex eukaryotic life.",
  },

  // --- EUKARYOTA & KINGDOMS ---
  eukaryota: {
    heroUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-teal-900 to-sky-950",
    tagline: "Organisms with nucleated cells: Plants, Fungi, Animals, and Protists.",
  },
  plantae: {
    heroUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-green-900 to-teal-950",
    tagline: "Multicellular autotrophs converting sunlight into chemical energy.",
  },
  bryophyta: {
    heroUrl: "https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=600&q=80",
    gradient: "from-green-950 via-emerald-900 to-stone-900",
    tagline: "Mosses and carpet-forming non-vascular terrestrial flora.",
  },
  pteridophyta: {
    heroUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-teal-950 to-green-900",
    tagline: "Ancient spore-bearing ferns dominating damp forest understories.",
  },
  gymnosperms: {
    heroUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-emerald-950 to-green-950",
    tagline: "Cone-bearing conifers, redwoods, and ancient cycads with naked seeds.",
  },
  angiosperms: {
    heroUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-950 via-pink-950 to-emerald-950",
    tagline: "Flowering plants producing fruit and fueling terrestrial animal nutrition.",
  },
  fungi: {
    heroUrl: "https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-stone-900 to-purple-950",
    tagline: "Heterotrophic decomposers, mycorrhizal networks, and spore-forming fungi.",
  },
  ascomycota: {
    heroUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80",
    gradient: "from-purple-950 via-stone-950 to-amber-950",
    tagline: "Sac fungi including yeasts, lichens, truffles, and cup fungi.",
  },
  basidiomycota: {
    heroUrl: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80",
    gradient: "from-red-950 via-amber-950 to-stone-900",
    tagline: "Mushroom-forming fungi with gills, pore caps, and wood-decomposing mycelium.",
  },
  protists: {
    heroUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    gradient: "from-sky-950 via-indigo-950 to-teal-950",
    tagline: "Diverse eukaryotic single-celled organisms, seaweeds, and slime molds.",
  },
  alveolata: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-blue-950 to-slate-900",
    tagline: "Bioluminescent dinoflagellates, ocean plankton, and ciliates.",
  },
  amoebozoa: {
    heroUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline: "Pseudopodial amoebae and network-forming slime molds.",
  },
  stramenopiles: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-yellow-950 to-teal-950",
    tagline: "Golden giant kelp, diatoms, and brown marine algae forests.",
  },

  // --- ANIMALIA & CLASSES ---
  metazoa: {
    heroUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-orange-950 to-red-950",
    tagline: "Multicellular heterotrophic animals with nervous systems and mobility.",
  },
  chordata: {
    heroUrl: "https://images.unsplash.com/photo-1568430460464-02e1dc60e8c2?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1568430460464-02e1dc60e8c2?auto=format&fit=crop&w=600&q=80",
    gradient: "from-blue-950 via-cyan-950 to-slate-900",
    tagline: "Vertebrates and spinal cord animals spanning fish, birds, mammals, and reptiles.",
  },
  mammalia: {
    heroUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-orange-900 to-yellow-950",
    tagline: "Endothermic furry mammals with nursing milk glands and high intelligence.",
  },
  carnivora: {
    heroUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-red-950 via-orange-950 to-amber-950",
    tagline: "Apex predators and carnivores including big cats, wolves, bears, and seals.",
  },
  felidae: {
    heroUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline: "Solitary apex feline hunters with stealth agility and retractable claws.",
  },
  canidae: {
    heroUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef9?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef9?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-zinc-900 to-amber-950",
    tagline: "Pack-hunting canines including grey wolves, foxes, and jackals.",
  },
  ailuridae: {
    heroUrl: "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=600&q=80",
    gradient: "from-orange-950 via-amber-900 to-emerald-950",
    tagline: "Arboreal bamboo-eating red pandas native to high Himalayan forests.",
  },
  artiodactyla: {
    heroUrl: "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-stone-900 to-amber-950",
    tagline: "Even-toed ungulates including deer, giraffes, hippos, and whales.",
  },
  proboscidea: {
    heroUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-stone-900 to-orange-950",
    tagline: "Majestic pachyderms: African savanna, forest, and Asian elephants.",
  },
  rodentia: {
    heroUrl: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline: "Gnawing mammals with continuously growing incisors.",
  },
  aves: {
    heroUrl: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=600&q=80",
    gradient: "from-sky-950 via-blue-900 to-indigo-950",
    tagline: "Feathered avian species spanning eagles, hummingbirds, and penguins.",
  },
  accipitriformes: {
    heroUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-slate-900 to-sky-950",
    tagline: "Diurnal raptors with powerful talons and keen binocular vision.",
  },
  falconiformes: {
    heroUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-blue-950 to-indigo-950",
    tagline: "High-speed stooping falcons and kestrels.",
  },
  sphenisciformes: {
    heroUrl: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-blue-950 to-slate-950",
    tagline: "Flightless oceanic penguins built for deep sub-zero polar diving.",
  },
  reptilia: {
    heroUrl: "https://images.unsplash.com/photo-1500479694472-551d1fb6258d?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1500479694472-551d1fb6258d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-stone-900 to-amber-950",
    tagline: "Ectothermic scaly reptiles: snakes, lizards, turtles, and crocodilians.",
  },
  squamata: {
    heroUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-lime-950 via-emerald-950 to-stone-900",
    tagline: "Lizards, chameleons, geckos, and snakes with flexible jaws.",
  },
  testudines: {
    heroUrl: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-950 via-emerald-950 to-cyan-950",
    tagline: "Ancient shelled sea turtles, Galapagos tortoises, and freshwater terrapins.",
  },
  crocodylia: {
    heroUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-emerald-950 to-amber-950",
    tagline: "Semi-aquatic ambush crocodilian archosaurs with armored scutes.",
  },
  amphibia: {
    heroUrl: "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-lime-950 to-teal-950",
    tagline: "Permeable-skinned frogs, toads, salamanders, and axolotls.",
  },
  anura: {
    heroUrl: "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-green-900 to-teal-950",
    tagline: "Vibrant poison dart frogs, tree frogs, and vocal bullfrogs.",
  },
  urodela: {
    heroUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-950 via-cyan-950 to-stone-900",
    tagline: "Tailed salamanders, newts, and regenerative aquatic axolotls.",
  },
  actinopterygii: {
    heroUrl: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=600&q=80",
    gradient: "from-blue-950 via-teal-900 to-cyan-950",
    tagline: "Ray-finned bony fishes inhabiting ocean coral reefs, rivers, and deep abysses.",
  },
  elasmobranchii: {
    heroUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=600&q=80",
    gradient: "from-blue-950 via-cyan-950 to-slate-950",
    tagline: "Cartilaginous sharks, manta rays, stingrays, and sawfish.",
  },
  holocephali: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-slate-900 to-cyan-950",
    tagline: "Deep-sea chimaeras and ghost sharks with iridescent metallic skin.",
  },
  sarcopterygii: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-blue-950 via-indigo-950 to-stone-900",
    tagline: "Lobe-finned coelacanths and lungfishes bridging aquatic life to land tetrapods.",
  },
  myxini: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-zinc-900 to-stone-950",
    tagline: "Jawless slime-producing benthic hagfishes of the deep ocean floor.",
  },
  petromyzontida: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-teal-950 to-indigo-950",
    tagline: "Jawless filter-feeding and parasitic eel-like lampreys.",
  },
  mollusca: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-blue-900 to-cyan-950",
    tagline: "Soft-bodied mollusks: octopuses, sea slugs, clams, and chitons.",
  },
  cephalopoda: {
    heroUrl: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-purple-950 to-cyan-950",
    tagline: "Highly intelligent octopuses, squid, cuttlefish, and nautiluses.",
  },
  gastropoda: {
    heroUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-teal-950 to-emerald-950",
    tagline: "Vibrant nudibranch sea dragons, land snails, and limpets.",
  },
  bivalvia: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-950 via-cyan-950 to-blue-950",
    tagline: "Two-shelled filter feeding giant clams, oysters, and scallops.",
  },
  polyplacophora: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-teal-950 to-emerald-950",
    tagline: "Eight-plated marine chitons clinging to intertidal reefs.",
  },
  arthropoda: {
    heroUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-orange-950 to-stone-900",
    tagline: "Exoskeleton arthropods: insects, spiders, crabs, and millipedes.",
  },
  insecta: {
    heroUrl: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-emerald-950 to-orange-950",
    tagline: "Hexapod insects: Monarch butterflies, honey bees, beetles, and dragonflies.",
  },
  arachnida: {
    heroUrl: "https://images.unsplash.com/photo-1569429593410-b498b3fb3387?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1569429593410-b498b3fb3387?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-purple-950 to-slate-900",
    tagline: "Eight-legged arachnids: jumping spiders, tarantulas, and scorpions.",
  },
  malacostraca: {
    heroUrl: "https://images.unsplash.com/photo-1559880200-ac0227897072?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1559880200-ac0227897072?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-950 via-orange-950 to-cyan-950",
    tagline: "Peacock mantis shrimp, blue crabs, lobsters, and krill.",
  },
  diplopoda: {
    heroUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-amber-950 to-emerald-950",
    tagline: "Slow-moving detritivorous millipedes with double leg segments.",
  },
  chilopoda: {
    heroUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?auto=format&fit=crop&w=600&q=80",
    gradient: "from-red-950 via-amber-950 to-stone-900",
    tagline: "Venomous fast-hunting centipedes with front poison claws.",
  },
  maxillopoda: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-teal-950 to-blue-950",
    tagline: "Gooseneck barnacles and ocean planktonic copepods.",
  },
  merostomata: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-cyan-950 to-blue-950",
    tagline: "Living fossil Atlantic horseshoe crabs with copper-blue blood.",
  },
  cnidaria: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-purple-900 to-cyan-950",
    tagline: "Stinging cnidarians: jellyfish, corals, and sea anemones.",
  },
  anthozoa: {
    heroUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-950 via-pink-950 to-teal-950",
    tagline: "Coral reef builders, sea anemones, and sea pens.",
  },
  hydrozoa: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950 via-blue-950 to-indigo-950",
    tagline: "Colonial siphonophores including Portuguese man o' war and hydras.",
  },
  scyphozoa: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-purple-950 via-indigo-950 to-cyan-950",
    tagline: "Pulsating translucent true moon jellyfish and sea nettles.",
  },
  echinodermata: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-pink-950 via-purple-950 to-cyan-950",
    tagline: "Five-fold radial symmetry echinoderms: sea stars and sea urchins.",
  },
  asteroidea: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-purple-950 via-pink-950 to-indigo-950",
    tagline: "Precious ochre sea stars, bat stars, and sunflower starfish.",
  },
  echinoidea: {
    heroUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    gradient: "from-indigo-950 via-purple-950 to-slate-900",
    tagline: "Spiny sea urchins and ocean sand dollars.",
  },
  annelida: {
    heroUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=600&q=80",
    gradient: "from-stone-950 via-emerald-950 to-amber-950",
    tagline: "Segmented ringed worms: earthworms, leeches, and polychaetes.",
  },
  clitellata: {
    heroUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1508672019048-805479767389?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950 via-stone-900 to-emerald-950",
    tagline: "Subterranean soil nightcrawlers and medicinal leeches.",
  },
};

export function getNodeCoverData(id?: string | null): ClassCoverData {
  if (!id) return CLASS_COVER_IMAGES.life;
  const key = id.toLowerCase();
  if (CLASS_COVER_IMAGES[key]) {
    return CLASS_COVER_IMAGES[key];
  }
  return {
    heroUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    gradient: "from-slate-950 via-emerald-950 to-teal-950",
    tagline: `Explore species, lineages, and taxonomy under ${id}.`,
  };
}
