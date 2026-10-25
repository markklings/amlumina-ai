import { LuSearch } from "react-icons/lu";

interface Props {
  value: string;
  label: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function SearchField({
  value,
  label,
  placeholder,
  onChange,
}: Props) {
  return (
    <div className="relative">
      <LuSearch
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
      />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
      />
    </div>
  );
}
