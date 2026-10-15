"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProductSelect from "@/components/ui/ProductSelect";
import Select from "@/components/ui/Select";
import type { Product } from "@/types/product";
import {
  PLAN_STATUSES,
  PRIORITIES,
  type PlanStatus,
  type Priority,
  type ProductionPlan,
  type ProductionPlanInput,
} from "@/types/production";
import { toDateInput } from "@/utils/format";

export interface PlanFormValues {
  planNumber: string;
  product: string;
  plannedQuantity: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: PlanStatus;
}

type Errors = Partial<Record<keyof PlanFormValues, string>>;

export const emptyPlanForm = (planNumber: string): PlanFormValues => ({
  planNumber,
  product: "",
  plannedQuantity: "",
  startDate: "",
  dueDate: "",
  priority: "NORMAL",
  status: "DRAFT",
});

export const planToForm = (p: ProductionPlan): PlanFormValues => ({
  planNumber: p.planNumber,
  product: p.product?._id ?? "",
  plannedQuantity: String(p.plannedQuantity),
  startDate: toDateInput(p.startDate),
  dueDate: toDateInput(p.dueDate),
  priority: p.priority,
  status: p.status,
});

interface Props {
  initial: PlanFormValues;
  products: Product[];
  submitLabel: string;
  onSubmit: (values: ProductionPlanInput) => Promise<void>;
  onCancel: () => void;
}

export default function ProductionPlanForm({ initial, products, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PlanFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const qty = Number(form.plannedQuantity);

    if (!form.planNumber.trim()) next.planNumber = "Plan number is required";
    if (!form.product) next.product = "Select a product";
    if (!form.plannedQuantity || !Number.isInteger(qty) || qty < 1) next.plannedQuantity = "Enter a whole number, 1 or more";
    if (!form.startDate) next.startDate = "Start date is required";
    if (!form.dueDate) next.dueDate = "Due date is required";
    else if (form.startDate && form.dueDate < form.startDate) next.dueDate = "Due date can't be before the start date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        planNumber: form.planNumber.trim().toUpperCase(),
        product: form.product,
        plannedQuantity: qty,
        startDate: form.startDate,
        dueDate: form.dueDate,
        priority: form.priority,
        status: form.status,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Plan number" className="uppercase" value={form.planNumber}
          onChange={(e) => update("planNumber", e.target.value)} error={errors.planNumber} />
        <ProductSelect products={products} value={form.product} onChange={(v) => update("product", v)} error={errors.product} />

        <Input label="Planned quantity" type="number" min={1} step={1} placeholder="e.g. 500" value={form.plannedQuantity}
          onChange={(e) => update("plannedQuantity", e.target.value)} error={errors.plannedQuantity} />
        <Select label="Priority" value={form.priority} onChange={(e) => update("priority", e.target.value as Priority)}>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>

        <Input label="Start date" type="date" value={form.startDate}
          onChange={(e) => update("startDate", e.target.value)} error={errors.startDate} />
        <Input label="Due date" type="date" value={form.dueDate} min={form.startDate || undefined}
          onChange={(e) => update("dueDate", e.target.value)} error={errors.dueDate} />

        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as PlanStatus)}>
          {PLAN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">{submitLabel}</Button>
      </div>
    </form>
  );
}