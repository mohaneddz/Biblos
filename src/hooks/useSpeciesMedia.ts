import { useEffect, useState } from "react";
import { getSpeciesMedia, type SpeciesMediaMode } from "../services/speciesMedia";
import type { Animal } from "../types/animal";
import type { SpeciesMediaBundle } from "../types/media";

export function useSpeciesMedia(animal: Animal | null, mode: SpeciesMediaMode = "full") {
  const [media, setMedia] = useState<SpeciesMediaBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!animal) {
      setMedia(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void getSpeciesMedia(animal, mode)
      .then((result) => {
        if (active) {
          setMedia(result);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [animal, mode]);

  return {
    media,
    loading,
    primaryImage: media?.primary ?? null,
    gallery: media?.gallery ?? [],
  };
}
