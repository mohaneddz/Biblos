import type { Animal } from "../types/animal";

export function FactGrid({ animal }: { animal: Animal }) {
  const facts = [
    ["Average lifespan", `${animal.averageLifespanYears} years`],
    ["Weight", animal.weightKg ? `${animal.weightKg} kg` : "Unknown"],
    ["Length", animal.size.lengthCm ? `${animal.size.lengthCm} cm` : "Unknown"],
    ["Height", animal.size.heightCm ? `${animal.size.heightCm} cm` : "Unknown"],
    ["Wingspan", animal.size.wingspanCm ? `${animal.size.wingspanCm} cm` : "N/A"],
    ["3D model", animal.has3DModel ? "Available locally" : "No local model attached"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label} className="stat-tile min-h-[6.5rem]">
          <span className="stat-label">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
