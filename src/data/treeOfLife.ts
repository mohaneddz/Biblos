import { animals } from "./animals";

export type TaxonomyIcon =
  | "life"
  | "microbe"
  | "archaea"
  | "leaf"
  | "fungi"
  | "animal"
  | "invertebrate"
  | "chordate"
  | "mammal"
  | "bird"
  | "reptile"
  | "amphibian"
  | "marine"
  | "family"
  | "genus"
  | "species";

export type TreeNode = {
  id: string;
  label: string;
  rank: string;
  description: string;
  wikiTitle?: string;
  icon: TaxonomyIcon;
  scope?: Partial<Record<"kingdom" | "phylum" | "className" | "order" | "family" | "genus" | "species", string>>;
  speciesIds?: string[];
  children?: TreeNode[];
};

const staticLifeTree: TreeNode = {
  id: "life",
  label: "Life",
  rank: "Root",
  description: "A broad canonical tree of life based on major domains and eukaryotic lineages, with the local Biblos species directory wired into the branches that map cleanly to indexed species.",
  wikiTitle: "Tree of life (biology)",
  icon: "life",
  children: [
    {
      id: "bacteria",
      label: "Bacteria",
      rank: "Domain",
      description: "Single-celled prokaryotes with extraordinary metabolic diversity, ranging from soil decomposers to cyanobacteria that shaped Earth's atmosphere.",
      wikiTitle: "Bacteria",
      icon: "microbe",
      children: [
        {
          id: "pseudomonadota",
          label: "Pseudomonadota",
          rank: "Phylum",
          description: "A major bacterial phylum that includes many familiar symbionts, decomposers, and pathogens.",
          wikiTitle: "Pseudomonadota",
          icon: "microbe",
        },
        {
          id: "bacillota",
          label: "Bacillota",
          rank: "Phylum",
          description: "Gram-positive bacteria that include fermenters, decomposers, and many medically important lineages.",
          wikiTitle: "Bacillota",
          icon: "microbe",
        },
        {
          id: "actinomycetota",
          label: "Actinomycetota",
          rank: "Phylum",
          description: "Filamentous and soil-dwelling bacteria known for decomposition and antibiotic production.",
          wikiTitle: "Actinomycetota",
          icon: "microbe",
        },
        {
          id: "cyanobacteriota",
          label: "Cyanobacteriota",
          rank: "Phylum",
          description: "Photosynthetic bacteria that played a major role in oxygenating the planet.",
          wikiTitle: "Cyanobacteria",
          icon: "microbe",
        },
      ],
    },
    {
      id: "archaea",
      label: "Archaea",
      rank: "Domain",
      description: "Prokaryotes with distinctive membranes and biochemistry, many adapted to extreme or chemically unusual environments.",
      wikiTitle: "Archaea",
      icon: "archaea",
      children: [
        {
          id: "euryarchaeota",
          label: "Euryarchaeota",
          rank: "Phylum",
          description: "Includes methanogens, halophiles, and other metabolically unusual archaeal groups.",
          wikiTitle: "Euryarchaeota",
          icon: "archaea",
        },
        {
          id: "thermoproteota",
          label: "Thermoproteota",
          rank: "Phylum",
          description: "A prominent archaeal phylum associated with hot, acidic, and chemically extreme habitats.",
          wikiTitle: "Crenarchaeota",
          icon: "archaea",
        },
        {
          id: "asgardarchaeota",
          label: "Asgardarchaeota",
          rank: "Superphylum",
          description: "A lineage of archaea notable for its evolutionary connection to the rise of complex eukaryotic cells.",
          wikiTitle: "Asgard (archaea)",
          icon: "archaea",
        },
      ],
    },
    {
      id: "eukaryota",
      label: "Eukaryota",
      rank: "Domain",
      description: "Complex cells with nuclei and organelles, encompassing plants, fungi, and many single-celled lineages.",
      wikiTitle: "Eukaryote",
      icon: "life",
      children: [
        {
          id: "plantae",
          label: "Plantae",
          rank: "Kingdom",
          description: "Photosynthetic multicellular organisms that anchor most terrestrial food webs.",
          wikiTitle: "Plant",
          icon: "leaf",
          children: [
            {
              id: "bryophyta",
              label: "Bryophyta",
              rank: "Division",
              description: "Mosses and related non-vascular plants.",
              wikiTitle: "Bryophyte",
              icon: "leaf",
            },
            {
              id: "pteridophyta",
              label: "Pteridophyta",
              rank: "Division",
              description: "Ferns and related vascular plants that reproduce by spores.",
              wikiTitle: "Fern",
              icon: "leaf",
            },
            {
              id: "gymnosperms",
              label: "Gymnosperms",
              rank: "Clade",
              description: "Seed plants such as conifers, cycads, and ginkgo.",
              wikiTitle: "Gymnosperm",
              icon: "leaf",
            },
            {
              id: "angiosperms",
              label: "Angiosperms",
              rank: "Clade",
              description: "Flowering plants that dominate most modern terrestrial ecosystems.",
              wikiTitle: "Flowering plant",
              icon: "leaf",
            },
          ],
        },
        {
          id: "fungi",
          label: "Fungi",
          rank: "Kingdom",
          description: "Absorptive heterotrophs that drive decomposition, symbiosis, and disease ecology.",
          wikiTitle: "Fungus",
          icon: "fungi",
          children: [
            {
              id: "ascomycota",
              label: "Ascomycota",
              rank: "Phylum",
              description: "Sac fungi, including yeasts, lichens, and many molds.",
              wikiTitle: "Ascomycota",
              icon: "fungi",
            },
            {
              id: "basidiomycota",
              label: "Basidiomycota",
              rank: "Phylum",
              description: "Mushroom-forming fungi, rusts, smuts, and many wood decomposers.",
              wikiTitle: "Basidiomycota",
              icon: "fungi",
            },
          ],
        },
        {
          id: "protists",
          label: "Protist-grade Lineages",
          rank: "Assemblage",
          description: "A practical umbrella for many diverse eukaryotic lineages that are neither plants, fungi, nor animals.",
          wikiTitle: "Protist",
          icon: "microbe",
          children: [
            {
              id: "alveolata",
              label: "Alveolata",
              rank: "Clade",
              description: "Includes ciliates, apicomplexans, and dinoflagellates.",
              wikiTitle: "Alveolata",
              icon: "microbe",
            },
            {
              id: "amoebozoa",
              label: "Amoebozoa",
              rank: "Clade",
              description: "Amoeboid eukaryotes and slime molds.",
              wikiTitle: "Amoebozoa",
              icon: "microbe",
            },
            {
              id: "stramenopiles",
              label: "Stramenopiles",
              rank: "Clade",
              description: "Includes diatoms, brown algae, and water molds.",
              wikiTitle: "Stramenopiles",
              icon: "microbe",
            },
          ],
        },
        {
          id: "metazoa",
          label: "Metazoa",
          rank: "Kingdom",
          description: "Multicellular animals spanning vertebrates, mollusks, arthropods, and many other body plans.",
          wikiTitle: "Animal",
          icon: "animal",
          children: [
            {
              id: "chordata",
              label: "Chordata",
              rank: "Phylum",
              description: "Animals with a notochord at some life stage, including all vertebrates.",
              wikiTitle: "Chordate",
              icon: "chordate",
              scope: { phylum: "Chordata" },
              children: [
                {
                  id: "mammalia",
                  label: "Mammalia",
                  rank: "Class",
                  description: "Warm-blooded mammals with hair and milk-producing glands.",
                  wikiTitle: "Mammal",
                  icon: "mammal",
                  scope: { className: "Mammalia" },
                  children: [
                    {
                      id: "carnivora",
                      label: "Carnivora",
                      rank: "Order",
                      description: "Predatory and omnivorous mammals including cats, dogs, and bears.",
                      wikiTitle: "Carnivora",
                      icon: "mammal",
                      scope: { order: "Carnivora" },
                      children: [
                        {
                          id: "felidae",
                          label: "Felidae",
                          rank: "Family",
                          description: "Cats: streamlined hunters with retractable claws and acute senses.",
                          wikiTitle: "Felidae",
                          icon: "family",
                          scope: { family: "Felidae" },
                        },
                        {
                          id: "canidae",
                          label: "Canidae",
                          rank: "Family",
                          description: "Dogs, wolves, and foxes, often highly social and adaptable.",
                          wikiTitle: "Canidae",
                          icon: "family",
                          scope: { family: "Canidae" },
                        },
                        {
                          id: "ailuridae",
                          label: "Ailuridae",
                          rank: "Family",
                          description: "Red panda lineage of mountain forest specialists.",
                          wikiTitle: "Ailuridae",
                          icon: "family",
                          scope: { family: "Ailuridae" },
                        },
                      ],
                    },
                    {
                      id: "artiodactyla",
                      label: "Artiodactyla",
                      rank: "Order",
                      description: "Even-toed ungulates and close relatives including whales and deer-line mammals.",
                      wikiTitle: "Artiodactyla",
                      icon: "mammal",
                      scope: { order: "Artiodactyla" },
                    },
                    {
                      id: "proboscidea",
                      label: "Proboscidea",
                      rank: "Order",
                      description: "Elephants and their extinct relatives, defined by trunks and large body size.",
                      wikiTitle: "Proboscidea",
                      icon: "mammal",
                      scope: { order: "Proboscidea" },
                    },
                    {
                      id: "rodentia",
                      label: "Rodentia",
                      rank: "Order",
                      description: "Gnawing mammals with continuously growing incisors.",
                      wikiTitle: "Rodent",
                      icon: "mammal",
                      scope: { order: "Rodentia" },
                    },
                  ],
                },
                {
                  id: "aves",
                  label: "Aves",
                  rank: "Class",
                  description: "Feathered, beaked vertebrates adapted for flight, diving, and many other niches.",
                  wikiTitle: "Bird",
                  icon: "bird",
                  scope: { className: "Aves" },
                  children: [
                    {
                      id: "accipitriformes",
                      label: "Accipitriformes",
                      rank: "Order",
                      description: "Eagles, hawks, and other day-active birds of prey.",
                      wikiTitle: "Accipitriformes",
                      icon: "bird",
                      scope: { order: "Accipitriformes" },
                    },
                    {
                      id: "falconiformes",
                      label: "Falconiformes",
                      rank: "Order",
                      description: "Fast-flying falcons and their allies.",
                      wikiTitle: "Falconiformes",
                      icon: "bird",
                      scope: { order: "Falconiformes" },
                    },
                    {
                      id: "sphenisciformes",
                      label: "Sphenisciformes",
                      rank: "Order",
                      description: "Penguins adapted to diving and life in cold marine environments.",
                      wikiTitle: "Penguin",
                      icon: "bird",
                      scope: { order: "Sphenisciformes" },
                    },
                  ],
                },
                {
                  id: "reptilia",
                  label: "Reptilia",
                  rank: "Class",
                  description: "Scaly vertebrates including lizards, turtles, snakes, and crocodilians.",
                  wikiTitle: "Reptile",
                  icon: "reptile",
                  scope: { className: "Reptilia" },
                  children: [
                    {
                      id: "squamata",
                      label: "Squamata",
                      rank: "Order",
                      description: "Lizards and snakes with the most species-rich reptile lineage.",
                      wikiTitle: "Squamata",
                      icon: "reptile",
                      scope: { order: "Squamata" },
                    },
                    {
                      id: "testudines",
                      label: "Testudines",
                      rank: "Order",
                      description: "Turtles and tortoises with shells built from fused ribs and vertebrae.",
                      wikiTitle: "Turtle",
                      icon: "reptile",
                      scope: { order: "Testudines" },
                    },
                  ],
                },
                {
                  id: "amphibia",
                  label: "Amphibia",
                  rank: "Class",
                  description: "Moisture-linked vertebrates that often bridge aquatic and terrestrial life stages.",
                  wikiTitle: "Amphibian",
                  icon: "amphibian",
                  scope: { className: "Amphibia" },
                  children: [
                    {
                      id: "anura",
                      label: "Anura",
                      rank: "Order",
                      description: "Frogs and toads, the most familiar amphibian group.",
                      wikiTitle: "Frog",
                      icon: "amphibian",
                      scope: { order: "Anura" },
                    },
                    {
                      id: "urodela",
                      label: "Urodela",
                      rank: "Order",
                      description: "Salamanders and newts with elongated bodies and tails.",
                      wikiTitle: "Salamander",
                      icon: "amphibian",
                      scope: { order: "Urodela" },
                    },
                  ],
                },
              ],
            },
            {
              id: "mollusca",
              label: "Mollusca",
              rank: "Phylum",
              description: "Soft-bodied invertebrates including octopuses, snails, and bivalves.",
              wikiTitle: "Mollusca",
              icon: "marine",
              scope: { phylum: "Mollusca" },
              children: [
                {
                  id: "cephalopoda",
                  label: "Cephalopoda",
                  rank: "Class",
                  description: "Intelligent mollusks such as octopuses, squid, and cuttlefish.",
                  wikiTitle: "Cephalopod",
                  icon: "marine",
                  scope: { className: "Cephalopoda" },
                },
              ],
            },
            {
              id: "arthropoda",
              label: "Arthropoda",
              rank: "Phylum",
              description: "Insects, spiders, crustaceans, and the largest animal phylum by species.",
              wikiTitle: "Arthropod",
              icon: "invertebrate",
            },
            {
              id: "cnidaria",
              label: "Cnidaria",
              rank: "Phylum",
              description: "Jellyfish, corals, and sea anemones with stinging cells.",
              wikiTitle: "Cnidaria",
              icon: "marine",
            },
          ],
        },
      ],
    },
  ],
};
export const treeOfLife = staticLifeTree;

