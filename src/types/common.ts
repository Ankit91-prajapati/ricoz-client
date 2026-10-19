/** A dropdown option that also knows how to render itself as a badge. */
export interface OptionMeta {
  value: string;
  label: string;
  badge: string;
  dot: string;
}

/** Shape of a product after the API runs .populate("product", "name code ...") */
export interface ProductRef {
  _id: string;
  name: string;
  code: string;
  type?: string;
  unit?: string;
}

export function findMeta(list: readonly OptionMeta[], value: string): OptionMeta {
  return (
    list.find((o) => o.value === value) ?? {
      value,
      label: value,
      badge: "bg-slate-500/10 text-slate-300",
      dot: "bg-slate-400",
    }
  );
}

/** A populated User reference. The API may send `name` or `username` depending on the populate fields. */
export interface UserRef {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
}

export const userName = (u?: UserRef | null) => u?.username ?? u?.name ?? u?.email ?? "—";

