export interface ClassCoverData {
  heroUrl: string;
  thumbnailUrl: string;
  gradient: string;
  tagline: string;
  attribution?: string;
  license?: string;
  sourceUrl?: string;
}

export const CLASS_COVER_IMAGES: Record<string, ClassCoverData> = {
  // --- ROOT & DOMAINS ---
  life: {
    heroUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-teal-900 to-emerald-900",
    tagline: "The interconnected web of Earth's 8.7+ million living species.",
  },
  bacteria: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/47562898/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/47562898/medium.jpg",
    attribution: "(c) NIAID, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/niaid/16578744517/",
    gradient: "from-cyan-950 via-blue-900 to-indigo-950",
    tagline:
      "Single-celled prokaryotic pioneers powering Earth's biogeochemical cycles.",
  },
  pseudomonadota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/58089762/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/58089762/medium.jpg",
    attribution: "no rights reserved, uploaded by Garrett Taylor",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/58089762",
    gradient: "from-indigo-950 via-purple-900 to-slate-900",
    tagline:
      "Metabolically versatile proteobacteria key to nitrogen fixation and symbiosis.",
  },
  bacillota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/5437799/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/5437799/medium.jpeg",
    attribution:
      "(c) Heather Pickard, some rights reserved (CC BY-NC), uploaded by Heather Pickard",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/5437799",
    gradient: "from-violet-950 via-fuchsia-950 to-slate-900",
    tagline:
      "Diverse bacteria including fermenters, gut symbionts, and endospore-forming lineages.",
  },
  actinomycetota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/350959879/original.png",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/350959879/medium.png",
    attribution:
      "(c) Josh McGinnis, some rights reserved (CC BY-NC), uploaded by Josh McGinnis",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/350959879",
    gradient: "from-purple-950 via-slate-900 to-amber-950",
    tagline:
      "High-GC Gram-positive bacteria including soil decomposers and antibiotic-producing lineages.",
  },
  cyanobacteriota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/20651/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/20651/medium.jpg",
    attribution: "(c) Ken-ichi Ueda, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "http://www.flickr.com/photos/18024068@N00/5337579171",
    gradient: "from-teal-950 via-emerald-900 to-cyan-950",
    tagline:
      "Photosynthetic blue-green algae that created Earth's oxygen-rich atmosphere.",
  },
  archaea: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/49424863/original.gif",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/49424863/medium.gif",
    attribution: "(c) Kaden11a, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl: "http://commons.wikimedia.org/wiki/File:Archaea.gif",
    gradient: "from-amber-950 via-red-950 to-orange-950",
    tagline:
      "Distinct prokaryotes central to methane cycling and abundant in oceans, soils, and extreme environments.",
  },
  euryarchaeota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1010570/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1010570/medium.jpg",
    attribution: "(c) Juan Sevilla, some rights reserved (CC BY-NC-ND)",
    license: "cc-by-nc-nd",
    sourceUrl: "https://www.flickr.com/photos/juaninda/4249952887/",
    gradient: "from-rose-950 via-orange-950 to-stone-900",
    tagline:
      "Methanogenic and extreme halophile archaea generating methane and vivid pink salt lakes.",
  },
  thermoproteota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/17079042/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/17079042/medium.jpg",
    attribution: "no rights reserved, uploaded by Eleanora (Norrie) Robbins",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/17079042",
    gradient: "from-red-950 via-amber-950 to-zinc-900",
    tagline:
      "Archaea including thermophiles, acidophiles, and globally abundant ammonia-oxidizing lineages.",
  },
  asgardarchaeota: {
    heroUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Promethearchaeum_syntrophicum.jpg?width=2000",
    thumbnailUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Promethearchaeum_syntrophicum.jpg?width=600",
    attribution: "Hiroyuki Imachi et al.",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Promethearchaeum_syntrophicum.jpg",
    gradient: "from-slate-950 via-indigo-950 to-purple-950",
    tagline:
      "The evolutionary bridge linking prokaryotes to complex eukaryotic life.",
  },

  // --- EUKARYOTA & KINGDOMS ---
  eukaryota: {
    heroUrl:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
    gradient: "from-emerald-950 via-teal-900 to-sky-950",
    tagline:
      "Organisms with nucleated cells: Plants, Fungi, Animals, and Protists.",
  },
  plantae: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/221830668/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/221830668/medium.jpg",
    attribution:
      "(c) Douglas Goldman, some rights reserved (CC BY-SA), uploaded by Douglas Goldman",
    license: "cc-by-sa",
    sourceUrl: "https://www.inaturalist.org/photos/221830668",
    gradient: "from-emerald-950 via-green-900 to-teal-950",
    tagline:
      "Multicellular autotrophs converting sunlight into chemical energy.",
  },
  bryophyta: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/5454866/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/5454866/medium.jpg",
    attribution: "no rights reserved, uploaded by Peter de Lange",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/5454866",
    gradient: "from-green-950 via-emerald-900 to-stone-900",
    tagline: "Mosses and carpet-forming non-vascular terrestrial flora.",
  },
  pteridophyta: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/11877598/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/11877598/medium.jpg",
    attribution: "(c) graibeard, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl: "https://www.flickr.com/photos/graibeard/3664314289/",
    gradient: "from-emerald-950 via-teal-950 to-green-900",
    tagline: "Ancient spore-bearing ferns dominating damp forest understories.",
  },
  gymnosperms: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/8663621/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/8663621/medium.jpg",
    attribution: "(c) harum.koh, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl: "https://www.flickr.com/photos/harumkoh/16339595339/",
    gradient: "from-stone-950 via-emerald-950 to-green-950",
    tagline:
      "Cone-bearing conifers, redwoods, and ancient cycads with naked seeds.",
  },
  angiosperms: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/395533182/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/395533182/medium.jpeg",
    attribution:
      "(c) Nolan Exe, some rights reserved (CC BY), uploaded by Nolan Exe",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/395533182",
    gradient: "from-rose-950 via-pink-950 to-emerald-950",
    tagline:
      "Flowering plants producing fruit and fueling terrestrial animal nutrition.",
  },
  fungi: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/71658193/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/71658193/medium.jpeg",
    attribution:
      "(c) Alan Rockefeller, some rights reserved (CC BY), uploaded by Alan Rockefeller",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/71658193",
    gradient: "from-amber-950 via-stone-900 to-purple-950",
    tagline:
      "Heterotrophic decomposers, mycorrhizal networks, and spore-forming fungi.",
  },
  ascomycota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/6160713/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/6160713/medium.jpg",
    attribution:
      "(c) Ken-ichi Ueda, some rights reserved (CC BY), uploaded by Ken-ichi Ueda",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/6160713",
    gradient: "from-purple-950 via-stone-950 to-amber-950",
    tagline: "Sac fungi including yeasts, lichens, truffles, and cup fungi.",
  },
  basidiomycota: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/160331738/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/160331738/medium.jpg",
    attribution:
      "(c) Christine Young, some rights reserved (CC BY), uploaded by Christine Young",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/160331738",
    gradient: "from-red-950 via-amber-950 to-stone-900",
    tagline:
      "Mushroom-forming fungi with gills, pore caps, and wood-decomposing mycelium.",
  },
  protists: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/157125794/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/157125794/medium.jpg",
    attribution:
      "(c) Bruce Taylor, some rights reserved (CC BY), uploaded by Bruce Taylor",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/157125794",
    gradient: "from-sky-950 via-indigo-950 to-teal-950",
    tagline:
      "Diverse eukaryotic single-celled organisms, seaweeds, and slime molds.",
  },
  alveolata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/18285445/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/18285445/medium.jpg",
    attribution:
      "(c) Cheng-Tao Lin, some rights reserved (CC BY), uploaded by Cheng-Tao Lin",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/18285445",
    gradient: "from-cyan-950 via-blue-950 to-slate-900",
    tagline: "Bioluminescent dinoflagellates, ocean plankton, and ciliates.",
  },
  amoebozoa: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/314138595/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/314138595/medium.jpg",
    attribution:
      "(c) Bruce Taylor, some rights reserved (CC BY), uploaded by Bruce Taylor",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/314138595",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline: "Pseudopodial amoebae and network-forming slime molds.",
  },
  stramenopiles: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/41475016/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/41475016/medium.jpg",
    attribution:
      "(c) Jonathan Lavan, underpressurephotog.com, some rights reserved (CC BY-NC), uploaded by Jonathan Lavan, underpressurephotog.com",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/41475016",
    gradient: "from-emerald-950 via-yellow-950 to-teal-950",
    tagline: "Golden giant kelp, diatoms, and brown marine algae forests.",
  },

  // --- ANIMALIA & CLASSES ---
  metazoa: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80678745/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80678745/medium.jpg",
    attribution: "no rights reserved, uploaded by Abhas Misraraj",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/80678745",
    gradient: "from-amber-950 via-orange-950 to-red-950",
    tagline:
      "Multicellular heterotrophs with specialized tissues and extraordinarily diverse body plans.",
  },
  chordata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80551845/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80551845/medium.jpg",
    attribution: "no rights reserved, uploaded by Abhas Misraraj",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/80551845",
    gradient: "from-blue-950 via-cyan-950 to-slate-900",
    tagline:
      "Animals defined by a notochord and dorsal nerve cord, including vertebrates, tunicates, and lancelets.",
  },
  mammalia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80551250/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/80551250/medium.jpg",
    attribution: "no rights reserved, uploaded by Abhas Misraraj",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/80551250",
    gradient: "from-amber-950 via-orange-900 to-yellow-950",
    tagline:
      "Endothermic vertebrates with hair and mammary glands that nourish their young.",
  },
  carnivora: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/12184979/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/12184979/medium.jpg",
    attribution: "(c) Matheus Swanson, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl: "https://www.flickr.com/photos/138866094@N02/24432473435/",
    gradient: "from-red-950 via-orange-950 to-amber-950",
    tagline:
      "Mammals adapted around carnassial teeth, from cats and wolves to bears, seals, and mongooses.",
  },
  felidae: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/210735004/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/210735004/medium.jpg",
    attribution:
      "(c) Darío De la Fuente, some rights reserved (CC BY), uploaded by Darío De la Fuente",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/210735004",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline:
      "Specialized feline predators combining stealth, flexible bodies, and powerful senses.",
  },
  canidae: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/401119144/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/401119144/medium.jpg",
    attribution: "(c) . Ray in Manila, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/rayinmanila/50938235812/",
    gradient: "from-stone-950 via-zinc-900 to-amber-950",
    tagline:
      "Social and solitary canines including wolves, foxes, jackals, and domestic dogs.",
  },
  ailuridae: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/48751/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/48751/medium.jpg",
    attribution: "(c) Adam Fagen, some rights reserved (CC BY-NC-SA)",
    license: "cc-by-nc-sa",
    sourceUrl: "http://www.flickr.com/photos/51035749109@N01/2526280594",
    gradient: "from-orange-950 via-amber-900 to-emerald-950",
    tagline:
      "Arboreal bamboo-eating red pandas native to high Himalayan forests.",
  },
  artiodactyla: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/19090371/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/19090371/medium.jpg",
    attribution: "(c) USFWS Mountain-Prairie, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/usfwsmtnprairie/23397440346/",
    gradient: "from-emerald-950 via-stone-900 to-amber-950",
    tagline:
      "Even-toed ungulates including deer, giraffes, hippos, and whales.",
  },
  proboscidea: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/8386350/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/8386350/medium.jpg",
    attribution:
      "(c) Jenny Donald, some rights reserved (CC BY-NC), uploaded by Jenny Donald",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/8386350",
    gradient: "from-amber-950 via-stone-900 to-orange-950",
    tagline:
      "Majestic pachyderms: African savanna, forest, and Asian elephants.",
  },
  rodentia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/169742365/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/169742365/medium.jpg",
    attribution:
      "(c) Gabriele Vaudano, some rights reserved (CC BY), uploaded by Gabriele Vaudano",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/169742365",
    gradient: "from-amber-950 via-yellow-950 to-stone-900",
    tagline: "Gnawing mammals with continuously growing incisors.",
  },
  aves: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/2946643/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/2946643/medium.jpg",
    attribution: "(c) Nigel Voaden, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/nvoaden/24076614343/",
    gradient: "from-sky-950 via-blue-900 to-indigo-950",
    tagline:
      "Feathered avian species spanning eagles, hummingbirds, and penguins.",
  },
  accipitriformes: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/117234831/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/117234831/medium.jpg",
    attribution: "(c) egorbirder, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/117234831",
    gradient: "from-amber-950 via-slate-900 to-sky-950",
    tagline: "Diurnal raptors with powerful talons and keen binocular vision.",
  },
  falconiformes: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/180819760/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/180819760/medium.jpg",
    attribution:
      "(c) Andrea Poggi, some rights reserved (CC BY), uploaded by Andrea Poggi",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/180819760",
    gradient: "from-slate-950 via-blue-950 to-indigo-950",
    tagline: "High-speed stooping falcons and kestrels.",
  },
  sphenisciformes: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/115182667/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/115182667/medium.jpg",
    attribution: "(c) ajott, some rights reserved (CC BY), uploaded by ajott",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/115182667",
    gradient: "from-cyan-950 via-blue-950 to-slate-950",
    tagline:
      "Flightless marine birds adapted for pursuit diving from polar coasts to temperate and tropical seas.",
  },
  reptilia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/341839492/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/341839492/medium.jpeg",
    attribution:
      "(c) Svend Hansen, some rights reserved (CC BY), uploaded by Svend Hansen",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/341839492",
    gradient: "from-emerald-950 via-stone-900 to-amber-950",
    tagline:
      "Ectothermic scaly reptiles: snakes, lizards, turtles, and crocodilians.",
  },
  squamata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/28516312/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/28516312/medium.jpeg",
    attribution:
      "(c) Wynand Uys, some rights reserved (CC BY), uploaded by Wynand Uys",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/28516312",
    gradient: "from-lime-950 via-emerald-950 to-stone-900",
    tagline: "Lizards, chameleons, geckos, and snakes with flexible jaws.",
  },
  testudines: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/70574154/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/70574154/medium.jpg",
    attribution: "(c) Roy Lowry, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/99817330@N02/24047631368/",
    gradient: "from-teal-950 via-emerald-950 to-cyan-950",
    tagline:
      "Ancient shelled sea turtles, Galapagos tortoises, and freshwater terrapins.",
  },
  crocodylia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/32333837/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/32333837/medium.jpeg",
    attribution: "no rights reserved, uploaded by Vijay Barve",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/32333837",
    gradient: "from-stone-950 via-emerald-950 to-amber-950",
    tagline: "Semi-aquatic ambush crocodilian archosaurs with armored scutes.",
  },
  amphibia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/257327849/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/257327849/medium.jpg",
    attribution:
      "(c) Plana Baptiste, some rights reserved (CC BY-NC), uploaded by Plana Baptiste",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/257327849",
    gradient: "from-emerald-950 via-lime-950 to-teal-950",
    tagline: "Permeable-skinned frogs, toads, salamanders, and axolotls.",
  },
  anura: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/2261717/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/2261717/medium.jpg",
    attribution:
      "(c) Jonathan Kolby, some rights reserved (CC BY-NC-ND), uploaded by Jonathan Kolby",
    license: "cc-by-nc-nd",
    sourceUrl: "https://www.inaturalist.org/photos/2261717",
    gradient: "from-emerald-950 via-green-900 to-teal-950",
    tagline: "Vibrant poison dart frogs, tree frogs, and vocal bullfrogs.",
  },
  urodela: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/126774452/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/126774452/medium.jpeg",
    attribution:
      "(c) Luís Lourenço, some rights reserved (CC BY-NC-ND), uploaded by Luís Lourenço",
    license: "cc-by-nc-nd",
    sourceUrl: "https://www.inaturalist.org/photos/126774452",
    gradient: "from-teal-950 via-cyan-950 to-stone-900",
    tagline: "Tailed salamanders, newts, and regenerative aquatic axolotls.",
  },
  actinopterygii: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/43767791/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/43767791/medium.jpeg",
    attribution:
      "(c) Dan Schofield, some rights reserved (CC BY), uploaded by Dan Schofield",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/43767791",
    gradient: "from-blue-950 via-teal-900 to-cyan-950",
    tagline:
      "Ray-finned bony fishes inhabiting ocean coral reefs, rivers, and deep abysses.",
  },
  elasmobranchii: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/11193947/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/11193947/medium.jpg",
    attribution:
      "(c) Erik Schlögl, some rights reserved (CC BY-NC), uploaded by Erik Schlögl",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/11193947",
    gradient: "from-blue-950 via-cyan-950 to-slate-950",
    tagline: "Cartilaginous sharks, manta rays, stingrays, and sawfish.",
  },
  holocephali: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/12499686/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/12499686/medium.jpg",
    attribution:
      "(c) Viktor V. Grøtan, some rights reserved (CC BY), uploaded by Viktor V. Grøtan",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/12499686",
    gradient: "from-indigo-950 via-slate-900 to-cyan-950",
    tagline:
      "Deep-water chimaeras, ratfishes, and ghost sharks with tooth plates and cartilaginous skeletons.",
  },
  sarcopterygii: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/129474/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/129474/medium.jpg",
    attribution: "(c) Joel Abroad, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "http://www.flickr.com/photos/40295335@N00/4840412198",
    gradient: "from-blue-950 via-indigo-950 to-stone-900",
    tagline:
      "Lobe-finned coelacanths and lungfishes bridging aquatic life to land tetrapods.",
  },
  myxini: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/15727711/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/15727711/medium.jpg",
    attribution:
      "(c) Peter Southwood, some rights reserved (CC BY-SA), uploaded by Peter Southwood",
    license: "cc-by-sa",
    sourceUrl: "https://www.inaturalist.org/photos/15727711",
    gradient: "from-slate-950 via-zinc-900 to-stone-950",
    tagline:
      "Jawless slime-producing benthic hagfishes of the deep ocean floor.",
  },
  petromyzontida: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/129635734/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/129635734/medium.jpeg",
    attribution:
      "(c) Patrick Furtado, some rights reserved (CC BY-NC), uploaded by Patrick Furtado",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/129635734",
    gradient: "from-slate-950 via-teal-950 to-indigo-950",
    tagline: "Jawless filter-feeding and parasitic eel-like lampreys.",
  },
  mollusca: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/155977031/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/155977031/medium.jpg",
    attribution:
      "(c) \nKah Kheng Lim, Susann Rossbach, Nathan R. Geraldi, Sebastian Schmidt-Roach, Ester A. Serrão and Carlos M. Duarte, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl:
      "http://commons.wikimedia.org/wiki/File:Red_Sea_Tridacna_maxima.jpg",
    gradient: "from-indigo-950 via-blue-900 to-cyan-950",
    tagline: "Soft-bodied mollusks: octopuses, sea slugs, clams, and chitons.",
  },
  cephalopoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/65399447/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/65399447/medium.jpg",
    attribution:
      "(c) Kai Squires, some rights reserved (CC BY), uploaded by Kai Squires",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/65399447",
    gradient: "from-indigo-950 via-purple-950 to-cyan-950",
    tagline: "Highly intelligent octopuses, squid, cuttlefish, and nautiluses.",
  },
  gastropoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/13725281/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/13725281/medium.jpg",
    attribution:
      "(c) rappman, some rights reserved (CC BY), uploaded by rappman",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/13725281",
    gradient: "from-cyan-950 via-teal-950 to-emerald-950",
    tagline: "Vibrant nudibranch sea dragons, land snails, and limpets.",
  },
  bivalvia: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/329068789/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/329068789/medium.jpg",
    attribution:
      "(c) L.J. Lamera, some rights reserved (CC BY), uploaded by L.J. Lamera",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/329068789",
    gradient: "from-teal-950 via-cyan-950 to-blue-950",
    tagline: "Two-shelled filter feeding giant clams, oysters, and scallops.",
  },
  polyplacophora: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/252155268/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/252155268/medium.jpeg",
    attribution:
      "(c) Saryu Mae 前 朝琉, some rights reserved (CC BY), uploaded by Saryu Mae 前 朝琉",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/252155268",
    gradient: "from-slate-950 via-teal-950 to-emerald-950",
    tagline: "Eight-plated marine chitons clinging to intertidal reefs.",
  },
  arthropoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/29402710/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/29402710/medium.jpg",
    attribution:
      "(c) Анатолий Озерной /Anatoliy Ozernoy, some rights reserved (CC BY-SA), uploaded by Анатолий Озерной /Anatoliy Ozernoy",
    license: "cc-by-sa",
    sourceUrl: "https://www.flickr.com/photos/153096874@N03/32544354758/",
    gradient: "from-amber-950 via-orange-950 to-stone-900",
    tagline: "Exoskeleton arthropods: insects, spiders, crabs, and millipedes.",
  },
  insecta: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/18333696/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/18333696/medium.jpeg",
    attribution:
      "(c) TOUROULT Julien, some rights reserved (CC BY), uploaded by TOUROULT Julien",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/18333696",
    gradient: "from-amber-950 via-emerald-950 to-orange-950",
    tagline:
      "Hexapod insects: Monarch butterflies, honey bees, beetles, and dragonflies.",
  },
  arachnida: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/471731657/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/471731657/medium.jpg",
    attribution:
      "(c) Rudolph Steenkamp, some rights reserved (CC BY-SA), uploaded by Rudolph Steenkamp",
    license: "cc-by-sa",
    sourceUrl: "https://www.inaturalist.org/photos/471731657",
    gradient: "from-indigo-950 via-purple-950 to-slate-900",
    tagline:
      "Eight-legged arachnids: jumping spiders, tarantulas, and scorpions.",
  },
  malacostraca: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4127/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4127/medium.jpg",
    attribution: "(c) Stefan Willoughby, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "http://www.flickr.com/photos/33082883@N02/3647086568",
    gradient: "from-rose-950 via-orange-950 to-cyan-950",
    tagline: "Peacock mantis shrimp, blue crabs, lobsters, and krill.",
  },
  diplopoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/178260580/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/178260580/medium.jpg",
    attribution:
      "(c) Zachary Dankowicz, some rights reserved (CC BY), uploaded by Zachary Dankowicz",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/178260580",
    gradient: "from-stone-950 via-amber-950 to-emerald-950",
    tagline: "Slow-moving detritivorous millipedes with double leg segments.",
  },
  chilopoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/6266117/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/6266117/medium.jpg",
    attribution:
      "(c) Judy Gallagher, some rights reserved (CC BY-SA), uploaded by Judy Gallagher",
    license: "cc-by-sa",
    sourceUrl: "https://www.inaturalist.org/photos/6266117",
    gradient: "from-red-950 via-amber-950 to-stone-900",
    tagline: "Venomous fast-hunting centipedes with front poison claws.",
  },
  maxillopoda: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/37629646/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/37629646/medium.jpg",
    attribution:
      "(c) Thomas Mesaglio, some rights reserved (CC BY), uploaded by Thomas Mesaglio",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/37629646",
    gradient: "from-cyan-950 via-teal-950 to-blue-950",
    tagline: "Gooseneck barnacles and ocean planktonic copepods.",
  },
  merostomata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/108988275/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/108988275/medium.jpg",
    attribution: "(c) leafgreeny, some rights reserved (CC BY-NC)",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/108988275",
    gradient: "from-stone-950 via-cyan-950 to-blue-950",
    tagline:
      "Ancient horseshoe crabs with armored bodies, book gills, and copper-blue blood.",
  },
  cnidaria: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/172587356/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/172587356/medium.jpg",
    attribution:
      "(c) Pauline Walsh Jacobson, some rights reserved (CC BY), uploaded by Pauline Walsh Jacobson",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/172587356",
    gradient: "from-indigo-950 via-purple-900 to-cyan-950",
    tagline: "Stinging cnidarians: jellyfish, corals, and sea anemones.",
  },
  anthozoa: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4440362/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4440362/medium.jpg",
    attribution: "(c) David R, some rights reserved (CC BY-NC)",
    license: "cc-by-nc",
    sourceUrl:
      "https://picasaweb.google.com/104623964081378888743/6314907583444350657#6314908721891926098",
    gradient: "from-rose-950 via-pink-950 to-teal-950",
    tagline: "Coral reef builders, sea anemones, and sea pens.",
  },
  hydrozoa: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/224965745/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/224965745/medium.jpg",
    attribution:
      "(c) Alex Shure, some rights reserved (CC BY-NC), uploaded by Alex Shure",
    license: "cc-by-nc",
    sourceUrl: "https://www.inaturalist.org/photos/224965745",
    gradient: "from-cyan-950 via-blue-950 to-indigo-950",
    tagline:
      "Colonial siphonophores including Portuguese man o' war and hydras.",
  },
  scyphozoa: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4266361/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/4266361/medium.jpg",
    attribution: "(c) Brian Gratwicke, some rights reserved (CC BY)",
    license: "cc-by",
    sourceUrl: "https://www.flickr.com/photos/briangratwicke/10338323223/",
    gradient: "from-purple-950 via-indigo-950 to-cyan-950",
    tagline: "Pulsating translucent true moon jellyfish and sea nettles.",
  },
  echinodermata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/13336415/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/13336415/medium.jpg",
    attribution:
      "(c) Bernard Picton, some rights reserved (CC BY), uploaded by Bernard Picton",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/13336415",
    gradient: "from-pink-950 via-purple-950 to-cyan-950",
    tagline:
      "Five-fold radial symmetry echinoderms: sea stars and sea urchins.",
  },
  asteroidea: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/162318518/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/162318518/medium.jpg",
    attribution: "(c) Hans Hillewaert, some rights reserved (CC BY-SA)",
    license: "cc-by-sa",
    sourceUrl: "http://commons.wikimedia.org/wiki/File:Asterias_rubens.jpg",
    gradient: "from-purple-950 via-pink-950 to-indigo-950",
    tagline:
      "Sea stars with regenerative arms, hydraulic tube feet, and remarkable predatory strategies.",
  },
  echinoidea: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/25060019/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/25060019/medium.jpg",
    attribution:
      "(c) Erasmo Macaya Horta, some rights reserved (CC BY), uploaded by Erasmo Macaya Horta",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/25060019",
    gradient: "from-indigo-950 via-purple-950 to-slate-900",
    tagline: "Spiny sea urchins and ocean sand dollars.",
  },
  annelida: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/112584134/original.jpeg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/112584134/medium.jpeg",
    attribution: "no rights reserved, uploaded by Alex Heyman",
    license: "cc0",
    sourceUrl: "https://www.inaturalist.org/photos/112584134",
    gradient: "from-stone-950 via-emerald-950 to-amber-950",
    tagline: "Segmented ringed worms: earthworms, leeches, and polychaetes.",
  },
  clitellata: {
    heroUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/106154331/original.jpg",
    thumbnailUrl:
      "https://inaturalist-open-data.s3.amazonaws.com/photos/106154331/medium.jpg",
    attribution:
      "(c) dhfischer, some rights reserved (CC BY), uploaded by dhfischer",
    license: "cc-by",
    sourceUrl: "https://www.inaturalist.org/photos/106154331",
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
  return CLASS_COVER_IMAGES.life;
}