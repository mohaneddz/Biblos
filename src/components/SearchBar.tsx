import { SearchIcon } from "./icons";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onLookup?: () => void;
  lookupLabel?: string;
  lookupDisabled?: boolean;
  busy?: boolean;
  statusLabel?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search species, taxonomy, habitat, or facts...",
  onLookup,
  lookupLabel = "lookup",
  lookupDisabled,
  busy = false,
  statusLabel,
}: SearchBarProps) {
  return (
    <div className="page-card flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 lg:flex-row lg:items-center">
      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-white/6 bg-black/20 px-4 py-3 focus-within:border-app-accent/40 focus-within:ring-1 focus-within:ring-app-accent/40 transition duration-150">
        <SearchIcon className="h-5 w-5 text-app-accent flex-shrink-0" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === "Enter" && onLookup && !lookupDisabled) {
              onLookup();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base text-app-text placeholder:text-app-muted/85 outline-none focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        {onLookup ? (
          <button type="button" className="primary-button text-sm" onClick={onLookup} disabled={lookupDisabled}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>{lookupLabel}</span>
              </span>
            ) : (
              <>
                <SearchIcon className="h-4.5 w-4.5" />
                <span>{lookupLabel}</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      {statusLabel ? <span className="text-sm leading-6 text-app-soft lg:hidden">{statusLabel}</span> : null}
    </div>
  );
}
