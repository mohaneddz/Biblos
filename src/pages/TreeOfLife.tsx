import { Link } from "react-router-dom";
import { animals } from "../data/animals";

type TaxonomyNode = {
  label: string;
  children?: TaxonomyNode[];
  speciesId?: string;
};

function buildSpeciesLeaf(animal: (typeof animals)[number]): TaxonomyNode {
  return {
    label: `${animal.commonName} (${animal.scientificName})`,
    speciesId: animal.id,
  };
}

function buildTree(): TaxonomyNode {
  const grouped = new Map<string, Map<string, Map<string, Map<string, Map<string, (typeof animals)[number][]>>>>>();

  for (const animal of animals) {
    const { kingdom, phylum, className, order, family } = animal.classification;
    if (!grouped.has(kingdom)) {
      grouped.set(kingdom, new Map());
    }
    const phyla = grouped.get(kingdom)!;
    if (!phyla.has(phylum)) {
      phyla.set(phylum, new Map());
    }
    const classes = phyla.get(phylum)!;
    if (!classes.has(className)) {
      classes.set(className, new Map());
    }
    const orders = classes.get(className)!;
    if (!orders.has(order)) {
      orders.set(order, new Map());
    }
    const families = orders.get(order)!;
    if (!families.has(family)) {
      families.set(family, []);
    }
    families.get(family)!.push(animal);
  }

  return {
    label: "Life",
    children: [...grouped.entries()].map(([kingdom, phyla]) => ({
      label: kingdom,
      children: [...phyla.entries()].map(([phylum, classes]) => ({
        label: phylum,
        children: [...classes.entries()].map(([className, orders]) => ({
          label: className,
          children: [...orders.entries()].map(([order, families]) => ({
            label: order,
            children: [...families.entries()].map(([family, members]) => ({
              label: family,
              children: members
                .sort((a, b) => a.commonName.localeCompare(b.commonName))
                .map((animal) => buildSpeciesLeaf(animal)),
            })),
          })),
        })),
      })),
    })),
  };
}

function TreeNode({ node }: { node: TaxonomyNode }) {
  const open = node.label === "Life" || node.label === "Animalia";

  return (
    <details open={open} className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3">
      <summary className="cursor-pointer list-none text-app-text">{node.label}</summary>
      {node.children ? (
        <div className="mt-3 grid gap-3 pl-4">
          {node.children.map((child) => (
            <TreeNode key={`${node.label}-${child.label}`} node={child} />
          ))}
        </div>
      ) : node.speciesId ? (
        <div className="mt-3 pl-4">
          <Link to={`/species/${node.speciesId}`} className="tag-chip transition hover:border-app-accent/35 hover:text-app-text">
            Open record
          </Link>
        </div>
      ) : null}
    </details>
  );
}

export default function TreeOfLife() {
  const taxonomy = buildTree();

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Tree of Life</h1>
        <p className="page-lede">
          This tree is built directly from the current local dataset. Open a branch to trace any species from kingdom through family, then jump into its full record.
        </p>
      </section>
      <TreeNode node={taxonomy} />
    </div>
  );
}
