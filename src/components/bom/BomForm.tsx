"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Bom, BomInput } from "@/types/bom";
import type { Product } from "@/types/product";

interface ItemValues {
  key: string; // only used as the React key
  product: string;
  quantity: string;
  unit: string;
}

export interface BomFormValues {
  product: string;
  isActive: boolean;
  items: ItemValues[];
}

type Errors = Partial<Record<"product" | "items", string>>;
type ItemErrors = Record<string, Partial<Record<"product" | "quantity" | "unit", string>>>;

let counter = 0;
const newKey = () => `bom-item-${++counter}`;
const emptyItem = (): ItemValues => ({ key: newKey(), product: "", quantity: "1", unit: "PCS" });

export const emptyBomForm = (): BomFormValues => ({ product: "", isActive: true, items: [emptyItem()] });

export const bomToForm = (b: Bom): BomFormValues => ({
  product: b.product?._id ?? "",
  isActive: b.isActive,
  items: b.items.map((i) => ({
    key: newKey(),
    product: i.product?._id ?? "",
    quantity: String(i.quantity),
    unit: i.unit,
  })),
});

interface Props {
  initial: BomFormValues;
  products: Product[];
  /** Products that already have a BOM. The API allows only one per product, so they can't be picked again. */
  takenProductIds: string[];
  submitLabel: string;
  onSubmit: (values: BomInput) => Promise<void>;
  onCancel: () => void;
}

export default function BomForm({ initial, products, takenProductIds, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<BomFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof BomFormValues>(key: K, value: BomFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (key: string, field: keyof Omit<ItemValues, "key">, value: string) =>
    setForm((f) => ({ ...f, items: f.items.map((i) => (i.key === key ? { ...i, [field]: value } : i)) }));

  // Picking a component also fills in its unit.
  function chooseComponent(key: string, id: string) {
    const product = products.find((p) => p._id === id);
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.key === key ? { ...i, product: id, unit: product?.unit ?? i.unit } : i)),
    }));
  }

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (key: string) => setForm((f) => ({ ...f, items: f.items.filter((i) => i.key !== key) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const nextItems: ItemErrors = {};

    if (!form.product) next.product = "Select the finished product";
    if (form.items.length === 0) next.items = "Add at least one component";

    const seen = new Set<string>();
    form.items.forEach((item) => {
      const qty = Number(item.quantity);
      const e: ItemErrors[string] = {};
      if (!item.product) e.product = "Select a component";
      else if (item.product === form.product) e.product = "A product can't be its own component";
      else if (seen.has(item.product)) e.product = "Already added";
      if (item.product) seen.add(item.product);
      if (!item.quantity || !Number.isFinite(qty) || qty < 0.01) e.quantity = "At least 0.01";
      if (!item.unit.trim()) e.unit = "Required";
      if (Object.keys(e).length) nextItems[item.key] = e;
    });

    setErrors(next);
    setItemErrors(nextItems);
    if (Object.keys(next).length || Object.keys(nextItems).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        product: form.product,
        isActive: form.isActive,
        items: form.items.map((i) => ({ product: i.product, quantity: Number(i.quantity), unit: i.unit.trim().toUpperCase() })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Select label="Finished product" value={form.product} onChange={(e) => update("product", e.target.value)} error={errors.product}>
        <option value="" disabled>Select product…</option>
        {products.map((p) => {
          const taken = takenProductIds.includes(p._id) && p._id !== initial.product;
          return (
            <option key={p._id} value={p._id} disabled={taken}>
              {p.code} — {p.name}{taken ? " (already has a BOM)" : ""}
            </option>
          );
        })}
      </Select>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Components</h3>
          <button type="button" onClick={addItem}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
            <Plus className="h-4 w-4" /> Add component
          </button>
        </div>

        <div className="hidden gap-3 px-1 pb-1 text-xs uppercase tracking-wider text-slate-500 sm:grid sm:grid-cols-[1fr_110px_90px_36px]">
          <span>Component</span><span>Quantity</span><span>Unit</span><span />
        </div>

        <div className="space-y-3">
          {form.items.map((item) => {
            const err = itemErrors[item.key] ?? {};
            return (
              <div key={item.key}
                className="grid items-start gap-3 rounded-lg border border-slate-800 p-3 sm:grid-cols-[1fr_110px_90px_36px] sm:border-0 sm:p-0">
                <Select aria-label="Component" value={item.product} error={err.product}
                  onChange={(e) => chooseComponent(item.key, e.target.value)}>
                  <option value="" disabled>Select component…</option>
                  {products.filter((p) => p._id !== form.product).map((p) => (
                    <option key={p._id} value={p._id}>{p.code} — {p.name}{p.isActive ? "" : " (inactive)"}</option>
                  ))}
                </Select>
                <Input label="" aria-label="Quantity" type="number" min={0.01} step="any" value={item.quantity}
                  onChange={(e) => updateItem(item.key, "quantity", e.target.value)} error={err.quantity} />
                <Input label="" aria-label="Unit" className="uppercase" value={item.unit}
                  onChange={(e) => updateItem(item.key, "unit", e.target.value.toUpperCase())} error={err.unit} />
                <button type="button" onClick={() => removeItem(item.key)} disabled={form.items.length === 1}
                  aria-label="Remove component"
                  className="flex h-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        {errors.items && <p className="mt-2 text-xs text-red-400">{errors.items}</p>}
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-blue-600" />
        Active
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">{submitLabel}</Button>
      </div>
    </form>
  );
}