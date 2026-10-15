import type { OptionMeta, ProductRef } from "./common";
import type { SupplierRef } from "./supplier";

export const PO_STATUSES = [
  { value: "DRAFT", label: "Draft", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "ORDERED", label: "Ordered", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "PARTIAL", label: "Partially received", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "RECEIVED", label: "Received", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export type PurchaseOrderStatus = (typeof PO_STATUSES)[number]["value"];

export interface PurchaseOrderItem {
  _id?: string;
  product: ProductRef | null; // null if the product was deleted
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: SupplierRef | null; // null if the supplier was deleted
  items: PurchaseOrderItem[];
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemInput {
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderInput {
  poNumber: string;
  supplier: string;
  items: PurchaseOrderItemInput[];
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  createdBy?: string;
}

export const orderTotal = (items: { quantity: number; unitPrice: number }[]) =>
  items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);