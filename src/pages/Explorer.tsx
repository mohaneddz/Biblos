import { Link } from "react-router-dom";
import { activityPatterns, continents } from "../data/discovery";
import { animals } from "../data/animals";

const diets = ["Carnivore", "Herbivore", "Omnivore"];
const conservationStatuses = ["Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered"];

function unique(items: string[]) {
  return [...new Set(items)].sort();
}

const habitats = unique(animals.flatMap((animal) => animal.habitat));

function ShortcutGroup({ title, description, items, keyName }: { title: string; description: string; items: string[]; keyName: string }) {
  return (
    <section className="page-card rounded-[1.5rem] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-section-title">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-app-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item}
            to={`/species?${keyName}=${encodeURIComponent(item)}`}
            className="interactive-card rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-app-text"
          >
            {item}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Explorer() {
  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">Explorer</h1>
        <p className="page-lede">
          Explorer is the trait-first discovery surface. Start from ecology and behavior, then drop into the directory with the relevant filters already applied.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/species" className="primary-button text-sm">
            Open full directory
          </Link>
          <Link to="/atlas" className="ghost-button text-sm">
            Switch to atlas browsing
          </Link>
        </div>
      </section>

      <section className="page-grid page-grid-2">
        <ShortcutGroup
          title="Habitats"
          description="Jump straight into ecological niches such as open woodland, kelp forests, or wetlands."
          items={habitats}
          keyName="habitat"
        />
        <ShortcutGroup
          title="Activity Pattern"
          description="Use behavior-based shortcuts instead of full-text search."
          items={activityPatterns}
          keyName="activity"
        />
      </section>

      <section className="page-grid page-grid-2">
        <ShortcutGroup
          title="Diet"
          description="Compare predators, herbivores, and omnivores through a single species view."
          items={diets}
          keyName="diet"
        />
        <ShortcutGroup
          title="Conservation Status"
          description="Surface threatened species quickly for triage, study, or collection work."
          items={conservationStatuses}
          keyName="status"
        />
      </section>

      <ShortcutGroup
        title="Continent"
        description="Need a geographic starting point but not a full atlas pass? These shortcuts still land in the filterable directory."
        items={continents}
        keyName="continent"
      />
    </div>
  );
}
