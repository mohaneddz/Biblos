export type SpeciesImageAsset = {
  url: string;
  thumbnailUrl?: string;
  source: "Wikipedia" | "iNaturalist" | "GBIF" | "Wikimedia";
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  alt: string;
};

export type SpeciesMediaBundle = {
  primary: SpeciesImageAsset | null;
  gallery: SpeciesImageAsset[];
  resolvedAt: string;
};
