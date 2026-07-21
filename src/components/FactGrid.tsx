import type { Animal } from "../types/animal";
import { HourglassIcon, ScaleIcon, RulerIcon } from "./icons";
import { Shield } from "lucide-react";

export function FactGrid({ animal }: { animal: Animal }) {
  const facts = [
    { label: "Average lifespan", value: animal.averageLifespanYears ? `${animal.averageLifespanYears} years` : "Unknown", icon: HourglassIcon, isAi: true },
    { label: "Weight", value: animal.weightKg ? `${animal.weightKg} kg` : "Unknown", icon: ScaleIcon, isAi: true },
    { label: "Length", value: animal.size.lengthCm ? `${animal.size.lengthCm} cm` : "Unknown", icon: RulerIcon, isAi: true },
    { label: "Height", value: animal.size.heightCm ? `${animal.size.heightCm} cm` : "Unknown", icon: RulerIcon, isAi: true },
    { label: "Wingspan", value: animal.size.wingspanCm ? `${animal.size.wingspanCm} cm` : "N/A", icon: RulerIcon, isAi: true },
    { label: "Conservation status", value: animal.conservationStatus ?? "Least Concern", icon: Shield, isAi: true },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map(({ label, value, icon: Icon, isAi }) => (
        <div key={label} className="stat-tile min-h-[6.5rem] relative p-5">
          <div className="absolute right-4 top-4 text-app-soft/60">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <span className="stat-label">{label}</span>
            {animal.partial && isAi ? (
              <div className="h-6 w-20 bg-white/5 animate-pulse rounded mt-2" />
            ) : (
              <strong className="block mt-2 text-lg text-white font-semibold">{value}</strong>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
