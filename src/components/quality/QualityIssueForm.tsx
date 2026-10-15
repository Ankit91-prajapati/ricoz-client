"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProductSelect from "@/components/ui/ProductSelect";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Product } from "@/types/product";
import type { WorkOrder } from "@/types/production";
import {
  ISSUE_STATUSES,
  QUALITY_TYPES,
  SEVERITIES,
  type IssueStatus,
  type QualityIssue,
  type QualityIssueInput,
  type QualityType,
  type Severity,
} from "@/types/quality";

export interface QualityFormValues {
  issueNumber: string;
  workOrder: string;
  product: string;
  type: QualityType;
  severity: Severity;
  status: IssueStatus;
  quantityInspected: string;
  quantityPassed: string;
  quantityFailed: string;
  defectType: string;
  description: string;
  correctiveAction: string;
}

type Errors = Partial<Record<keyof QualityFormValues, string>>;

export const emptyQualityForm = (issueNumber: string): QualityFormValues => ({
  issueNumber,
  workOrder: "",
  product: "",
  type: "INSPECTION",
  severity: "MEDIUM",
  status: "OPEN",
  quantityInspected: "0",
  quantityPassed: "0",
  quantityFailed: "0",
  defectType: "",
  description: "",
  correctiveAction: "",
});

export const qualityIssueToForm = (q: QualityIssue): QualityFormValues => ({
  issueNumber: q.issueNumber,
  workOrder: q.workOrder?._id ?? "",
  product: q.product?._id ?? "",
  type: q.type,
  severity: q.severity,
  status: q.status,
  quantityInspected: String(q.quantityInspected),
  quantityPassed: String(q.quantityPassed),
  quantityFailed: String(q.quantityFailed),
  defectType: q.defectType ?? "",
  description: q.description ?? "",
  correctiveAction: q.correctiveAction ?? "",
});

const isCount = (raw: string) => raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 0;

interface Props {
  initial: QualityFormValues;
  workOrders: WorkOrder[];
  products: Product[];
  submitLabel: string;
  onSubmit: (values: QualityIssueInput) => Promise<void>;
  onCancel: () => void;
}

export default function QualityIssueForm({ initial, workOrders, products, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<QualityFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof QualityFormValues>(key: K, value: QualityFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Picking a work order also picks its product.
  function chooseWorkOrder(id: string) {
    const order = workOrders.find((w) => w._id === id);
    setForm((f) => ({ ...f, workOrder: id, product: order?.product?._id ?? f.product }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};

    if (!form.issueNumber.trim()) next.issueNumber = "Issue number is required";
    if (!form.workOrder) next.workOrder = "Select a work order";
    if (!isCount(form.quantityInspected)) next.quantityInspected = "Whole number, 0 or more";
    if (!isCount(form.quantityPassed)) next.quantityPassed = "Whole number, 0 or more";
    if (!isCount(form.quantityFailed)) next.quantityFailed = "Whole number, 0 or more";
    if (!next.quantityInspected && !next.quantityPassed && !next.quantityFailed) {
      if (Number(form.quantityPassed) + Number(form.quantityFailed) > Number(form.quantityInspected)) {
        next.quantityPassed = "Passed + failed can't exceed inspected";
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        issueNumber: form.issueNumber.trim().toUpperCase(),
        workOrder: form.workOrder,
        product: form.product || null,
        type: form.type,
        severity: form.severity,
        status: form.status,
        quantityInspected: Number(form.quantityInspected),
        quantityPassed: Number(form.quantityPassed),
        quantityFailed: Number(form.quantityFailed),
        defectType: form.defectType.trim(),
        description: form.description.trim(),
        correctiveAction: form.correctiveAction.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Issue number" className="uppercase" value={form.issueNumber}
          onChange={(e) => update("issueNumber", e.target.value)} error={errors.issueNumber} />
        <Select label="Work order" value={form.workOrder} onChange={(e) => chooseWorkOrder(e.target.value)} error={errors.workOrder}>
          <option value="" disabled>Select work order…</option>
          {workOrders.map((w) => (
            <option key={w._id} value={w._id}>{w.workOrderNumber}{w.product ? ` — ${w.product.name}` : ""}</option>
          ))}
        </Select>

        <ProductSelect label="Product (optional)" products={products} value={form.product} onChange={(v) => update("product", v)} />
        <Select label="Type" value={form.type} onChange={(e) => update("type", e.target.value as QualityType)}>
          {QUALITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>

        <Select label="Severity" value={form.severity} onChange={(e) => update("severity", e.target.value as Severity)}>
          {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as IssueStatus)}>
          {ISSUE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="Inspected" type="number" min={0} step={1} value={form.quantityInspected}
          onChange={(e) => update("quantityInspected", e.target.value)} error={errors.quantityInspected} />
        <Input label="Passed" type="number" min={0} step={1} value={form.quantityPassed}
          onChange={(e) => update("quantityPassed", e.target.value)} error={errors.quantityPassed} />
        <Input label="Failed" type="number" min={0} step={1} value={form.quantityFailed}
          onChange={(e) => update("quantityFailed", e.target.value)} error={errors.quantityFailed} />
      </div>

      <Input label="Defect type" placeholder="e.g. Surface scratch, wrong dimension" value={form.defectType}
        onChange={(e) => update("defectType", e.target.value)} />
      <Textarea label="Description" placeholder="What was found?" value={form.description}
        onChange={(e) => update("description", e.target.value)} />
      <Textarea label="Corrective action" placeholder="What will be done about it?" value={form.correctiveAction}
        onChange={(e) => update("correctiveAction", e.target.value)} />

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">{submitLabel}</Button>
      </div>
    </form>
  );
}