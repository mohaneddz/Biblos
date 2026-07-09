import type { ReactNode } from "react";
import type { Animal } from "../types/animal";
import { BirdIcon, DotSpeciesIcon, GlobeGridIcon, LeafClusterIcon, MammalIcon, MarineIcon, MountainIcon, ReptileIcon } from "./icons";

type CompareRow = {
  label: string;
  icon: ReactNode;
  left: (animal: Animal) => string;
  right: (animal: Animal) => string;
};

type CompareSection = {
  title: string;
  rows: CompareRow[];
};

type ComparisonSide = "left" | "right";

function classIcon(className: string) {
  switch (className) {
    case "Mammalia":
      return <MammalIcon className="h-4 w-4" />;
    case "Aves":
      return <BirdIcon className="h-4 w-4" />;
    case "Reptilia":
      return <ReptileIcon className="h-4 w-4" />;
    case "Amphibia":
      return <LeafClusterIcon className="h-4 w-4" />;
    default:
      return <MarineIcon className="h-4 w-4" />;
  }
}

function numericValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compareNumbers(left: number | null, right: number | null): ComparisonSide | null {
  if (left === null && right === null) {
    return null;
  }
  if (left !== null && right === null) {
    return "left";
  }
  if (left === null && right !== null) {
    return "right";
  }
  if ((left ?? 0) === (right ?? 0)) {
    return null;
  }
  return (left ?? 0) > (right ?? 0) ? "left" : "right";
}

const sections: CompareSection[] = [
  {
    title: "Identity",
    rows: [
      {
        label: "Scientific name",
        icon: <DotSpeciesIcon className="h-4 w-4" />,
        left: (animal) => animal.scientificName,
        right: (animal) => animal.scientificName,
      },
      {
        label: "Class",
        icon: <MammalIcon className="h-4 w-4" />,
        left: (animal) => animal.classification.className,
        right: (animal) => animal.classification.className,
      },
      {
        label: "Family",
        icon: <LeafClusterIcon className="h-4 w-4" />,
        left: (animal) => animal.classification.family,
        right: (animal) => animal.classification.family,
      },
    ],
  },
  {
    title: "Ecology",
    rows: [
      {
        label: "Habitats",
        icon: <MountainIcon className="h-4 w-4" />,
        left: (animal) => animal.habitat.join(", "),
        right: (animal) => animal.habitat.join(", "),
      },
      {
        label: "Diet",
        icon: <LeafClusterIcon className="h-4 w-4" />,
        left: (animal) => animal.diet,
        right: (animal) => animal.diet,
      },
      {
        label: "Activity",
        icon: <GlobeGridIcon className="h-4 w-4" />,
        left: (animal) => animal.activityPattern,
        right: (animal) => animal.activityPattern,
      },
      {
        label: "Continents",
        icon: <GlobeGridIcon className="h-4 w-4" />,
        left: (animal) => animal.continents.join(", "),
        right: (animal) => animal.continents.join(", "),
      },
    ],
  },
  {
    title: "Scale",
    rows: [
      {
        label: "Lifespan",
        icon: <MarineIcon className="h-4 w-4" />,
        left: (animal) => (animal.averageLifespanYears ? `${animal.averageLifespanYears} years` : "Unknown"),
        right: (animal) => (animal.averageLifespanYears ? `${animal.averageLifespanYears} years` : "Unknown"),
      },
      {
        label: "Weight",
        icon: <MammalIcon className="h-4 w-4" />,
        left: (animal) => (animal.weightKg ? `${animal.weightKg} kg` : "Unknown"),
        right: (animal) => (animal.weightKg ? `${animal.weightKg} kg` : "Unknown"),
      },
      {
        label: "Body size",
        icon: <ReptileIcon className="h-4 w-4" />,
        left: (animal) => `${animal.size.lengthCm ?? "?"} cm length / ${animal.size.heightCm ?? "?"} cm height`,
        right: (animal) => `${animal.size.lengthCm ?? "?"} cm length / ${animal.size.heightCm ?? "?"} cm height`,
      },
    ],
  },
  {
    title: "Conservation",
    rows: [
      {
        label: "Status",
        icon: <LeafClusterIcon className="h-4 w-4" />,
        left: (animal) => animal.conservationStatus,
        right: (animal) => animal.conservationStatus,
      },
      {
        label: "Field notes",
        icon: <GlobeGridIcon className="h-4 w-4" />,
        left: (animal) => animal.coolFacts.slice(0, 2).join(" "),
        right: (animal) => animal.coolFacts.slice(0, 2).join(" "),
      },
    ],
  },
];

export function CompareTable({ left, right }: { left: Animal; right: Animal }) {
  return (
    <div className="grid gap-4">
      {sections.map((section) => (
        <section key={section.title} className="page-card rounded-[1.55rem] p-5">
          <h3 className="page-section-title">{section.title}</h3>
          <div className="mt-4 grid gap-3">
            {section.rows.map((row) => {
              const winner =
                row.label === "Lifespan"
                  ? compareNumbers(numericValue(left.averageLifespanYears), numericValue(right.averageLifespanYears))
                  : row.label === "Weight"
                    ? compareNumbers(numericValue(left.weightKg), numericValue(right.weightKg))
                    : row.label === "Body size"
                      ? compareNumbers(numericValue(left.size.lengthCm), numericValue(right.size.lengthCm))
                      : null;

              return (
              <div key={row.label} className="grid gap-3 rounded-[1.25rem] border border-white/8 bg-black/18 p-4 lg:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex items-center gap-3 text-app-accent">
                  {row.icon}
                  <span className="text-sm font-semibold text-app-text">{row.label}</span>
                </div>
                <div className={["compare-panel rounded-[1rem] border border-white/7 bg-white/[0.03] px-4 py-3", winner === "left" ? "compare-panel-winner" : ""].join(" ")}>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-app-soft">
                    {classIcon(left.classification.className)}
                    {left.commonName}
                    {winner === "left" ? <span className="compare-winner-pill">larger</span> : null}
                  </div>
                  <p className="text-sm leading-7 text-app-text">{row.left(left)}</p>
                </div>
                <div className={["compare-panel rounded-[1rem] border border-white/7 bg-white/[0.03] px-4 py-3", winner === "right" ? "compare-panel-winner" : ""].join(" ")}>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-app-soft">
                    {classIcon(right.classification.className)}
                    {right.commonName}
                    {winner === "right" ? <span className="compare-winner-pill">larger</span> : null}
                  </div>
                  <p className="text-sm leading-7 text-app-text">{row.right(right)}</p>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