export function flattenTree(root: TreeNode) {
  const nodes: TreeNode[] = [];

  function walk(node: TreeNode) {
    nodes.push(node);
    node.children?.forEach(walk);
  }

  walk(root);
  return nodes;
}

export function collectExpandableNodeIds(root: TreeNode) {
  return flattenTree(root)
    .filter((node) => (node.children?.length ?? 0) > 0)
    .map((node) => node.id);
}

export function findTreeNode(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) {
    return root;
  }

  for (const child of root.children ?? []) {
    const found = findTreeNode(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

export function findNodePath(root: TreeNode, id: string, trail: TreeNode[] = []): TreeNode[] | null {
  const next = [...trail, root];
  if (root.id === id) {
    return next;
  }

  for (const child of root.children ?? []) {
    const path = findNodePath(child, id, next);
    if (path) {
      return path;
    }
  }

  return null;
}

export function speciesForTreeNode(node: TreeNode) {
  if (node.speciesIds?.length) {
    return animals.filter((animal) => node.speciesIds?.includes(animal.id));
  }

  if (!node.scope) {
    return [];
  }

  return animals.filter((animal) => {
    const entries = Object.entries(node.scope ?? {}) as Array<[keyof typeof animal.classification, string]>;
    return entries.every(([key, value]) => animal.classification[key] === value);
  });
}
