import type { ActivityPattern, ConservationStatus, Continent } from "../types/animal";
import type { SpeciesSearchHit } from "../types/speciesStore";

export function inferClassFromHit(hit: Partial<SpeciesSearchHit>): string {
  const className = hit.class_name?.trim();
  if (className) {
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
  }

  const order = (hit.order_name || "").toLowerCase();
  const family = (hit.family || "").toLowerCase();

  // Mammalia orders/families
  if (
    ["carnivora", "primates", "rodentia", "cetacea", "chiroptera", "artiodactyla", "perissodactyla", "diprotodontia", "eulipotyphla", "lagomorpha", "proboscidea", "monotremata", "didelphimorphia", "cingulata", "pilosa", "sirenia"].includes(order) ||
    family.includes("felidae") || family.includes("canidae") || family.includes("ursidae") || family.includes("hominidae") || family.includes("bovidae") || family.includes("cervidae") || family.includes("muridae")
  ) {
    return "Mammalia";
  }

  // Aves orders
  if (
    ["passeriformes", "accipitriformes", "falconiformes", "anseriformes", "columbiformes", "psittaciformes", "charadriiformes", "pelecaniformes", "sphenisciformes", "strigiformes", "piciformes", "galliformes", "caprimulgiformes", "suliformes", "coraciiformes"].includes(order) ||
    family.includes("accipitridae") || family.includes("strigidae") || family.includes("anatidae") || family.includes("laridae") || family.includes("columbidae")
  ) {
    return "Aves";
  }

  // Reptilia
  if (
    ["squamata", "testudines", "crocodilia", "rhynchocephalia"].includes(order) ||
    family.includes("colubridae") || family.includes("viperidae") || family.includes("elapidae") || family.includes("gekkonidae") || family.includes("iguanidae")
  ) {
    return "Reptilia";
  }

  // Amphibia
  if (["anura", "caudata", "gymnophiona"].includes(order) || family.includes("ranidae") || family.includes("hylidae") || family.includes("bufonidae") || family.includes("salamandridae")) {
    return "Amphibia";
  }

  // Fish
  if (["perciformes", "cypriniformes", "siluriformes", "salmoniformes", "scorpaeniformes", "syngnathiformes", "tetraodontiformes", "gadiformes", "anguilliformes", "clupeiformes", "pleuronectiformes"].includes(order)) {
    return "Actinopterygii";
  }
  if (["carcharhiniformes", "lamniformes", "squaliformes", "rajiformes", "myliobatiformes", "orectolobiformes"].includes(order)) {
    return "Chondrichthyes";
  }

  // Insects & Arachnids
  if (["hymenoptera", "lepidoptera", "coleoptera", "diptera", "odonata", "orthoptera", "hemiptera", "mantodea"].includes(order)) {
    return "Insecta";
  }
  if (["araneae", "scorpiones", "ixodida"].includes(order)) {
    return "Arachnida";
  }

  return "Mammalia";
}

