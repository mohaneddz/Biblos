import { Link } from "react-router-dom";
import { getFeaturedEcosystemSpecies, type Ecosystem } from "../data/ecosystems";
import { useWikipediaSummaries } from "../services/wikipedia";
import { CompassIcon } from "./icons";

export function EcosystemCard({ ecosystem }: { ecosystem: Ecosystem }) {
  const featured = getFeaturedEcosystemSpecies(ecosystem);
  const summaries = useWikipediaSummaries([ecosystem.articleTitle]);
  const summary = summaries[ecosystem.articleTitle];
  const image = summary?.thumbnailUrl;

  return (
    <Link
      to={`/ecosystems/${ecosystem.id}`}
      className="page-card interactive-card group flex h-full flex-col overflow-hidden rounded-[1.45rem] hover:no-underline text-app-text cursor-pointer"
    >
      <div className="relative h-44 overflow-hidden border-b border-white/8">
        {image ? <img src={image} alt={ecosystem.title} className="h-full w-full object-cover transition duration-500" /> : null}
        <div className="media-vignette" />
        
        {/* Floating explorer button top-right */}
        <div className="absolute right-3 top-3 z-10">
          <Link
            to={`/explorer?ecosystem=${encodeURIComponent(ecosystem.id)}&continent=${encodeURIComponent(ecosystem.continents[0] ?? "Africa")}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-app-accent hover:bg-black/85 hover:text-white transition duration-300 shadow-lg cursor-pointer"
            onClick={(e) => {
              // Stop propagation so clicking this button doesn't select the card
              e.stopPropagation();
            }}
            title="Open in explorer"
          >
            <CompassIcon className="h-4.5 w-4.5" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="mt-2 text-[1.55rem] font-semibold leading-tight text-white">{ecosystem.title}</h3>
          <p className="mt-2 max-w-[30rem] text-sm leading-6 text-white/78">{ecosystem.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-7 text-app-muted">{ecosystem.description}</p>

        <div className="text-xs text-app-muted leading-relaxed mt-auto">
          <span className="text-app-soft font-medium">Representative species: </span>
          <span className="text-app-text">{featured.map((animal) => animal.commonName).join(", ") || "Still expanding"}</span>
        </div>
      </div>
    </Link>
  );
}
