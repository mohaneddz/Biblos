import { useState, useEffect, useRef } from "react";
import type { Animal } from "../types/animal";
import { animals } from "../data/animals";
import { getAllCachedSpecies } from "../services/cache";
import { searchSpeciesLocal, previewAnimalFromHit } from "../services/speciesStore";
import { SpeciesImage } from "./SpeciesImage";
import { SearchIcon } from "./icons";
import { Loader2 } from "lucide-react";

type CompareSpeciesSelectProps = {
  label: string;
  selectedId: string;
  selectedAnimal: Animal | null;
  onSelect: (animalId: string, animal?: Animal) => void;
};

export function CompareSpeciesSelect({
  label,
  selectedId,
  selectedAnimal,
  onSelect,
}: CompareSpeciesSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Animal[]>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Initial candidate list (static animals + cached species)
  const defaultAnimals = useState(() => {
    const map = new Map<string, Animal>();
    for (const a of animals) map.set(a.id, a);
    for (const a of getAllCachedSpecies()) map.set(a.id, a);
    return [...map.values()];
  })[0];

  // Perform search against local DB + static / cached animals when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(defaultAnimals);
      setSearching(false);
      return;
    }

    let active = true;
    setSearching(true);
    const qLower = query.trim().toLowerCase();

    // Instant local static match
    const localHits = defaultAnimals.filter(
      (a) =>
        a.commonName.toLowerCase().includes(qLower) ||
        a.scientificName.toLowerCase().includes(qLower) ||
        (a.classification?.className && a.classification.className.toLowerCase().includes(qLower))
    );

    // Deep search in 21,000+ SQLite database index
    searchSpeciesLocal(query.trim(), 30)
      .then((res) => {
        if (!active) return;
        const dbHits = res.hits.map(previewAnimalFromHit);
        const map = new Map<string, Animal>();

        // Local static hits first, then DB index hits
        for (const a of localHits) map.set(a.id, a);
        for (const a of dbHits) {
          if (!map.has(a.id)) map.set(a.id, a);
        }
        setSearchResults([...map.values()]);
      })
      .catch((err) => {
        console.error("Compare select search error:", err);
        if (active) setSearchResults(localHits);
      })
      .finally(() => {
        if (active) setSearching(false);
      });

    return () => {
      active = false;
    };
  }, [query, defaultAnimals]);

  const displayAnimal = selectedAnimal ?? defaultAnimals.find((a) => a.id === selectedId);

  return (
    <div className={`relative flex flex-col gap-1.5 min-w-0 ${isOpen ? "z-[100]" : "z-10"}`} ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-wider text-app-soft">{label}</span>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-[1.1rem] border px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-app-accent bg-app-accent/10 shadow-[0_0_14px_rgba(221,191,135,0.2)]"
            : "border-white/12 bg-black/40 hover:border-white/25 hover:bg-black/60"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {displayAnimal ? (
            <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-black/40">
              <SpeciesImage animal={displayAnimal} className="h-full w-full" fitClassName="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-lg shrink-0 border border-white/15 bg-white/5 flex items-center justify-center text-app-accent font-bold text-xs">
              ?
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {displayAnimal ? displayAnimal.commonName : selectedId}
            </p>
            {displayAnimal?.scientificName ? (
              <p className="text-xs italic text-app-muted truncate">{displayAnimal.scientificName}</p>
            ) : null}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-app-soft transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-app-accent" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[105%] z-[200] overflow-hidden rounded-[1.3rem] border border-white/15 bg-[#090e0b]/98 backdrop-blur-2xl shadow-2xl animate-fade-in">
          {/* Sticky Search Input Bar */}
          <div className="p-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-black/60 px-3 py-2 focus-within:border-app-accent/60 focus-within:ring-1 focus-within:ring-app-accent/30 transition">
              <SearchIcon className="h-4 w-4 text-app-accent shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 21,000+ species by name, class..."
                className="w-full bg-transparent text-xs text-white placeholder:text-app-muted/70 outline-none"
              />
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 text-app-accent animate-spin shrink-0" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-app-soft hover:text-white text-xs cursor-pointer px-1"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((animal) => {
                const isSelected = animal.id === selectedId;
                return (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => {
                      onSelect(animal.id, animal);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-app-accent/20 border border-app-accent/40 text-white font-medium"
                        : "hover:bg-white/8 text-app-muted hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/30">
                        <SpeciesImage animal={animal} className="h-full w-full" fitClassName="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{animal.commonName}</p>
                        <p className="text-[11px] italic text-app-muted truncate">{animal.scientificName}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium uppercase tracking-wider text-app-accent bg-app-accent/10 border border-app-accent/20 px-2 py-0.5 rounded-full shrink-0">
                      {animal.classification?.className || "Species"}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-app-muted">
                No species found matching &quot;{query}&quot; in the index.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
