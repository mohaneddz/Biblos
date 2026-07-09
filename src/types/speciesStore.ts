import type { Animal } from "./animal";

export type SpeciesSearchHit = {
  id: string;
  gbif_taxon_key: number;
  scientific_name: string;
  canonical_name: string;
  common_name: string | null;
  rank: string;
  kingdom: string | null;
  phylum: string | null;
  class_name: string | null;
  order_name: string | null;
  family: string | null;
  genus: string | null;
  source: string;
  updated_at: string;
  score: number;
  match_reason: string;
  is_live_fallback: boolean;
};

export type SearchResponse = {
  hits: SpeciesSearchHit[];
  used_live_fallback: boolean;
};

export type HydratedProfileResponse = {
  id: string;
  gbif_taxon_key: number;
  animal: Animal;
  cached: boolean;
  partial: boolean;
};

export type GbifVernacularName = {
  vernacularName?: string;
  language?: string;
};

export type GbifSearchItem = {
  key?: number;
  taxonKey?: number;
  acceptedTaxonKey?: number;
  scientificName?: string;
  canonicalName?: string;
  vernacularName?: string;
  vernacularNames?: GbifVernacularName[];
  rank?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
};

export type GbifSearchPayload = {
  results?: GbifSearchItem[];
};

export type GbifSpeciesDetails = {
  taxonKey?: number;
  scientificName?: string;
  canonicalName?: string;
  vernacularName?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  habitat?: string;
  threat?: string;
  extinct?: boolean;
};
