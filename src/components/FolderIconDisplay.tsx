import {
  Folder,
  PawPrint,
  Fish,
  Bird,
  Bug,
  Trees,
  Waves,
  Mountain,
  Flame,
  Snowflake,
  Crown,
  Star,
  Sparkles,
  Feather,
  Globe,
  Droplets,
  Shield,
  Compass,
  Anchor,
  Skull,
  Heart,
  Dna,
  type LucideProps,
} from "lucide-react";

export type IconOption = {
  key: string;
  label: string;
  Icon: React.ComponentType<LucideProps>;
};

export const FOLDER_ICON_OPTIONS: IconOption[] = [
  { key: "folder", label: "Folder", Icon: Folder },
  { key: "paw", label: "Paw", Icon: PawPrint },
  { key: "fish", label: "Aquatic", Icon: Fish },
  { key: "bird", label: "Bird", Icon: Bird },
  { key: "bug", label: "Insect", Icon: Bug },
  { key: "trees", label: "Forest", Icon: Trees },
  { key: "waves", label: "Ocean", Icon: Waves },
  { key: "mountain", label: "Mountain", Icon: Mountain },
  { key: "flame", label: "Desert / Hot", Icon: Flame },
  { key: "snowflake", label: "Polar", Icon: Snowflake },
  { key: "crown", label: "Apex / Royal", Icon: Crown },
  { key: "star", label: "Featured", Icon: Star },
  { key: "sparkles", label: "Cool / Rare", Icon: Sparkles },
  { key: "feather", label: "Plumage", Icon: Feather },
  { key: "globe", label: "Global", Icon: Globe },
  { key: "droplets", label: "Wetlands", Icon: Droplets },
  { key: "shield", label: "Protected", Icon: Shield },
  { key: "compass", label: "Navigation", Icon: Compass },
  { key: "anchor", label: "Marine", Icon: Anchor },
  { key: "skull", label: "Endangered", Icon: Skull },
  { key: "heart", label: "Favorites", Icon: Heart },
  { key: "dna", label: "Taxonomy", Icon: Dna },
];

const EMOJI_TO_KEY_MAP: Record<string, string> = {
  "📁": "folder",
  "🦁": "paw",
  "🐬": "fish",
  "🦅": "bird",
  "🌿": "trees",
  "🌊": "waves",
  "🐾": "paw",
  "👑": "crown",
  "⭐": "star",
  "🧬": "dna",
  "❄️": "snowflake",
  "🌋": "mountain",
  "🔥": "flame",
  "🦜": "bird",
  "🐍": "bug",
  "🦈": "fish",
};

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = Object.fromEntries(
  FOLDER_ICON_OPTIONS.map((opt) => [opt.key, opt.Icon])
);

type FolderIconDisplayProps = {
  iconKey?: string;
  className?: string;
  size?: number;
  color?: string;
};

export function FolderIconDisplay({
  iconKey = "folder",
  className = "h-5 w-5",
  size,
  color,
}: FolderIconDisplayProps) {
  // Normalize emoji or legacy keys to key name
  const normalizedKey = EMOJI_TO_KEY_MAP[iconKey] || iconKey;
  const Component = ICON_MAP[normalizedKey] || Folder;

  return <Component className={className} size={size} color={color} aria-hidden="true" />;
}
