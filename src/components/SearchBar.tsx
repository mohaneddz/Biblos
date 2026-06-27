type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder = "Search species, taxonomy, habitat, or facts..." }: SearchBarProps) {
  return (
    <label className="page-card flex items-center gap-3 rounded-[1.75rem] px-5 py-4">
      <span className="text-lg text-app-accent">Search</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-app-text placeholder:text-app-muted/85"
      />
    </label>
  );
}
