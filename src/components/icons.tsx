import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function TreeLogoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20V11" />
      <path d="M12 11c-1.4 2.6-4.5 4.7-8 5.2 1.7-2.4 2.3-4.4 2.1-6.6 1.5 1.4 3.5 2 5.9 1.8C9.8 9 9 6.3 9.4 4c1.4 1.5 2.3 3 2.6 4.6.7-2 2-3.6 3.9-4.9.4 2.4-.3 5-2.1 7.7 2.3.2 4.2-.4 5.7-1.8-.1 2.2.5 4.2 2.1 6.6-3.5-.5-6.6-2.6-8-5.2" />
      <path d="M9 20h6" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </IconBase>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7.5" cy="8" r="1.8" />
      <circle cx="16.5" cy="8" r="1.8" />
      <circle cx="6" cy="14" r="1.8" />
      <circle cx="18" cy="14" r="1.8" />
      <path d="M12 11.4c2.6 0 4.6 1.9 4.6 4.2 0 1.5-1.3 2.4-4.6 2.4s-4.6-.9-4.6-2.4c0-2.3 2-4.2 4.6-4.2Z" />
    </IconBase>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20V7" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
      <path d="M12 7 6.9 11" />
      <path d="M12 7 17.1 11" />
      <path d="M12 15 8.8 17" />
      <path d="M12 15 15.2 17" />
    </IconBase>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2 5.2-2Z" />
    </IconBase>
  );
}

export function LeafClusterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 19c-2.9-1.7-5.2-4.6-5.2-8.2 0-2.7 1.5-4.9 4.2-6.2 1.3 1.6 1.9 3.3 2 5.1 1.4-1.4 3.1-2.2 5.1-2.5.8 1.2 1.1 2.5 1.1 3.9 0 4.2-3 6.7-7.2 7.9Z" />
      <path d="M7 14c1.7-.2 3.2-.9 4.5-2.1" />
      <path d="M13.7 13.2c1.3-.8 2.4-1.9 3.2-3.4" />
    </IconBase>
  );
}

export function BrainSparkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6.2a3.1 3.1 0 0 1 6.1.8A3.2 3.2 0 0 1 18 10c0 1.1-.5 2.1-1.2 2.8.5.6.8 1.4.8 2.2a3 3 0 0 1-2.9 3H9.4a3 3 0 0 1-3-3c0-.9.3-1.6.8-2.2A4 4 0 0 1 6 10a3.2 3.2 0 0 1 3-3.8Z" />
      <path d="M10 9.5h4" />
      <path d="M10.5 13h3" />
      <path d="M18.5 4.5v3" />
      <path d="M17 6h3" />
    </IconBase>
  );
}

export function CompareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6h4" />
      <path d="M14 18h4" />
      <path d="M8 4v4" />
      <path d="M16 16v4" />
      <path d="M5 18h4" />
      <path d="M15 6h4" />
      <path d="M7 18a2.5 2.5 0 1 1-5 0" />
      <path d="M17 6a2.5 2.5 0 1 1 5 0" />
      <path d="M8 8c1.1 3.1 3 5.1 6 6" />
    </IconBase>
  );
}

export function DiscoverIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20c4.4-1.4 7.5-4.7 8-8-1.4-4.4-4.7-7.5-8-8-4.4 1.4-7.5 4.7-8 8 1.4 4.4 4.7 7.5 8 8Z" />
      <circle cx="12" cy="12" r="2.2" />
    </IconBase>
  );
}

export function AtlasIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 6.5 6-2.5 4 2 6-2v13.5l-6 2-4-2-6 2V6.5Z" />
      <path d="M10 4v13.5" />
      <path d="M14 6v13.5" />
    </IconBase>
  );
}

export function CollectionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="9" width="14" height="11" rx="2.2" />
      <path d="M9 9V7.8A3 3 0 0 1 12 5a3 3 0 0 1 3 2.8V9" />
      <path d="M12 13.5v2.5" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10" />
      <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.4-2-3.5-2.4 1a7.7 7.7 0 0 0-2-.9l-.4-2.5h-4l-.4 2.5c-.7.2-1.3.5-2 .9l-2.4-1-2 3.5 2 1.4A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.4 2 3.5 2.4-1c.6.4 1.3.7 2 .9l.4 2.5h4l.4-2.5c.7-.2 1.4-.5 2-.9l2.4 1 2-3.5-2-1.4c.1-.4.1-.8.1-1.2Z" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4 4" />
    </IconBase>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 4 1.2 3.3L16.5 8.5l-3.3 1.2L12 13l-1.2-3.3L7.5 8.5l3.3-1.2L12 4Z" />
      <path d="m18.5 13 0.8 2.1 2.2 0.8-2.2 0.8-0.8 2.1-0.8-2.1-2.2-0.8 2.2-0.8 0.8-2.1Z" />
      <path d="m5.5 12 0.6 1.7 1.8 0.6-1.8 0.6-0.6 1.7-0.6-1.7-1.8-0.6 1.8-0.6 0.6-1.7Z" />
    </IconBase>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 10a5 5 0 1 1 10 0v3.2l1.4 2.3H5.6L7 13.2V10Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2" />
      <path d="M12 18.3v2.2" />
      <path d="m5.7 5.7 1.6 1.6" />
      <path d="m16.7 16.7 1.6 1.6" />
      <path d="M3.5 12h2.2" />
      <path d="M18.3 12h2.2" />
      <path d="m5.7 18.3 1.6-1.6" />
      <path d="m16.7 7.3 1.6-1.6" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function BinocularsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="14.5" r="3.5" />
      <circle cx="16" cy="14.5" r="3.5" />
      <path d="M6.2 11 8 6h2l1 5" />
      <path d="M12.8 11 14 6h2l1.8 5" />
      <path d="M10 11h4" />
    </IconBase>
  );
}

