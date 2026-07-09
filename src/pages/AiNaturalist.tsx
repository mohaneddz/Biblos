import { useSearchParams } from "react-router-dom";
import { AiNaturalistPanel } from "../components/AiNaturalistPanel";
import { getSettings } from "../services/cache";

export default function AiNaturalist() {
  const [searchParams] = useSearchParams();
  const species = searchParams.get("species") ?? "";
  const settings = getSettings();

  return (
    <div className="page-frame">
      <section className="page-card rounded-[1.75rem] p-6">
        <h1 className="page-title">AI Naturalist</h1>
        <p className="page-lede">A Groq-backed natural history assistant over the Biblos corpus, using local retrieval across taxonomy, biome, behavior, conservation, and comparison records before each answer.</p>
      </section>
      {settings.aiEnabled ? (
        <AiNaturalistPanel
          initialPrompt={species ? `Tell me about ${species}` : ""}
          speciesName={species}
        />
      ) : (
        <section className="page-card rounded-[1.75rem] p-6">
          <div className="warning-banner">AI Naturalist is disabled in Settings. Re-enable local AI features to use this panel.</div>
        </section>
      )}
    </div>
  );
}
