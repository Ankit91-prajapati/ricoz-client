import type { OptionMeta } from "@/types/common";

interface Props {
  options: readonly OptionMeta[];
  counts: Record<string, number>;
  active: string; // "" = no filter
  onChange: (value: string) => void;
}

/** Row of count cards; clicking one filters the list, clicking again clears it. */
export default function StatusFilterCards({ options, counts, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => {
        const isActive = active === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(isActive ? "" : o.value)}
            className={`min-w-32.5 flex-1 rounded-xl border p-3 text-left transition ${
              isActive ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900 hover:border-slate-700"
            }`}
          >
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${o.dot}`} /> {o.label}
            </span>
            <span className="mt-1 block text-2xl font-semibold">{counts[o.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}