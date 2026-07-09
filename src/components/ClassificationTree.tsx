import type { Animal } from "../types/animal";
import { BranchIcon } from "./icons";

const labels: Array<[string, string]> = [
  ["Kingdom", "kingdom"],
  ["Phylum", "phylum"],
  ["Class", "className"],
  ["Order", "order"],
  ["Family", "family"],
  ["Genus", "genus"],
  ["Species", "species"],
];

export function ClassificationTree({ animal }: { animal: Animal }) {
  return (
    <div className="page-card rounded-[1.5rem] p-5">
      <h2 className="page-section-title flex items-center gap-2">
        <BranchIcon className="h-5 w-5 text-app-accent" />
        Classification
      </h2>
      <div className="mt-4 grid gap-3">
        {labels.map(([label, key], index) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-app-accent/25 bg-app-accent/8 text-xs text-app-accent">
              {index + 1}
            </span>
            <div className="flex-1 rounded-2xl border border-white/7 bg-black/15 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-app-soft">{label}</span>
              <p className="mt-1 text-app-text">{animal.classification[key as keyof Animal["classification"]]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
