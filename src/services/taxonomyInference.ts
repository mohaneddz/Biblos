import type { ActivityPattern, ConservationStatus, Continent } from "../types/animal";
import type { SpeciesSearchHit } from "../types/speciesStore";

export function inferKingdomFromHit(hit: Partial<SpeciesSearchHit>): string {
  const kingdom = hit.kingdom?.trim();
  if (kingdom && kingdom.toLowerCase() !== "unknown") {
    return kingdom;
  }
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.scientific_name || ""} ${hit.phylum || ""} ${hit.class_name || ""}`.toLowerCase();
  if (text.includes("plant") || text.includes("tree") || text.includes("flower") || text.includes("moss") || text.includes("fern") || text.includes("bryophyta") || text.includes("magnoliophyta")) {
    return "Plantae";
  }
  if (text.includes("fungus") || text.includes("mushroom") || text.includes("yeast") || text.includes("ascomycota") || text.includes("basidiomycota")) {
    return "Fungi";
  }
  if (text.includes("bacteria") || text.includes("bacterium") || text.includes("bacillus") || text.includes("pseudomonas")) {
    return "Bacteria";
  }
  if (text.includes("archaea") || text.includes("methanogen") || text.includes("halophile")) {
    return "Archaea";
  }
  return "Animalia";
}

export function inferPhylumFromHit(hit: Partial<SpeciesSearchHit>): string {
  const phylum = hit.phylum?.trim();
  if (phylum && phylum.toLowerCase() !== "unknown") {
    return phylum;
  }
  const className = (hit.class_name || "").toLowerCase();
  const order = (hit.order_name || "").toLowerCase();
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  if (
    className.includes("mammal") || className.includes("ave") || className.includes("reptil") || className.includes("amphib") ||
    className.includes("actinopterygii") || className.includes("chondrichthyes") || className.includes("fish") ||
    ["carnivora", "artiodactyla", "primates", "rodentia", "passeriformes", "squamata", "anura", "testudines"].includes(order)
  ) {
    return "Chordata";
  }
  if (
    className.includes("insect") || className.includes("arachnid") || className.includes("malacostraca") || className.includes("crustacea") ||
    ["lepidoptera", "coleoptera", "hymenoptera", "diptera", "araneae", "scorpiones"].includes(order)
  ) {
    return "Arthropoda";
  }
  if (className.includes("cephalopod") || className.includes("gastropod") || className.includes("bivalv") || text.includes("octopus") || text.includes("squid") || text.includes("snail") || text.includes("slug")) {
    return "Mollusca";
  }
  if (text.includes("jellyfish") || text.includes("coral") || text.includes("anemone")) {
    return "Cnidaria";
  }
  if (text.includes("starfish") || text.includes("sea urchin") || text.includes("cucumber")) {
    return "Echinodermata";
  }
  if (inferKingdomFromHit(hit) === "Plantae") {
    return "Tracheophyta";
  }
  if (inferKingdomFromHit(hit) === "Fungi") {
    return "Basidiomycota";
  }
  return "Chordata";
}

export function inferClassFromHit(hit: Partial<SpeciesSearchHit>): string {
  const className = hit.class_name?.trim();
  if (className && className.toLowerCase() !== "unknown") {
    const lower = className.toLowerCase();
    if (lower.includes("mammal") || lower === "mammalia") return "Mammalia";
    if (lower.includes("bird") || lower.includes("ave") || lower === "aves") return "Aves";
    if (lower.includes("reptil") || lower === "reptilia") return "Reptilia";
    if (lower.includes("amphib") || lower === "amphibia") return "Amphibia";
    if (lower.includes("actinopterygii") || lower.includes("osteichthyes") || lower.includes("fish")) return "Actinopterygii";
    if (lower.includes("chondrichthyes") || lower.includes("elasmobranchii")) return "Chondrichthyes";
    if (lower.includes("insect") || lower === "insecta") return "Insecta";
    if (lower.includes("arachnid") || lower === "arachnida") return "Arachnida";
    if (lower.includes("cephalopod") || lower === "cephalopoda") return "Cephalopoda";
    if (lower.includes("gastropod") || lower === "gastropoda") return "Gastropoda";
    if (lower.includes("malacostraca") || lower.includes("crustacea")) return "Malacostraca";
    return className;
  }

  const order = (hit.order_name || "").toLowerCase();
  const family = (hit.family || "").toLowerCase();
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  // Mammalia orders/families
  if (
    ["carnivora", "primates", "rodentia", "cetacea", "chiroptera", "artiodactyla", "perissodactyla", "diprotodontia", "eulipotyphla", "lagomorpha", "proboscidea", "monotremata", "didelphimorphia", "cingulata", "pilosa", "sirenia"].includes(order) ||
    family.includes("felidae") || family.includes("canidae") || family.includes("ursidae") || family.includes("hominidae") || family.includes("bovidae") || family.includes("cervidae") || family.includes("muridae") ||
    text.includes("bear") || text.includes("lion") || text.includes("wolf") || text.includes("whale") || text.includes("dolphin") || text.includes("elephant")
  ) {
    return "Mammalia";
  }

  // Aves orders
  if (
    ["passeriformes", "accipitriformes", "falconiformes", "anseriformes", "columbiformes", "psittaciformes", "charadriiformes", "pelecaniformes", "sphenisciformes", "strigiformes", "piciformes", "galliformes", "caprimulgiformes", "suliformes", "coraciiformes"].includes(order) ||
    family.includes("accipitridae") || family.includes("strigidae") || family.includes("anatidae") || family.includes("laridae") || family.includes("columbidae") ||
    text.includes("eagle") || text.includes("falcon") || text.includes("owl") || text.includes("penguin") || text.includes("duck") || text.includes("parrot")
  ) {
    return "Aves";
  }

  // Reptilia
  if (
    ["squamata", "testudines", "crocodilia", "rhynchocephalia"].includes(order) ||
    family.includes("colubridae") || family.includes("viperidae") || family.includes("elapidae") || family.includes("gekkonidae") || family.includes("iguanidae") ||
    text.includes("snake") || text.includes("turtle") || text.includes("lizard") || text.includes("dragon") || text.includes("crocodile") || text.includes("alligator")
  ) {
    return "Reptilia";
  }

  // Amphibia
  if (["anura", "caudata", "gymnophiona", "urodela"].includes(order) || family.includes("ranidae") || family.includes("hylidae") || family.includes("bufonidae") || family.includes("salamandridae") || family.includes("dendrobatidae") || text.includes("frog") || text.includes("toad") || text.includes("salamander") || text.includes("axolotl")) {
    return "Amphibia";
  }

  // Fish
  if (["perciformes", "cypriniformes", "siluriformes", "salmoniformes", "scorpaeniformes", "syngnathiformes", "tetraodontiformes", "gadiformes", "anguilliformes", "clupeiformes", "pleuronectiformes"].includes(order) || text.includes("salmon") || text.includes("tuna") || text.includes("clownfish")) {
    return "Actinopterygii";
  }
  if (["carcharhiniformes", "lamniformes", "squaliformes", "rajiformes", "myliobatiformes", "orectolobiformes"].includes(order) || text.includes("shark") || text.includes("ray")) {
    return "Chondrichthyes";
  }

  // Cephalopoda
  if (["octopoda", "teuthida", "sepida"].includes(order) || text.includes("octopus") || text.includes("squid") || text.includes("cuttlefish")) {
    return "Cephalopoda";
  }

  // Insects & Arachnids
  if (["hymenoptera", "lepidoptera", "coleoptera", "diptera", "odonata", "orthoptera", "hemiptera", "mantodea"].includes(order) || text.includes("butterfly") || text.includes("bee") || text.includes("ant") || text.includes("beetle")) {
    return "Insecta";
  }
  if (["araneae", "scorpiones", "ixodida"].includes(order) || text.includes("spider") || text.includes("scorpion")) {
    return "Arachnida";
  }

  return "Mammalia";
}

export function inferOrderFromHit(hit: Partial<SpeciesSearchHit>): string {
  const order = hit.order_name?.trim();
  if (order && order.toLowerCase() !== "unknown") {
    return order;
  }
  const family = (hit.family || "").toLowerCase();
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  if (family.includes("felidae") || family.includes("canidae") || family.includes("ursidae") || family.includes("hyaenidae") || text.includes("lion") || text.includes("tiger") || text.includes("wolf") || text.includes("fox") || text.includes("bear")) {
    return "Carnivora";
  }
  if (family.includes("bovidae") || family.includes("cervidae") || family.includes("giraffidae") || family.includes("delphinidae") || family.includes("balaenopteridae") || text.includes("whale") || text.includes("dolphin") || text.includes("deer") || text.includes("bison")) {
    return "Artiodactyla";
  }
  if (family.includes("hominidae") || family.includes("cercopithecidae") || text.includes("monkey") || text.includes("ape") || text.includes("gorilla") || text.includes("chimpanzee")) {
    return "Primates";
  }
  if (family.includes("muridae") || family.includes("caviidae") || text.includes("rat") || text.includes("mouse") || text.includes("capybara") || text.includes("squirrel")) {
    return "Rodentia";
  }
  if (family.includes("elephantidae") || text.includes("elephant")) {
    return "Proboscidea";
  }
  if (family.includes("accipitridae") || text.includes("eagle") || text.includes("hawk")) {
    return "Accipitriformes";
  }
  if (family.includes("falconidae") || text.includes("falcon")) {
    return "Falconiformes";
  }
  if (family.includes("spheniscidae") || text.includes("penguin")) {
    return "Sphenisciformes";
  }
  if (family.includes("cheloniidae") || family.includes("testudinidae") || text.includes("turtle") || text.includes("tortoise")) {
    return "Testudines";
  }
  if (family.includes("viperidae") || family.includes("elapidae") || family.includes("colubridae") || family.includes("varanidae") || text.includes("snake") || text.includes("lizard") || text.includes("dragon")) {
    return "Squamata";
  }
  if (family.includes("dendrobatidae") || family.includes("ranidae") || family.includes("hylidae") || text.includes("frog") || text.includes("toad")) {
    return "Anura";
  }
  if (family.includes("ambystomatidae") || text.includes("salamander") || text.includes("axolotl")) {
    return "Urodela";
  }
  if (family.includes("enteroctopodidae") || family.includes("octopodidae") || text.includes("octopus")) {
    return "Octopoda";
  }

  const cls = inferClassFromHit(hit);
  if (cls === "Mammalia") return "Carnivora";
  if (cls === "Aves") return "Passeriformes";
  if (cls === "Reptilia") return "Squamata";
  if (cls === "Amphibia") return "Anura";
  if (cls === "Actinopterygii") return "Perciformes";
  if (cls === "Chondrichthyes") return "Carcharhiniformes";
  if (cls === "Insecta") return "Coleoptera";
  if (cls === "Arachnida") return "Araneae";
  if (cls === "Cephalopoda") return "Octopoda";
  return "General";
}

export function inferFamilyFromHit(hit: Partial<SpeciesSearchHit>): string {
  const family = hit.family?.trim();
  if (family && family.toLowerCase() !== "unknown") {
    return family;
  }
  const order = (hit.order_name || inferOrderFromHit(hit)).toLowerCase();
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  if (text.includes("lion") || text.includes("tiger") || text.includes("leopard") || text.includes("cheetah") || text.includes("jaguar") || text.includes("cat")) return "Felidae";
  if (text.includes("wolf") || text.includes("fox") || text.includes("dog") || text.includes("jackal") || text.includes("coyote")) return "Canidae";
  if (text.includes("bear") || text.includes("grizzly") || text.includes("polar bear")) return "Ursidae";
  if (text.includes("eagle") || text.includes("hawk")) return "Accipitridae";
  if (text.includes("falcon")) return "Falconidae";
  if (text.includes("penguin")) return "Spheniscidae";
  if (text.includes("octopus")) return "Enteroctopodidae";
  if (text.includes("whale")) return "Balaenopteridae";
  if (text.includes("dolphin")) return "Delphinidae";
  if (text.includes("elephant")) return "Elephantidae";
  if (text.includes("turtle")) return "Cheloniidae";
  if (text.includes("frog")) return "Dendrobatidae";
  if (text.includes("panda")) return "Ailuridae";

  if (order === "carnivora") return "Felidae";
  if (order === "artiodactyla") return "Bovidae";
  if (order === "rodentia") return "Muridae";
  if (order === "primates") return "Hominidae";
  if (order === "accipitriformes") return "Accipitridae";
  if (order === "falconiformes") return "Falconidae";
  if (order === "squamata") return "Varanidae";
  if (order === "anura") return "Ranidae";

  return `${hit.genus || "Unclassified"}idae`;
}

export function inferGenusFromHit(hit: Partial<SpeciesSearchHit>): string {
  const genus = hit.genus?.trim();
  if (genus && genus.toLowerCase() !== "unknown") {
    return genus;
  }
  const canonical = (hit.canonical_name || hit.scientific_name || "").trim();
  if (canonical) {
    const parts = canonical.split(/\s+/);
    if (parts.length > 0 && parts[0].length > 1) {
      return parts[0];
    }
  }
  const common = (hit.common_name || "").trim();
  if (common) {
    const words = common.split(/\s+/);
    return words[words.length - 1];
  }
  return "Unknown";
}

export function inferHabitatFromHit(hit: Partial<SpeciesSearchHit>): string {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  if (text.includes("coral") || text.includes("reef") || text.includes("clownfish") || text.includes("anemone")) return "Coral Reef";
  if (text.includes("ocean") || text.includes("whale") || text.includes("dolphin") || text.includes("shark") || text.includes("tuna") || text.includes("squid") || text.includes("octopus") || text.includes("jellyfish")) return "Ocean";
  if (text.includes("coast") || text.includes("seagull") || text.includes("pelican") || text.includes("crab") || text.includes("seal") || text.includes("sea lion") || text.includes("walrus")) return "Coast";
  if (text.includes("desert") || text.includes("camel") || text.includes("sidewinder") || text.includes("fennec") || text.includes("gecko") || text.includes("scorpion")) return "Desert";
  if (text.includes("tundra") || text.includes("arctic") || text.includes("polar") || text.includes("penguin") || text.includes("walrus") || text.includes("reindeer") || text.includes("caribou")) return "Arctic";
  if (text.includes("savannah") || text.includes("savanna") || text.includes("lion") || text.includes("cheetah") || text.includes("giraffe") || text.includes("zebra") || text.includes("hyena") || text.includes("wildebeest")) return "Savannah";
  if (text.includes("rainforest") || text.includes("amazon") || text.includes("jaguar") || text.includes("toucan") || text.includes("parrot") || text.includes("sloth") || text.includes("chameleon")) return "Rainforest";
  if (text.includes("wetland") || text.includes("marsh") || text.includes("swamp") || text.includes("alligator") || text.includes("crocodile") || text.includes("frog") || text.includes("toad") || text.includes("duck") || text.includes("heron")) return "Freshwater";
  if (text.includes("river") || text.includes("lake") || text.includes("trout") || text.includes("salmon") || text.includes("otter") || text.includes("beaver")) return "Freshwater";
  if (text.includes("mountain") || text.includes("alpine") || text.includes("ibex") || text.includes("yak") || text.includes("llama") || text.includes("snow leopard") || text.includes("eagle")) return "Forest";
  if (text.includes("prairie") || text.includes("steppe") || text.includes("bison") || text.includes("antelope") || text.includes("kangaroo")) return "Grassland";

  const animalClass = inferClassFromHit(hit);
  if (animalClass === "Chondrichthyes" || animalClass === "Cephalopoda" || animalClass === "Actinopterygii") return "Ocean";
  if (animalClass === "Amphibia") return "Freshwater";
  if (animalClass === "Aves") return "Forest";
  if (animalClass === "Reptilia") return "Savannah";
  if (animalClass === "Insecta" || animalClass === "Arachnida") return "Grassland";

  return "Forest";
}

export function inferDietFromHit(hit: Partial<SpeciesSearchHit>): string {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  // Piscivore
  if (text.includes("piscivore") || text.includes("kingfisher") || text.includes("osprey") || text.includes("pelican") || text.includes("heron") || text.includes("cormorant") || text.includes("otter") || text.includes("seal") || text.includes("walrus") || text.includes("sea lion")) return "Piscivore";

  // Filter Feeder
  if (text.includes("filter feeder") || text.includes("plankton") || text.includes("krill") || text.includes("baleen") || text.includes("basking shark") || text.includes("whale shark") || text.includes("manta ray")) return "Filter Feeder";

  // Detritivore
  if (text.includes("detritivore") || text.includes("earthworm") || text.includes("fungus") || text.includes("mushroom") || text.includes("decay")) return "Detritivore";

  // Autotroph
  if (text.includes("autotroph") || text.includes("plant") || text.includes("algae") || text.includes("tree") || text.includes("moss") || text.includes("fern")) return "Autotroph";

  // General Carnivores
  if (text.includes("eagle") || text.includes("hawk") || text.includes("falcon") || text.includes("owl") || text.includes("shark") || text.includes("wolf") || text.includes("lion") || text.includes("tiger") || text.includes("leopard") || text.includes("jaguar") || text.includes("snake") || text.includes("viper") || text.includes("crocodile") || text.includes("alligator") || text.includes("whale") || text.includes("dolphin")) return "Carnivore";

  // Herbivores
  if (text.includes("deer") || text.includes("cow") || text.includes("sheep") || text.includes("goat") || text.includes("giraffe") || text.includes("zebra") || text.includes("elephant") || text.includes("rhino") || text.includes("hippo") || text.includes("rabbit") || text.includes("hare") || text.includes("sloth") || text.includes("koala") || text.includes("kangaroo") || text.includes("panda")) return "Herbivore";

  // Insectivores
  if (text.includes("bat") || text.includes("frog") || text.includes("toad") || text.includes("chameleon") || text.includes("anteater") || text.includes("pangolin") || text.includes("spider") || text.includes("dragonfly") || text.includes("insect") || text.includes("wasp") || text.includes("bee") || text.includes("ant")) return "Insectivore";

  // Omnivores & Frugivores
  if (text.includes("toucan") || text.includes("parrot") || text.includes("macaw") || text.includes("fruit bat")) return "Omnivore";
  if (text.includes("bear") || text.includes("pig") || text.includes("boar") || text.includes("monkey") || text.includes("chimpanzee") || text.includes("human") || text.includes("rat") || text.includes("mouse") || text.includes("crow") || text.includes("raven")) return "Omnivore";

  const kingdom = inferKingdomFromHit(hit);
  if (kingdom === "Plantae") return "Autotroph";
  if (kingdom === "Fungi") return "Detritivore";

  const animalClass = inferClassFromHit(hit);
  if (animalClass === "Reptilia" || animalClass === "Chondrichthyes" || animalClass === "Cephalopoda") return "Carnivore";
  if (animalClass === "Actinopterygii") return "Piscivore";
  if (animalClass === "Amphibia" || animalClass === "Insecta" || animalClass === "Arachnida") return "Insectivore";

  return "Omnivore";
}

export function inferActivityPatternFromHit(hit: Partial<SpeciesSearchHit>): ActivityPattern {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  if (text.includes("owl") || text.includes("bat") || text.includes("gecko") || text.includes("racoon") || text.includes("raccoon") || text.includes("moth") || text.includes("scorpion") || text.includes("panther") || text.includes("leopard") || text.includes("hyena") || text.includes("hedgehog")) return "Nocturnal";
  if (text.includes("cat") || text.includes("lion") || text.includes("tiger") || text.includes("deer") || text.includes("rabbit") || text.includes("mosquito")) return "Crepuscular";
  if (text.includes("lemur") || text.includes("fossa") || text.includes("camel")) return "Cathemeral";

  return "Diurnal";
}

export function inferContinentsFromHit(hit: Partial<SpeciesSearchHit>): Continent[] {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  if (text.includes("whale") || text.includes("dolphin") || text.includes("shark") || text.includes("squid") || text.includes("octopus") || text.includes("tuna") || text.includes("coral") || text.includes("jellyfish")) return ["Oceans"];
  if (text.includes("penguin") || text.includes("polar bear") || text.includes("walrus")) return ["Antarctica"];
  if (text.includes("kangaroo") || text.includes("koala") || text.includes("platypus") || text.includes("kiwi") || text.includes("wombat") || text.includes("emu") || text.includes("tasmanian devil")) return ["Australia"];
  if (text.includes("lemur") || text.includes("tenrec") || text.includes("fossa") || text.includes("lion") || text.includes("giraffe") || text.includes("zebra") || text.includes("hippo") || text.includes("gorilla") || text.includes("chimpanzee")) return ["Africa"];
  if (text.includes("panda") || text.includes("tiger") || text.includes("snow leopard") || text.includes("orangutan") || text.includes("cobra")) return ["Asia"];
  if (text.includes("jaguar") || text.includes("llama") || text.includes("sloth") || text.includes("toucan") || text.includes("anaconda") || text.includes("capybara") || text.includes("armadillo")) return ["South America"];
  if (text.includes("bison") || text.includes("grizzly") || text.includes("raccoon") || text.includes("rattlesnake") || text.includes("bald eagle")) return ["North America"];
  if (text.includes("ibex") || text.includes("hedgehog") || text.includes("chamoise")) return ["Europe"];

  const animalClass = inferClassFromHit(hit);
  if (animalClass === "Chondrichthyes" || animalClass === "Cephalopoda") return ["Oceans"];

  return ["Unknown"];
}

export function inferConservationStatusFromHit(hit: Partial<SpeciesSearchHit>): ConservationStatus {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  if (text.includes("axolotl") || text.includes("vaquita") || text.includes("saola") || text.includes("kakapo") || text.includes("rhino") || text.includes("gorilla") || text.includes("orangutan")) return "Critically Endangered";
  if (text.includes("tiger") || text.includes("snow leopard") || text.includes("panda") || text.includes("asian elephant") || text.includes("blue whale") || text.includes("tasmanian devil")) return "Endangered";
  if (text.includes("lion") || text.includes("cheetah") || text.includes("hippo") || text.includes("polar bear") || text.includes("dugong") || text.includes("great white shark")) return "Vulnerable";
  if (text.includes("jaguar") || text.includes("narwhal") || text.includes("platypus")) return "Near Threatened";
  if (text.includes("dodo") || text.includes("mammoth") || text.includes("thylacine") || text.includes("passenger pigeon") || text.includes("extinct")) return "Extinct";

  return "Least Concern";
}