export function GlobeGridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.5 2.3 4 5.2 4 8.5s-1.5 6.2-4 8.5c-2.5-2.3-4-5.2-4-8.5s1.5-6.2 4-8.5Z" />
    </IconBase>
  );
}

export function MountainIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 18 5.5-8 3.5 4.5 2.3-3 6.7 6.5" />
      <path d="m8.5 10 1.6-2.5 2 2.7" />
    </IconBase>
  );
}

export function RiverIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7c4 0 4 3 8 3s4-3 8-3" />
      <path d="M4 12c4 0 4 3 8 3s4-3 8-3" />
      <path d="M4 17c4 0 4 3 8 3s4-3 8-3" />
    </IconBase>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" />
      <path d="M5.5 6.5v10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-10" />
      <path d="M5.5 11.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
    </IconBase>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8.5" cy="13.5" r="3.5" />
      <path d="M11.5 13.5H20" />
      <path d="M16 13.5v2.5" />
      <path d="M19 13.5V16" />
    </IconBase>
  );
}

export function TuneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 6h8" />
      <path d="M5 12h14" />
      <path d="M11 18h8" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="13" cy="18" r="2" />
    </IconBase>
  );
}

export function MicrobeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3.5v2" />
      <path d="M12 18.5v2" />
      <path d="m5.6 5.6 1.4 1.4" />
      <path d="m17 17 1.4 1.4" />
      <path d="M3.5 12h2" />
      <path d="M18.5 12h2" />
      <path d="m5.6 18.4 1.4-1.4" />
      <path d="m17 7 1.4-1.4" />
      <circle cx="10" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="12.3" r="0.8" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function FungiIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 11a6 6 0 0 1 12 0Z" />
      <path d="M10 11v5a2 2 0 0 0 4 0v-5" />
      <path d="M9 20h6" />
    </IconBase>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18.5 5.5c-6.5.2-11 4.1-11 9.4 0 2.2 1 3.8 2.7 4.6 5-.8 8.8-4.4 9.8-9.2.3-1.6-.1-3.2-1.5-4.8Z" />
      <path d="M9.5 16c2.8-1.2 5.1-3.6 6.5-6.6" />
    </IconBase>
  );
}

export function MammalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 15.5 7 9l3 1.2L12 8l2 2.2L17 9l2 6.5" />
      <path d="M8 15.5v2.5" />
      <path d="M16 15.5v2.5" />
      <path d="M10.2 12.5h3.6" />
    </IconBase>
  );
}

export function BirdIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 14.5c3.5-3.8 7.8-6.4 13-7.5-1 3.9-3.3 7-6.8 9.5H7l-2.5-2Z" />
      <path d="M10.2 11.5 14 13" />
    </IconBase>
  );
}

export function ReptileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 13c0-2.7 2.2-4.8 5-4.8h4c2.8 0 5 2.1 5 4.8s-2.2 4.8-5 4.8h-4c-2.8 0-5-2.1-5-4.8Z" />
      <path d="M10 8.2 8 5.5" />
      <path d="M14 8.2 16 5.5" />
      <path d="M9 17.8 7.2 20" />
      <path d="M15 17.8 16.8 20" />
    </IconBase>
  );
}

export function AmphibianIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 13c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5Z" />
      <path d="M8.5 10.5 6 8" />
      <path d="M15.5 10.5 18 8" />
      <path d="M8.5 15.5 6 18" />
      <path d="M15.5 15.5 18 18" />
    </IconBase>
  );
}

export function MarineIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12c2 0 2 1.5 4 1.5S10 12 12 12s2 1.5 4 1.5S18 12 20 12" />
      <path d="M6 16c2 0 2 1.5 4 1.5S12 16 14 16s2 1.5 4 1.5S18 16 20 16" />
      <path d="M7 9c1.5-2 3.1-3 5-3s3.5 1 5 3" />
    </IconBase>
  );
}

export function FamilyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7.5" cy="9" r="2" />
      <circle cx="16.5" cy="9" r="2" />
      <path d="M5.5 17c0-1.8 1.5-3.2 3.2-3.2h0.6c1.8 0 3.2 1.4 3.2 3.2" />
      <path d="M11.5 17c0-1.8 1.5-3.2 3.2-3.2h0.6c1.8 0 3.2 1.4 3.2 3.2" />
    </IconBase>
  );
}

export function DotSpeciesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4.5" />
    </IconBase>
  );
}

export function MinimizeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function MaximizeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function HeartSolidIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function BookmarkSolidIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden="true"
      {...props}
    >
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

export function HourglassIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 2h14" />
      <path d="M5 22h14" />
      <path d="M19 2 12 10 5 2" />
      <path d="M5 22 12 14 19 22" />
    </IconBase>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </IconBase>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" />
      <path d="m5.6 7.2 1.4-1.4" />
      <path d="m7.2 10.4 1.4-1.4" />
      <path d="m10.4 12 1.4-1.4" />
      <path d="m12 15.2 1.4-1.4" />
      <path d="m15.2 16.8 1.4-1.4" />
    </IconBase>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21.5 2v6h-6V2" />
      <path d="M21.34 8a10 10 0 1 0-.5 6" />
    </IconBase>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </IconBase>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconBase>
  );
}

export function UtensilsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Zm0 2v5" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 18-6-6 6-6" />
    </IconBase>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <polygon points="6 3 20 12 6 21 6 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}



