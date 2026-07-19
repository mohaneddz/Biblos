import { useState } from "react";

type PageHeaderProps = {
  title: string;
  description: React.ReactNode;
  storageKey: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, storageKey, actions }: PageHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(`biblos.header-collapsed.${storageKey}`) === "true";
    }
    return false;
  });

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(`biblos.header-collapsed.${storageKey}`, String(next));
      return next;
    });
  };

  return (
    <section className="page-card rounded-[1.85rem] p-6 transition-all duration-300 ease-in-out shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="page-title select-none flex items-center gap-3">
            {title}
          </h1>
          
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? "max-h-0 opacity-0 mt-0" : "max-h-[12rem] opacity-100 mt-3"
            }`}
          >
            <div className="page-lede text-app-muted pr-2 leading-relaxed">{description}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden flex gap-2 ${
              isCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {actions}
          </div>
          
          <button
            type="button"
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-app-soft hover:bg-white/[0.08] hover:text-white transition duration-200 cursor-pointer select-none"
            title={isCollapsed ? "Show page description" : "Hide page description"}
          >
            {isCollapsed ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
