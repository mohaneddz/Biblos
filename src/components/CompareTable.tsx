import type { Animal } from "../types/animal";

const rows = [
  ["Scientific name", (animal: Animal) => animal.scientificName],
  ["Class", (animal: Animal) => animal.classification.className],
  ["Activity", (animal: Animal) => animal.activityPattern],
  ["Diet", (animal: Animal) => animal.diet],
  ["Continents", (animal: Animal) => animal.continents.join(", ")],
  ["Habitat", (animal: Animal) => animal.habitat.join(", ")],
  ["Lifespan", (animal: Animal) => `${animal.averageLifespanYears} years`],
  ["Weight", (animal: Animal) => (animal.weightKg ? `${animal.weightKg} kg` : "Unknown")],
  ["Size", (animal: Animal) => `${animal.size.lengthCm ?? "?"} cm length / ${animal.size.heightCm ?? "?"} cm height`],
  ["Status", (animal: Animal) => animal.conservationStatus],
  ["Cool facts", (animal: Animal) => animal.coolFacts.slice(0, 2).join(" ")],
] as const;

export function CompareTable({ left, right }: { left: Animal; right: Animal }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(9,12,10,0.84)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.03]">
            <th className="px-4 py-4 text-app-soft">Field</th>
            <th className="px-4 py-4 text-white">{left.commonName}</th>
            <th className="px-4 py-4 text-white">{right.commonName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, getter]) => (
            <tr key={label} className="border-b border-white/6 last:border-b-0">
              <th className="px-4 py-4 align-top text-app-soft">{label}</th>
              <td className="px-4 py-4 align-top text-app-text">{getter(left)}</td>
              <td className="px-4 py-4 align-top text-app-text">{getter(right)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
