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
  /** Comma-separated synonym / alternate vernacular names stored in the index */
  aliases?: string[];
  /** iNaturalist taxon ID — set when the hit was resolved via iNaturalist */
  inat_taxon_id?: number;
  /** Normalised observation popularity score (0–1), derived from iNat observations count */
  popularity_score?: number;
  source: string;
  updated_at: string;
  score: number;
  match_reason: string;
  is_live_fallback: boolean;
};

/**
 * Structured filter object produced by the NL query parser (Groq JSON-schema mode).
 * All fields are optional — only those confidently parsed will be set.
 * `text_remainder` holds any part of the query not mapped to a filter.
 */
export type StructuredFilters = {
  habitat?: string;
  diet?: string;
  activityPattern?: string;
  conservationStatus?: string;
  continent?: string;
  className?: string;
  textRemainder?: string;
};

export type SearchResponse = {
  hits: SpeciesSearchHit[];
  used_live_fallback: boolean;
  total_count?: number;
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
