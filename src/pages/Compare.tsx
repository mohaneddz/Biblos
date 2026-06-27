import { useState } from "react";
import { CompareTable } from "../components/CompareTable";
import { animals } from "../data/animals";

export default function Compare() {
  const [leftId, setLeftId] = useState(animals[0].id);
  const [rightId, setRightId] = useState(animals[1].id);
  const left = animals.find((animal) => animal.id === leftId) ?? animals[0];
  const right = animals.find((animal) => animal.id === rightId) ?? animals[1];
  const selectors = [
    { label: "Left species", value: leftId, setter: setLeftId },
    { label: "Right species", value: rightId, setter: setRightId },
  ];

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Compare</h1>
        <p className="page-lede">Select two entries and inspect taxonomy, ecology, scale, activity, and conservation side by side.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {selectors.map(({ label, value, setter }) => (
            <label key={label} className="grid gap-2 text-sm text-app-muted">
              <span>{label}</span>
              <select value={value} onChange={(event) => setter(event.target.value)} className="rounded-[1rem] border border-white/8 bg-black/25 px-4 py-3 text-app-text">
                {animals.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.commonName}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {left.id === right.id ? (
          <div className="warning-banner mt-4">You are comparing the same species on both sides. Change one selector to inspect differences.</div>
        ) : null}
      </section>
      <CompareTable left={left} right={right} />
    </div>
  );
}
