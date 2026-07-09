import { useState } from "react";
import { CompareTable } from "../components/CompareTable";
import { BirdIcon, GlobeGridIcon, MammalIcon } from "../components/icons";
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
        <p className="page-lede">The compare view now leans on icons, grouped sections, and direct ecological context so differences scan faster than a raw table.</p>
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

      <section className="grid gap-4 xl:grid-cols-2">
        {[left, right].map((animal, index) => (
          <article key={animal.id} className="page-card rounded-[1.6rem] p-5">
            <div className="flex items-center gap-3 text-app-accent">
              {animal.classification.className === "Mammalia" ? <MammalIcon className="h-5 w-5" /> : <BirdIcon className="h-5 w-5" />}
              <span className="text-xs uppercase tracking-[0.22em]">{index === 0 ? "Left profile" : "Right profile"}</span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{animal.commonName}</h2>
            <p className="mt-1 italic text-app-muted">{animal.scientificName}</p>
            <p className="mt-4 text-sm leading-7 text-app-muted">{animal.shortDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag-chip">{animal.classification.className}</span>
              <span className="tag-chip">{animal.conservationStatus}</span>
              <span className="tag-chip">{animal.diet}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="page-card rounded-[1.6rem] p-5">
        <div className="flex items-center gap-3 text-app-accent">
          <GlobeGridIcon className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.22em]">At a glance</span>
        </div>
        <p className="mt-3 text-sm leading-7 text-app-muted">
          {left.commonName} and {right.commonName} overlap in {left.habitat.filter((item) => right.habitat.includes(item)).join(", ") || "no currently shared habitat labels"}, while their conservation statuses are {left.conservationStatus} and {right.conservationStatus}.
        </p>
      </section>

      <CompareTable left={left} right={right} />
    </div>
  );
}
