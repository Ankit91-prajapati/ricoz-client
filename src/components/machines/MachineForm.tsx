"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { MACHINE_STATUSES, type MachineInput } from "@/types/machine";

type Errors = Partial<Record<"name" | "code", string>>;

const EMPTY: MachineInput = { name: "", code: "", status: "OFFLINE", location: "", isActive: true };

interface Props {
  initial?: MachineInput;
  submitLabel: string;
  onSubmit: (values: MachineInput) => Promise<void>;
  onCancel: () => void;
}

/** Used for Add Machine (modal on the list) and Edit (on the details page). */
export default function MachineForm({ initial = EMPTY, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MachineInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof MachineInput>(key: K, value: MachineInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Machine name is required";
    if (!form.code.trim()) next.code = "Machine code is required";
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) next.code = "Use letters, numbers, - or _ only";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        status: form.status,
        location: form.location.trim(),
        isActive: form.isActive,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input label="Machine name" placeholder="e.g. CNC Lathe 1" value={form.name}
        onChange={(e) => update("name", e.target.value)} error={errors.name} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Machine code" placeholder="e.g. CNC-01" className="uppercase" value={form.code}
          onChange={(e) => update("code", e.target.value.toUpperCase())} error={errors.code} />
        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as MachineInput["status"])}>
          {MACHINE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>

      <Input label="Location" placeholder="e.g. Shop floor A, Bay 3" value={form.location}
        onChange={(e) => update("location", e.target.value)} />

      <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-blue-600" />
        Active
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:w-auto sm:px-6" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto sm:px-8">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}