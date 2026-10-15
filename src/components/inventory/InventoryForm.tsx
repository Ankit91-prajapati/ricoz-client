"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProductSelect from "@/components/ui/ProductSelect";
import type { InventoryInput, InventoryItem } from "@/types/inventory";
import type { Product } from "@/types/product";

export interface InventoryFormValues {
  product: string;
  quantity: string;
  reservedQuantity: string;
  reorderLevel: string;
}

type Errors = Partial<Record<keyof InventoryFormValues, string>>;

export const emptyInventoryForm: InventoryFormValues = {
  product: "",
  quantity: "0",
  reservedQuantity: "0",
  reorderLevel: "0",
};

export const inventoryToForm = (i: InventoryItem): InventoryFormValues => ({
  product: i.product?._id ?? "",
  quantity: String(i.quantity),
  reservedQuantity: String(i.reservedQuantity),
  reorderLevel: String(i.reorderLevel),
});

interface Props {
  initial: InventoryFormValues;
  /** Create mode: products that don't have a stock record yet. Edit mode: pass `lockedProduct` instead. */
  products?: Product[];
  lockedProduct?: string;
  submitLabel: string;
  onSubmit: (values: InventoryInput) => Promise<void>;
  onCancel: () => void;
}

export default function InventoryForm({ initial, products = [], lockedProduct, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<InventoryFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof InventoryFormValues, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const quantity = Number(form.quantity);
    const reserved = Number(form.reservedQuantity);
    const reorder = Number(form.reorderLevel);
    const valid = (raw: string, n: number) => raw.trim() !== "" && Number.isFinite(n) && n >= 0;

    if (!form.product) next.product = "Select a product";
    if (!valid(form.quantity, quantity)) next.quantity = "Enter 0 or more";
    if (!valid(form.reservedQuantity, reserved)) next.reservedQuantity = "Enter 0 or more";
    else if (!next.quantity && reserved > quantity) next.reservedQuantity = "Can't be more than the quantity on hand";
    if (!valid(form.reorderLevel, reorder)) next.reorderLevel = "Enter 0 or more";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({ product: form.product, quantity, reservedQuantity: reserved, reorderLevel: reorder });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {lockedProduct ? (
        <div>
          <p className="text-sm font-medium text-slate-300">Product</p>
          <p className="mt-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">{lockedProduct}</p>
        </div>
      ) : (
        <>
          <ProductSelect products={products} value={form.product} onChange={(v) => update("product", v)} error={errors.product} />
          {products.length === 0 && (
            <p className="-mt-2 text-xs text-amber-300">Every active product already has a stock record.</p>
          )}
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="On hand" type="number" min={0} step="any" value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)} error={errors.quantity} />
        <Input label="Reserved" type="number" min={0} step="any" value={form.reservedQuantity}
          onChange={(e) => update("reservedQuantity", e.target.value)} error={errors.reservedQuantity} />
        <Input label="Reorder level" type="number" min={0} step="any" value={form.reorderLevel}
          onChange={(e) => update("reorderLevel", e.target.value)} error={errors.reorderLevel} />
      </div>
      <p className="text-xs text-slate-500">Available = on hand − reserved. Stock shows as low when available drops to the reorder level.</p>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">{submitLabel}</Button>
      </div>
    </form>
  );
}