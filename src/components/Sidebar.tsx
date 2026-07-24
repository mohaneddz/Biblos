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

export function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <aside className="sidebar-shell border-b border-white/6 px-3 py-4 sm:px-4 sm:py-5 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="flex max-w-3xl flex-col gap-4 lg:h-full lg:max-w-none lg:gap-6">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-1 sm:gap-4 sm:px-3"}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-app-accent/20 bg-app-accent/6 text-app-accent sm:h-14 sm:w-14">
            <TreeLogoIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-[1.7rem] leading-none tracking-[0.03em] text-app-text sm:text-[2rem]">Biblos</p>
              <p className="mt-1 text-[0.66rem] uppercase tracking-[0.35em] text-app-accent/80 sm:text-xs sm:tracking-[0.45em]">Zoes</p>
            </div>
          )}
        </div>


        <nav className={`sidebar-nav flex gap-1.5 overflow-x-auto pb-1 sm:gap-2 lg:grid lg:overflow-visible lg:pb-0 ${collapsed ? "justify-items-center" : ""}`}>
          {navItems.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                [
                  "flex min-w-max items-center gap-2.5 rounded-2xl px-3 py-2 text-xs transition sm:px-4 sm:py-2.5 sm:text-sm lg:text-base lg:min-w-0",
                  collapsed ? "lg:justify-center lg:px-3" : "",
                  isActive ? "bg-white/9 text-app-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] font-medium" : "text-app-muted hover:bg-white/5 hover:text-app-text",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {onToggle && (
          <div className="mt-auto hidden lg:flex border-t border-white/5 pt-4 justify-center">
            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-app-soft hover:text-white hover:bg-white/5 transition cursor-pointer font-semibold text-lg"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
