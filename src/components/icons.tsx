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
