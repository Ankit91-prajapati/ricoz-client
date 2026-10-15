"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  orderTotal,
  PO_STATUSES,
  type PurchaseOrder,
  type PurchaseOrderInput,
  type PurchaseOrderStatus,
} from "@/types/purchase";
import type { Product } from "@/types/product";
import type { Supplier } from "@/types/supplier";
import { formatMoney, toDateInput, todayInput } from "@/utils/format";

interface ItemValues {
  key: string; // only used as the React key
  product: string;
  quantity: string;
  unitPrice: string;
}

export interface PurchaseOrderFormValues {
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  items: ItemValues[];
}

type Errors = Partial<Record<"poNumber" | "supplier" | "orderDate" | "expectedDate" | "items", string>>;
type ItemErrors = Record<string, Partial<Record<"product" | "quantity" | "unitPrice", string>>>;

let counter = 0;
const newKey = () => `item-${++counter}`;
const emptyItem = (): ItemValues => ({ key: newKey(), product: "", quantity: "1", unitPrice: "" });

export const emptyPurchaseOrderForm = (poNumber: string): PurchaseOrderFormValues => ({
  poNumber,
  supplier: "",
  orderDate: todayInput(),
  expectedDate: "",
  status: "DRAFT",
  items: [emptyItem()],
});

export const purchaseOrderToForm = (po: PurchaseOrder): PurchaseOrderFormValues => ({
  poNumber: po.poNumber,
  supplier: po.supplier?._id ?? "",
  orderDate: toDateInput(po.orderDate),
  expectedDate: toDateInput(po.expectedDate),
  status: po.status,
  items: po.items.map((i) => ({
    key: newKey(),
    product: i.product?._id ?? "",
    quantity: String(i.quantity),
    unitPrice: String(i.unitPrice),
  })),
});

interface Props {
  initial: PurchaseOrderFormValues;
  suppliers: Supplier[];
  products: Product[];
  submitLabel: string;
  onSubmit: (values: PurchaseOrderInput) => Promise<void>;
  onCancel: () => void;
}

export default function PurchaseOrderForm({ initial, suppliers, products, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PurchaseOrderFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof PurchaseOrderFormValues>(key: K, value: PurchaseOrderFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (key: string, field: keyof Omit<ItemValues, "key">, value: string) =>
    setForm((f) => ({ ...f, items: f.items.map((i) => (i.key === key ? { ...i, [field]: value } : i)) }));

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (key: string) => setForm((f) => ({ ...f, items: f.items.filter((i) => i.key !== key) }));

  // active suppliers, plus the order's current supplier even if it has since been deactivated
  const supplierOptions = suppliers.filter((s) => s.isActive || s._id === form.supplier);

  const total = orderTotal(
    form.items.map((i) => ({ quantity: Number(i.quantity) || 0, unitPrice: Number(i.unitPrice) || 0 })),
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const nextItems: ItemErrors = {};

    if (!form.poNumber.trim()) next.poNumber = "PO number is required";
    if (!form.supplier) next.supplier = "Select a supplier";
    if (!form.orderDate) next.orderDate = "Order date is required";
    if (form.expectedDate && form.orderDate && form.expectedDate < form.orderDate) {
      next.expectedDate = "Can't be before the order date";
    }
    if (form.items.length === 0) next.items = "Add at least one item";

    form.items.forEach((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const e: ItemErrors[string] = {};
      if (!item.product) e.product = "Select a product";
      if (!item.quantity || !Number.isInteger(qty) || qty < 1) e.quantity = "Whole number, 1+";
      if (item.unitPrice === "" || !Number.isFinite(price) || price < 0) e.unitPrice = "0 or more";
      if (Object.keys(e).length) nextItems[item.key] = e;
    });

    setErrors(next);
    setItemErrors(nextItems);
    if (Object.keys(next).length || Object.keys(nextItems).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        poNumber: form.poNumber.trim().toUpperCase(),
        supplier: form.supplier,
        orderDate: form.orderDate,
        expectedDate: form.expectedDate || null,
        status: form.status,
        items: form.items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="PO number" className="uppercase" value={form.poNumber}
          onChange={(e) => update("poNumber", e.target.value)} error={errors.poNumber} />
        <Select label="Supplier" value={form.supplier} onChange={(e) => update("supplier", e.target.value)} error={errors.supplier}>
          <option value="" disabled>Select supplier…</option>
          {supplierOptions.map((s) => (
            <option key={s._id} value={s._id}>{s.code} — {s.name}{s.isActive ? "" : " (inactive)"}</option>
          ))}
        </Select>

        <Input label="Order date" type="date" value={form.orderDate}
          onChange={(e) => update("orderDate", e.target.value)} error={errors.orderDate} />
        <Input label="Expected delivery" type="date" value={form.expectedDate} min={form.orderDate || undefined}
          onChange={(e) => update("expectedDate", e.target.value)} error={errors.expectedDate} />

        <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value as PurchaseOrderStatus)}>
          {PO_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Items</h3>
          <button type="button" onClick={addItem}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>

        <div className="hidden gap-3 px-1 pb-1 text-xs uppercase tracking-wider text-slate-500 sm:grid sm:grid-cols-[1fr_90px_110px_100px_36px]">
          <span>Product</span><span>Qty</span><span>Unit price</span><span className="text-right">Line total</span><span />
        </div>

        <div className="space-y-3">
          {form.items.map((item) => {
            const err = itemErrors[item.key] ?? {};
            const line = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div key={item.key}
                className="grid items-start gap-3 rounded-lg border border-slate-800 p-3 sm:grid-cols-[1fr_90px_110px_100px_36px] sm:border-0 sm:p-0">
                <Select aria-label="Product" value={item.product} error={err.product}
                  onChange={(e) => updateItem(item.key, "product", e.target.value)}>
                  <option value="" disabled>Select product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.code} — {p.name}{p.isActive ? "" : " (inactive)"}</option>
                  ))}
                </Select>
                <Input label="" aria-label="Quantity" type="number" min={1} step={1} placeholder="Qty" value={item.quantity}
                  onChange={(e) => updateItem(item.key, "quantity", e.target.value)} error={err.quantity} />
                <Input label="" aria-label="Unit price" type="number" min={0} step="any" placeholder="0.00" value={item.unitPrice}
                  onChange={(e) => updateItem(item.key, "unitPrice", e.target.value)} error={err.unitPrice} />
                <p className="flex h-11 items-center justify-end text-sm tabular-nums text-slate-300">{formatMoney(line)}</p>
                <button type="button" onClick={() => removeItem(item.key)} disabled={form.items.length === 1}
                  aria-label="Remove item"
                  className="flex h-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        {errors.items && <p className="mt-2 text-xs text-red-400">{errors.items}</p>}

        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-sm text-slate-400">Order total</span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(total)}</span>
        </div>
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