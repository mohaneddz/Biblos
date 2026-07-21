import type { Animal } from "../types/animal";
import { BranchIcon } from "./icons";
import { RefreshCw } from "lucide-react";

const labels: Array<[string, string]> = [
  ["Kingdom", "kingdom"],
  ["Phylum", "phylum"],
  ["Class", "className"],
  ["Order", "order"],
  ["Family", "family"],
  ["Genus", "genus"],
  ["Species", "species"],
];

type ClassificationTreeProps = {
  animal: Animal;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function ClassificationTree({ animal, onRefresh, isRefreshing }: ClassificationTreeProps) {
  return (
    <div className="page-card rounded-[1.5rem] p-5">
      <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
        <h2 className="page-section-title flex items-center gap-2">
          <BranchIcon className="h-5 w-5 text-app-accent" />
          <span>Classification</span>
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh taxonomy & classification data"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-app-soft hover:text-app-accent hover:bg-white/5 transition cursor-pointer border border-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-app-accent" : ""}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="grid gap-3">
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
