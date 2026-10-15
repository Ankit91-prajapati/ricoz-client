import { useId, type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export default function Select({ label, error, className = "", children, ...rest }: Props) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-11 w-full rounded-lg border bg-slate-900 px-3 text-sm text-slate-100 transition focus:outline-none focus:ring-2 ${
          error
            ? "border-red-500/70 focus:ring-red-500/40"
            : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/40"
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}