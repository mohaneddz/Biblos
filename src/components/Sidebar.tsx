import { NavLink } from "react-router-dom";
import {
  BranchIcon,
  BrainSparkIcon,
  CollectionIcon,
  CompareIcon,
  CompassIcon,
  HomeIcon,
  LeafClusterIcon,
  PawIcon,
  SettingsIcon,
  TreeLogoIcon,
} from "./icons";

const navItems = [
  ["/", "Home", HomeIcon],
  ["/species", "Species", PawIcon],
  ["/tree", "Tree of Life", BranchIcon],
  ["/explorer", "Explorer", CompassIcon],
  ["/ecosystems", "Ecosystems", LeafClusterIcon],
  ["/ai", "AI Naturalist", BrainSparkIcon],
  ["/compare", "Compare", CompareIcon],
  ["/collection", "Collection", CollectionIcon],
  ["/settings", "Settings", SettingsIcon],
] as const;

export function Sidebar() {
  return (
    <aside className="sidebar-shell border-b border-white/6 px-3 py-4 sm:px-4 sm:py-5 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="flex max-w-3xl flex-col gap-4 lg:h-full lg:max-w-none lg:gap-6">
        <div className="flex items-center gap-3 px-1 sm:gap-4 sm:px-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-app-accent/20 bg-app-accent/6 text-app-accent sm:h-14 sm:w-14">
            <TreeLogoIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div>
            <p className="font-display text-[1.7rem] leading-none tracking-[0.03em] text-app-text sm:text-[2rem]">Biblos</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.35em] text-app-accent/80 sm:text-xs sm:tracking-[0.45em]">Zoes</p>
          </div>
        </div>


        <nav className="sidebar-nav flex gap-2 overflow-x-auto pb-1 sm:gap-2 lg:grid lg:overflow-visible lg:pb-0">
          {navItems.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm transition sm:text-base lg:min-w-0",
                  isActive ? "bg-white/9 text-app-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" : "text-app-muted hover:bg-white/5 hover:text-app-text",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </aside>
  );
}