export function inferHabitatFromHit(hit: Partial<SpeciesSearchHit>): string {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  if (text.includes("coral") || text.includes("reef") || text.includes("clownfish") || text.includes("anemone")) return "Coral Reef";
  if (text.includes("ocean") || text.includes("whale") || text.includes("dolphin") || text.includes("shark") || text.includes("tuna") || text.includes("squid") || text.includes("octopus") || text.includes("jellyfish")) return "Ocean";
  if (text.includes("coast") || text.includes("seagull") || text.includes("pelican") || text.includes("crab") || text.includes("seal") || text.includes("sea lion") || text.includes("walrus")) return "Coastal";
  if (text.includes("desert") || text.includes("camel") || text.includes("sidewinder") || text.includes("fennec") || text.includes("gecko") || text.includes("scorpion")) return "Desert";
  if (text.includes("tundra") || text.includes("arctic") || text.includes("polar") || text.includes("penguin") || text.includes("walrus") || text.includes("reindeer") || text.includes("caribou")) return "Arctic & Tundra";
  if (text.includes("savannah") || text.includes("savanna") || text.includes("lion") || text.includes("cheetah") || text.includes("giraffe") || text.includes("zebra") || text.includes("hyena") || text.includes("wildebeest")) return "Savannah";
  if (text.includes("rainforest") || text.includes("amazon") || text.includes("jaguar") || text.includes("toucan") || text.includes("parrot") || text.includes("sloth") || text.includes("chameleon")) return "Tropical Rainforest";
  if (text.includes("wetland") || text.includes("marsh") || text.includes("swamp") || text.includes("alligator") || text.includes("crocodile") || text.includes("frog") || text.includes("toad") || text.includes("duck") || text.includes("heron")) return "Wetlands";
  if (text.includes("river") || text.includes("lake") || text.includes("trout") || text.includes("salmon") || text.includes("otter") || text.includes("beaver")) return "Freshwater";
  if (text.includes("mountain") || text.includes("alpine") || text.includes("ibex") || text.includes("yak") || text.includes("llama") || text.includes("snow leopard") || text.includes("eagle")) return "Mountains";
  if (text.includes("prairie") || text.includes("steppe") || text.includes("bison") || text.includes("antelope") || text.includes("kangaroo")) return "Grassland";

  const animalClass = inferClassFromHit(hit);
  if (animalClass === "Chondrichthyes" || animalClass === "Cephalopoda") return "Ocean";
  if (animalClass === "Actinopterygii") return "Ocean";
  if (animalClass === "Amphibia") return "Wetlands";
  if (animalClass === "Aves") return "Forest";
  if (animalClass === "Reptilia") return "Savannah";
  if (animalClass === "Insecta" || animalClass === "Arachnida") return "Grassland";

  return "Forest";
}

export function inferDietFromHit(hit: Partial<SpeciesSearchHit>): string {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""} ${hit.family || ""} ${hit.order_name || ""}`.toLowerCase();

  if (text.includes("eagle") || text.includes("hawk") || text.includes("falcon") || text.includes("owl") || text.includes("shark") || text.includes("wolf") || text.includes("lion") || text.includes("tiger") || text.includes("leopard") || text.includes("jaguar") || text.includes("snake") || text.includes("viper") || text.includes("crocodile") || text.includes("alligator")) return "Carnivore";
  if (text.includes("whale") || text.includes("dolphin") || text.includes("seal") || text.includes("otter") || text.includes("penguin") || text.includes("kingfisher") || text.includes("pelican") || text.includes("heron")) return "Piscivore";
  if (text.includes("deer") || text.includes("cow") || text.includes("sheep") || text.includes("goat") || text.includes("giraffe") || text.includes("zebra") || text.includes("elephant") || text.includes("rhino") || text.includes("hippo") || text.includes("rabbit") || text.includes("hare") || text.includes("sloth") || text.includes("koala") || text.includes("kangaroo")) return "Herbivore";
  if (text.includes("bat") || text.includes("frog") || text.includes("toad") || text.includes("chameleon") || text.includes("anteater") || text.includes("pangolin") || text.includes("spider") || text.includes("dragonfly")) return "Insectivore";
  if (text.includes("toucan") || text.includes("parrot") || text.includes("macaw") || text.includes("fruit bat")) return "Frugivore";
  if (text.includes("bear") || text.includes("pig") || text.includes("boar") || text.includes("monkey") || text.includes("chimpanzee") || text.includes("human") || text.includes("rat") || text.includes("mouse") || text.includes("crow") || text.includes("raven")) return "Omnivore";

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

  return ["Africa", "Asia"];
}

export function inferConservationStatusFromHit(hit: Partial<SpeciesSearchHit>): ConservationStatus {
  const text = `${hit.common_name || ""} ${hit.canonical_name || ""}`.toLowerCase();

  if (text.includes("rhino") || text.includes("gorilla") || text.includes("orangutan") || text.includes("saola") || text.includes("vaquita") || text.includes("kakapo")) return "Critically Endangered";
  if (text.includes("tiger") || text.includes("snow leopard") || text.includes("panda") || text.includes("asian elephant") || text.includes("blue whale") || text.includes("tasmanian devil")) return "Endangered";
  if (text.includes("lion") || text.includes("cheetah") || text.includes("hippo") || text.includes("polar bear") || text.includes("dugong") || text.includes("great white shark")) return "Vulnerable";
  if (text.includes("jaguar") || text.includes("narwhal") || text.includes("platypus")) return "Near Threatened";

  return "Least Concern";
}
