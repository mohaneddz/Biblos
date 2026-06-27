export type ConservationStatus =
  | "Least Concern"
  | "Near Threatened"
  | "Vulnerable"
  | "Endangered"
  | "Critically Endangered"
  | "Extinct";

export type ActivityPattern = "Diurnal" | "Nocturnal" | "Crepuscular" | "Cathemeral";

export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Australia"
  | "Antarctica"
  | "Oceans";

export type Animal = {
  id: string;
  commonName: string;
  scientificName: string;
  averageLifespanYears: number;
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
    lengthCm?: number;
    heightCm?: number;
    wingspanCm?: number;
  };
  weightKg?: number;
  images: string[];
  has3DModel: boolean;
  sourceUrls?: string[];
  lastFetchedAt?: string;
};

export type AppSettings = {
  dataMode: "mock" | "cached" | "live";
  theme: "dark-academic";
  aiEnabled: boolean;
  storageLocation: string;
};
