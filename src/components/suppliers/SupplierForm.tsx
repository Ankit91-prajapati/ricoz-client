"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type { Supplier, SupplierInput } from "@/types/supplier";
import { isEmail } from "@/utils/validators";

type Errors = Partial<Record<"name" | "code" | "email", string>>;

export const emptySupplierForm: SupplierInput = { name: "", code: "", email: "", phone: "", address: "", isActive: true };

export const supplierToForm = (s: Supplier): SupplierInput => ({
  name: s.name,
  code: s.code,
  email: s.email ?? "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  isActive: s.isActive,
});

interface Props {
  initial: SupplierInput;
  submitLabel: string;
  onSubmit: (values: SupplierInput) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SupplierInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Supplier name is required";
    if (!form.code.trim()) next.code = "Supplier code is required";
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) next.code = "Use letters, numbers, - or _ only";
    if (form.email.trim() && !isEmail(form.email)) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        isActive: form.isActive,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Supplier name" placeholder="e.g. Acme Steel Pvt Ltd" value={form.name}
          onChange={(e) => update("name", e.target.value)} error={errors.name} />
        <Input label="Supplier code" placeholder="e.g. SUP-001" className="uppercase" value={form.code}
          onChange={(e) => update("code", e.target.value.toUpperCase())} error={errors.code} />
        <Input label="Email" type="email" placeholder="orders@supplier.com" value={form.email}
          onChange={(e) => update("email", e.target.value)} error={errors.email} />
        <Input label="Phone" type="tel" placeholder="+91 …" value={form.phone}
          onChange={(e) => update("phone", e.target.value)} />
      </div>

      <Textarea label="Address" placeholder="Street, city, state, PIN" value={form.address}
        onChange={(e) => update("address", e.target.value)} />

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