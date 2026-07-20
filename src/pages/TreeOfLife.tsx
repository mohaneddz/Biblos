import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimalCard } from "../components/AnimalCard";
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
import { collectExpandableNodeIds, findNodePath, findTreeNode, speciesForTreeNode, treeOfLife, type TreeNode } from "../data/treeOfLife";
import { getHiddenSpecies } from "../services/cache";
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
  depth,
  activeNodeId,
  expandedIds,
  onExpand,
  onExplore,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeNodeId: string;
  expandedIds: Set<string>;
  onExpand: (id: string) => void;
  onExplore: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);
  const matches = speciesForTreeNode(node).length;

  return (
    <div className="grid gap-3">
      <div
        className={[
          "tree-card grid gap-3 rounded-[1.15rem] border px-3 py-3 transition hover:border-app-accent/20 hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_auto] cursor-pointer",
          activeNodeId === node.id ? "border-app-accent/30 bg-app-accent/8" : "border-white/8 bg-white/[0.02]",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(node.id);
          }
        }}
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
          <button
            type="button"
            className="primary-button min-h-10 px-4 text-sm cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              onExplore(node.id);
            }}
          >
            <BinocularsIcon className="h-4 w-4" />
            Explore
          </button>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="grid gap-3 pl-4 border-l border-white/10 ml-[1.125rem] relative">
          {node.children?.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              activeNodeId={activeNodeId}
              expandedIds={expandedIds}
              onExpand={onExpand}
              onExplore={onExplore}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TreeOfLife() {
  const navigate = useNavigate();
  const initialExpanded = useMemo(() => new Set(["life", "eukaryota", "metazoa", "chordata"]), []);
  const [expandedIds, setExpandedIds] = useState(initialExpanded);
  const [activeNodeId, setActiveNodeId] = useState("chordata");
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    const handler = () => setStorageVersion((v) => v + 1);
    window.addEventListener("biblos-cache-updated", handler);
    return () => window.removeEventListener("biblos-cache-updated", handler);
  }, []);

  const activeNode = findTreeNode(treeOfLife, activeNodeId) ?? treeOfLife;
  const activePath = findNodePath(treeOfLife, activeNodeId) ?? [treeOfLife];
  
  const hidden = useMemo(() => getHiddenSpecies(), [storageVersion]);
  const matches = useMemo(() => {
    const raw = speciesForTreeNode(activeNode);
    return raw.filter((animal) => !hidden.includes(animal.id));
  }, [activeNode, hidden]);

  const expandableIds = useMemo(() => collectExpandableNodeIds(treeOfLife), []);

  function selectNode(id: string) {
    setActiveNodeId(id);
  }

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

  function exploreNode(id: string) {
    const path = findNodePath(treeOfLife, id) ?? [];
    setActiveNodeId(id);
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const node of path) {
        next.add(node.id);
      }
      return next;
    });

    const node = findTreeNode(treeOfLife, id);
    if (!node) {
      return;
    }

    const scope = node.scope ?? {};
    const params = new URLSearchParams();
    if (scope.className) {
      params.set("class", scope.className);
    } else if (scope.family) {
      params.set("q", scope.family);
    } else if (scope.phylum) {
      params.set("q", scope.phylum);
    } else if (scope.genus) {
      params.set("q", scope.genus);
    } else if (scope.species) {
      params.set("q", scope.species);
    } else if (node.label !== "Life") {
      params.set("q", node.label);
    }

    navigate(params.toString().length > 0 ? `/species?${params.toString()}` : "/species");
  }

  return (
    <div className="page-frame">
      <PageHeader
        title="Tree of Life"
        description={
          <>
            This page now separates two jobs clearly: <strong className="text-app-text">Expand</strong> opens deeper taxonomy under a branch, while <strong className="text-app-text">Explore</strong> jumps into the species directory with the matching filter already applied.
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(23rem,1.02fr)]">
        <div className="page-card rounded-[1.7rem] p-4 md:p-5">
          <div className="mb-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-app-muted">
            Use <strong className="text-app-text">Expand</strong> to reveal lower categories under a node. Use <strong className="text-app-text">Explore</strong> to open the species directory with the matching filter already set.
          </div>
          <div className="grid gap-3">
            <TreeRow
              node={treeOfLife}
              depth={0}
              activeNodeId={activeNodeId}
              expandedIds={expandedIds}
              onExpand={toggleExpand}
              onExplore={exploreNode}
              onSelect={selectNode}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <section className="page-card rounded-[1.7rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-app-soft">
                  {activePath.map((node, idx) => (
                    <span key={node.id} className="inline-flex items-center gap-2">
                      {idx > 0 && <span className="text-white/20 select-none">&rsaquo;</span>}
                      <span
                        className="hover:text-white transition cursor-pointer select-none"
                        onClick={() => selectNode(node.id)}
                      >
                        {node.label}
                      </span>
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-3xl font-semibold text-white">{activeNode.label}</h2>
                <p className="mt-3 text-sm leading-7 text-app-muted">{activeNode.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="tag-chip">{activeNode.rank}</span>
                <span className="tag-chip">{matches.length} local species</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={(() => {
                  const params = new URLSearchParams();
                  const scope = activeNode.scope ?? {};
                  if (scope.className) {
                    params.set("class", scope.className);
                  } else if (scope.family) {
                    params.set("q", scope.family);
                  } else if (scope.phylum) {
                    params.set("q", scope.phylum);
                  } else if (scope.genus) {
                    params.set("q", scope.genus);
                  } else if (scope.species) {
                    params.set("q", scope.species);
                  } else if (activeNode.label !== "Life") {
                    params.set("q", activeNode.label);
                  }
                  return params.toString().length > 0 ? `/species?${params.toString()}` : "/species";
                })()}
                className="primary-button text-sm"
              >
                Open directory view
              </Link>
              {activeNode.wikiTitle ? (
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(activeNode.wikiTitle)}`} target="_blank" rel="noreferrer" className="ghost-button text-sm">
                  Open source reference
                </a>
              ) : null}
            </div>
          </section>

          {matches.length > 0 ? (
            <section className="page-grid page-grid-2">
              {matches.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </section>
          ) : (
            <section className="page-card rounded-[1.7rem] p-5">
              <h3 className="page-section-title">No local species under this branch yet</h3>
              <p className="mt-3 text-sm leading-7 text-app-muted">
                The tree now includes broad life categories across life, and Explore jumps into the species directory for the nearest matching filter. Expand the tree for hierarchy, or explore the branches that map cleanly to indexed species to see populated matches.
              </p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
