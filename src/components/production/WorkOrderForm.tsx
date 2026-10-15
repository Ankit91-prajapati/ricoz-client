"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProductSelect from "@/components/ui/ProductSelect";
import Select from "@/components/ui/Select";
import type { Product } from "@/types/product";
import {
  PRIORITIES,
  WORK_ORDER_STATUSES,
  type Priority,
  type ProductionPlan,
  type WorkOrder,
  type WorkOrderInput,
  type WorkOrderStatus,
} from "@/types/production";
import { toDateInput } from "@/utils/format";

export interface WorkOrderFormValues {
  workOrderNumber: string;
  productionPlan: string;
  product: string;
  plannedQuantity: string;
  producedQuantity: string;
  rejectedQuantity: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: WorkOrderStatus;
}

type Errors = Partial<Record<keyof WorkOrderFormValues, string>>;

export const emptyWorkOrderForm = (workOrderNumber: string): WorkOrderFormValues => ({
  workOrderNumber,
  productionPlan: "",
  product: "",
  plannedQuantity: "",
  producedQuantity: "0",
  rejectedQuantity: "0",
  startDate: "",
  dueDate: "",
  priority: "NORMAL",
  status: "CREATED",
});

/** Start a new work order pre-filled from a production plan. */
export const planToWorkOrderForm = (plan: ProductionPlan, workOrderNumber: string): WorkOrderFormValues => ({
  ...emptyWorkOrderForm(workOrderNumber),
  productionPlan: plan._id,
  product: plan.product?._id ?? "",
  plannedQuantity: String(plan.plannedQuantity),
  startDate: toDateInput(plan.startDate),
  dueDate: toDateInput(plan.dueDate),
  priority: plan.priority,
});

export const workOrderToForm = (w: WorkOrder): WorkOrderFormValues => ({
  workOrderNumber: w.workOrderNumber,
  productionPlan: w.productionPlan?._id ?? "",
  product: w.product?._id ?? "",
  plannedQuantity: String(w.plannedQuantity),
  producedQuantity: String(w.producedQuantity),
  rejectedQuantity: String(w.rejectedQuantity),
  startDate: toDateInput(w.startDate),
  dueDate: toDateInput(w.dueDate),
  priority: w.priority,
  status: w.status,
});

const isWhole = (n: number, min: number) => Number.isInteger(n) && n >= min;

interface Props {
  initial: WorkOrderFormValues;
  products: Product[];
  plans: ProductionPlan[];
  submitLabel: string;
  onSubmit: (values: WorkOrderInput) => Promise<void>;
  onCancel: () => void;
}

export default function WorkOrderForm({ initial, products, plans, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<WorkOrderFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof WorkOrderFormValues>(key: K, value: WorkOrderFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Choosing a plan copies its product, quantity, dates and priority into the form.
  function choosePlan(id: string) {
    const plan = plans.find((p) => p._id === id);
    setForm((f) =>
      plan
        ? {
            ...f,
            productionPlan: id,
            product: plan.product?._id ?? f.product,
            plannedQuantity: String(plan.plannedQuantity),
            startDate: toDateInput(plan.startDate),
            dueDate: toDateInput(plan.dueDate),
            priority: plan.priority,
          }
        : { ...f, productionPlan: "" },
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const planned = Number(form.plannedQuantity);
    const produced = Number(form.producedQuantity);
    const rejected = Number(form.rejectedQuantity);

    if (!form.workOrderNumber.trim()) next.workOrderNumber = "Work order number is required";
    if (!form.product) next.product = "Select a product";
    if (!form.plannedQuantity || !isWhole(planned, 1)) next.plannedQuantity = "Enter a whole number, 1 or more";
    if (form.producedQuantity === "" || !isWhole(produced, 0)) next.producedQuantity = "Enter 0 or more";
    if (form.rejectedQuantity === "" || !isWhole(rejected, 0)) next.rejectedQuantity = "Enter 0 or more";
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) next.dueDate = "Due date can't be before the start date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        workOrderNumber: form.workOrderNumber.trim().toUpperCase(),
        productionPlan: form.productionPlan || null,
        product: form.product,
        plannedQuantity: planned,
        producedQuantity: produced,
        rejectedQuantity: rejected,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
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
        <Input label="Work order number" className="uppercase" value={form.workOrderNumber}
          onChange={(e) => update("workOrderNumber", e.target.value)} error={errors.workOrderNumber} />
        <Select label="Production plan (optional)" value={form.productionPlan} onChange={(e) => choosePlan(e.target.value)}>
          <option value="">No plan</option>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.planNumber}{p.product ? ` — ${p.product.name}` : ""}
            </option>
          ))}
        </Select>

        <div className="sm:col-span-2">
          <ProductSelect products={products} value={form.product} onChange={(v) => update("product", v)} error={errors.product} />
        </div>

        <Input label="Planned quantity" type="number" min={1} step={1} value={form.plannedQuantity}
          onChange={(e) => update("plannedQuantity", e.target.value)} error={errors.plannedQuantity} />
        <Select label="Priority" value={form.priority} onChange={(e) => update("priority", e.target.value as Priority)}>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>

        <Input label="Produced quantity" type="number" min={0} step={1} value={form.producedQuantity}
          onChange={(e) => update("producedQuantity", e.target.value)} error={errors.producedQuantity} />
        <Input label="Rejected quantity" type="number" min={0} step={1} value={form.rejectedQuantity}
          onChange={(e) => update("rejectedQuantity", e.target.value)} error={errors.rejectedQuantity} />

        <Input label="Start date" type="date" value={form.startDate}
          onChange={(e) => update("startDate", e.target.value)} />
        <Input label="Due date" type="date" value={form.dueDate} min={form.startDate || undefined}
          onChange={(e) => update("dueDate", e.target.value)} error={errors.dueDate} />

        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as WorkOrderStatus)}>
          {WORK_ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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