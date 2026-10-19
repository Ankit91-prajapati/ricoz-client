"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Machine } from "@/types/machine";
import { OPERATION_STATUSES, type OperationExecution, type OperationInput, type OperationStatus } from "@/types/operation";
import type { WorkOrder } from "@/types/production";

export interface OperationFormValues {
  workOrder: string;
  machine: string;
  operationName: string;
  status: OperationStatus;
  plannedQuantity: string;
  goodQuantity: string;
  rejectedQuantity: string;
  notes: string;
}

type Errors = Partial<Record<keyof OperationFormValues, string>>;

export const emptyOperationForm: OperationFormValues = {
  workOrder: "",
  machine: "",
  operationName: "",
  status: "NOT_STARTED",
  plannedQuantity: "0",
  goodQuantity: "0",
  rejectedQuantity: "0",
  notes: "",
};

export const operationToForm = (o: OperationExecution): OperationFormValues => ({
  workOrder: o.workOrder?._id ?? "",
  machine: o.machine?._id ?? "",
  operationName: o.operationName,
  status: o.status,
  plannedQuantity: String(o.plannedQuantity),
  goodQuantity: String(o.goodQuantity),
  rejectedQuantity: String(o.rejectedQuantity),
  notes: o.notes ?? "",
});

const isCount = (raw: string) => raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 0;

interface Props {
  initial: OperationFormValues;
  workOrders: WorkOrder[];
  machines: Machine[];
  submitLabel: string;
  onSubmit: (values: Omit<OperationInput, "startedAt" | "completedAt" | "operator">) => Promise<void>;
  onCancel: () => void;
}

export default function OperationForm({ initial, workOrders, machines, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<OperationFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof OperationFormValues>(key: K, value: OperationFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Picking a work order fills in the planned quantity if nothing was entered yet.
  function chooseWorkOrder(id: string) {
    const order = workOrders.find((w) => w._id === id);
    setForm((f) => ({
      ...f,
      workOrder: id,
      plannedQuantity: f.plannedQuantity === "0" && order ? String(order.plannedQuantity) : f.plannedQuantity,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.workOrder) next.workOrder = "Select a work order";
    if (!form.operationName.trim()) next.operationName = "Operation name is required";
    if (!isCount(form.plannedQuantity)) next.plannedQuantity = "Whole number, 0 or more";
    if (!isCount(form.goodQuantity)) next.goodQuantity = "Whole number, 0 or more";
    if (!isCount(form.rejectedQuantity)) next.rejectedQuantity = "Whole number, 0 or more";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        workOrder: form.workOrder,
        machine: form.machine || null,
        operationName: form.operationName.trim(),
        status: form.status,
        plannedQuantity: Number(form.plannedQuantity),
        goodQuantity: Number(form.goodQuantity),
        rejectedQuantity: Number(form.rejectedQuantity),
        notes: form.notes.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Work order" value={form.workOrder} onChange={(e) => chooseWorkOrder(e.target.value)} error={errors.workOrder}>
          <option value="" disabled>Select work order…</option>
          {workOrders.map((w) => (
            <option key={w._id} value={w._id}>{w.workOrderNumber}{w.product ? ` — ${w.product.name}` : ""}</option>
          ))}
        </Select>
        <Select label="Machine (optional)" value={form.machine} onChange={(e) => update("machine", e.target.value)}>
          <option value="">No machine</option>
          {machines.map((m) => (
            <option key={m._id} value={m._id}>{m.code} — {m.name}</option>
          ))}
        </Select>

        <Input label="Operation name" placeholder="e.g. Cutting, Welding, Assembly" value={form.operationName}
          onChange={(e) => update("operationName", e.target.value)} error={errors.operationName} />
        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as OperationStatus)}>
          {OPERATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="Planned" type="number" min={0} step={1} value={form.plannedQuantity}
          onChange={(e) => update("plannedQuantity", e.target.value)} error={errors.plannedQuantity} />
        <Input label="Good" type="number" min={0} step={1} value={form.goodQuantity}
          onChange={(e) => update("goodQuantity", e.target.value)} error={errors.goodQuantity} />
        <Input label="Rejected" type="number" min={0} step={1} value={form.rejectedQuantity}
          onChange={(e) => update("rejectedQuantity", e.target.value)} error={errors.rejectedQuantity} />
      </div>

      <Textarea label="Notes" placeholder="Anything the next shift should know" value={form.notes}
        onChange={(e) => update("notes", e.target.value)} />

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">{submitLabel}</Button>
      </div>
    </form>
  );
}