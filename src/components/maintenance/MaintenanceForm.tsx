"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Machine } from "@/types/machine";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  type MaintenanceInput,
  type MaintenancePriority,
  type MaintenanceStatus,
  type MaintenanceType,
  type MaintenanceWorkOrder,
} from "@/types/maintenance";
import { toDateInput } from "@/utils/format";

export interface MaintenanceFormValues {
  maintenanceNumber: string;
  machine: string;
  type: MaintenanceType;
  title: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo: string; // user id, "" = unassigned
  scheduledDate: string;
  description: string;
  notes: string;
}

type Errors = Partial<Record<keyof MaintenanceFormValues, string>>;

export const emptyMaintenanceForm = (maintenanceNumber: string): MaintenanceFormValues => ({
  maintenanceNumber,
  machine: "",
  type: "PREVENTIVE",
  title: "",
  priority: "MEDIUM",
  status: "OPEN",
  assignedTo: "",
  scheduledDate: "",
  description: "",
  notes: "",
});

export const maintenanceToForm = (m: MaintenanceWorkOrder): MaintenanceFormValues => ({
  maintenanceNumber: m.maintenanceNumber,
  machine: m.machine?._id ?? "",
  type: m.type,
  title: m.title,
  priority: m.priority,
  status: m.status,
  assignedTo: m.assignedTo?._id ?? "",
  scheduledDate: toDateInput(m.scheduledDate),
  description: m.description ?? "",
  notes: m.notes ?? "",
});

export interface AssigneeOption {
  id: string;
  label: string;
}

interface Props {
  initial: MaintenanceFormValues;
  machines: Machine[];
  /** There is no users API, so the choices are: unassigned, me, and whoever is already assigned. */
  assignees: AssigneeOption[];
  submitLabel: string;
  onSubmit: (values: Omit<MaintenanceInput, "completedAt">) => Promise<void>;
  onCancel: () => void;
}

export default function MaintenanceForm({ initial, machines, assignees, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MaintenanceFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof MaintenanceFormValues>(key: K, value: MaintenanceFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.maintenanceNumber.trim()) next.maintenanceNumber = "Maintenance number is required";
    if (!form.machine) next.machine = "Select a machine";
    if (!form.title.trim()) next.title = "Title is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        maintenanceNumber: form.maintenanceNumber.trim().toUpperCase(),
        machine: form.machine,
        type: form.type,
        title: form.title.trim(),
        priority: form.priority,
        status: form.status,
        assignedTo: form.assignedTo || null,
        scheduledDate: form.scheduledDate || null,
        description: form.description.trim(),
        notes: form.notes.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Maintenance number" className="uppercase" value={form.maintenanceNumber}
          onChange={(e) => update("maintenanceNumber", e.target.value.toUpperCase())} error={errors.maintenanceNumber} />
        <Select label="Machine" value={form.machine} onChange={(e) => update("machine", e.target.value)} error={errors.machine}>
          <option value="" disabled>Select machine…</option>
          {machines.map((m) => (
            <option key={m._id} value={m._id}>{m.code} — {m.name}</option>
          ))}
        </Select>

        <div className="sm:col-span-2">
          <Input label="Title" placeholder="e.g. Replace spindle bearing" value={form.title}
            onChange={(e) => update("title", e.target.value)} error={errors.title} />
        </div>

        <Select label="Type" value={form.type} onChange={(e) => update("type", e.target.value as MaintenanceType)}>
          {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select label="Priority" value={form.priority} onChange={(e) => update("priority", e.target.value as MaintenancePriority)}>
          {MAINTENANCE_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>

        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as MaintenanceStatus)}>
          {MAINTENANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Input label="Scheduled date" type="date" value={form.scheduledDate}
          onChange={(e) => update("scheduledDate", e.target.value)} />

        <Select label="Assigned to" value={form.assignedTo} onChange={(e) => update("assignedTo", e.target.value)}>
          <option value="">Unassigned</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </Select>
      </div>

      <Textarea label="Description" placeholder="What needs to be done?" value={form.description}
        onChange={(e) => update("description", e.target.value)} />
      <Textarea label="Notes" placeholder="Parts used, findings, follow-ups" value={form.notes}
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