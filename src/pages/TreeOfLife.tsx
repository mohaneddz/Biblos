import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AmphibianIcon,
  BinocularsIcon,
  BirdIcon,
  BranchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DotSpeciesIcon,
  FamilyIcon,
  FungiIcon,
  LeafIcon,
  MammalIcon,
  MarineIcon,
  MicrobeIcon,
  ReptileIcon,
  TreeLogoIcon,
} from "../components/icons";
import { collectExpandableNodeIds, speciesForTreeNode, treeOfLife, type TreeNode } from "../data/treeOfLife";
import { PageHeader } from "../components/PageHeader";

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
    case "chordate":
      return <BranchIcon className={className} />;
    default:
      return <BranchIcon className={className} />;
  }
}

function TreeRow({
  node,
  expandedIds,
  onExpand,
}: {
  node: TreeNode;
  expandedIds: Set<string>;
  onExpand: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);
  const matches = speciesForTreeNode(node).length;

  return (
    <div className="grid gap-3">
      <div
        className="tree-card grid gap-3 rounded-[1.15rem] border border-white/8 bg-white/[0.02] px-3 py-3 transition hover:border-app-accent/20 hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-app-accent">{nodeIcon(node)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-app-text">{node.label}</p>
              <span className="text-[0.68rem] uppercase tracking-[0.18em] text-app-soft">{node.rank}</span>
              {matches > 0 ? <span className="tag-chip">{matches} species</span> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-app-muted">{node.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              className="ghost-button min-h-10 px-4 text-sm cursor-pointer select-none"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(node.id);
              }}
            >
              {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              Expand
            </button>
          ) : null}
          <Link
            to={`/life-class/${node.id}`}
            className="primary-button min-h-10 px-4 text-sm cursor-pointer select-none"
          >
            <BinocularsIcon className="h-4 w-4" />
            Explore
          </Link>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="grid gap-3 pl-4 border-l border-white/10 ml-[1.125rem] relative">
          {node.children?.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onExpand={onExpand}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TreeOfLife() {
  const initialExpanded = useMemo(() => new Set(["life", "eukaryota", "metazoa", "chordata"]), []);
  const [expandedIds, setExpandedIds] = useState(initialExpanded);

  const expandableIds = useMemo(() => collectExpandableNodeIds(treeOfLife), []);

  function toggleExpand(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="page-frame">
      <PageHeader
        title="Tree of Life"
        description={
          <>
            <strong className="text-app-text">Expand</strong> opens deeper taxonomy under a branch, while <strong className="text-app-text">Explore</strong> opens a dedicated Life Class page for that branch.
          </>
        }
        storageKey="tree-of-life"
        actions={
          <div className="flex flex-wrap gap-3">
            <button type="button" className="ghost-button text-sm cursor-pointer select-none" onClick={() => setExpandedIds(new Set(expandableIds))}>
              Expand all
            </button>
            <button type="button" className="ghost-button text-sm cursor-pointer select-none" onClick={() => setExpandedIds(new Set(["life"]))}>
              Collapse all
            </button>
          </div>
        }
      />

      <section className="grid gap-4">
        <div className="page-card rounded-[1.7rem] p-4 md:p-5">
          <div className="mb-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-app-muted">
            Use <strong className="text-app-text">Expand</strong> to reveal lower categories under a node. Use <strong className="text-app-text">Explore</strong> to open its Life Class page with context, species, stats, and distribution.
          </div>
          <div className="grid gap-3">
            <TreeRow
              node={treeOfLife}
              expandedIds={expandedIds}
              onExpand={toggleExpand}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
