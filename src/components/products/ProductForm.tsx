"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PRODUCT_TYPES, UNIT_SUGGESTIONS, type ProductInput } from "@/types/product";

type Errors = Partial<Record<"name" | "code" | "type" | "unit", string>>;

const EMPTY: ProductInput = { name: "", code: "", type: "" as ProductInput["type"], unit: "PCS", isActive: true };

interface Props {
  initial?: ProductInput;
  submitLabel: string;
  onSubmit: (values: ProductInput) => Promise<void>;
}

/** Shared by Add Product and Edit Product. */
export default function ProductForm({ initial = EMPTY, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState<ProductInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Product name is required";
    if (!form.code.trim()) next.code = "Product code is required";
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) next.code = "Use letters, numbers, - or _ only";
    if (!form.type) next.type = "Select a product type";
    if (!form.unit.trim()) next.unit = "Unit is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        unit: form.unit.trim().toUpperCase(),
        isActive: form.isActive,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Product name" placeholder="e.g. Steel Rod 10mm" value={form.name}
            onChange={(e) => update("name", e.target.value)} error={errors.name} />
        </div>

        <Input label="Product code" placeholder="e.g. RM-001" className="uppercase" value={form.code}
          onChange={(e) => update("code", e.target.value.toUpperCase())} error={errors.code} />

        <Select label="Type" value={form.type} onChange={(e) => update("type", e.target.value as ProductInput["type"])}
          error={errors.type}>
          <option value="" disabled>Select type…</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        <div>
          <Input label="Unit" list="unit-suggestions" placeholder="PCS" value={form.unit}
            onChange={(e) => update("unit", e.target.value)} error={errors.unit} />
          <datalist id="unit-suggestions">
            {UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}
          </datalist>
        </div>

        <div className="flex items-end">
          <label className="flex h-11 cursor-pointer items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-blue-600" />
            Active
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
        <Link href="/products"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:bg-slate-800">
          Cancel
        </Link>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}