export type ConservationStatus =
  | "Least Concern"
  | "Near Threatened"
  | "Vulnerable"
  | "Endangered"
  | "Critically Endangered"
  | "Extinct"
  | "Unknown";

export type ActivityPattern = "Diurnal" | "Nocturnal" | "Crepuscular" | "Cathemeral" | "Unknown";

export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Australia"
  | "Antarctica"
  | "Oceans"
  | "Unknown";

export type SpeciesVideo = {
  title: string;
  duration: string;
  type: string;
  description: string;
  youtubeId: string;
  views?: number;
  channelName?: string;
};

export type Animal = {
  id: string;
  gbifTaxonKey?: number;
  commonName: string;
  scientificName: string;
  averageLifespanYears: number | null;
  shortDescription: string;
  detailedDescription: string;
  coolFacts: string[];
  classification: {
    kingdom: string;
    phylum: string;
    className: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  habitat: string[];
  diet: string;
  activityPattern: ActivityPattern;
  continents: Continent[];
  conservationStatus: ConservationStatus;
  size: {
    lengthCm?: number | null;
    heightCm?: number | null;
    wingspanCm?: number | null;
  };
  weightKg?: number | null;
  images: string[];
  heroImage?: string | null;
  has3DModel: boolean;
  sourceUrls?: string[];
  lastFetchedAt?: string;
  partial?: boolean;
  videos?: SpeciesVideo[];
};

export type AppSettings = {
  dataMode: "mock" | "cached" | "live";
  theme: "dark-academic";
  aiEnabled: boolean;
  groqApiKey: string;
  aiModel: string;
  ecosystemMediaSource: "wikipedia";
  storageLocation: string;
  enableErrorToasts?: boolean;
  enableErrorConsoleLogs?: boolean;
  youtubeApiKey?: string;
};

export type Folder = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  animalIds: string[];
  createdAt: number;
  updatedAt: number;
};

