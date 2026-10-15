import type { Product } from "@/types/product";
import Select from "./Select";

interface Props {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export default function ProductSelect({ products, value, onChange, error, label = "Product", disabled }: Props) {
  return (
    <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} error={error} disabled={disabled}>
      <option value="" disabled>
        Select product…
      </option>
      {products.map((p) => (
        <option key={p._id} value={p._id}>
          {p.code} — {p.name}
          {p.isActive ? "" : " (inactive)"}
        </option>
      ))}
    </Select>
  );
}