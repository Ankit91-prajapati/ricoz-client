import type { OptionMeta } from "./common";

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInput {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

/** Shape after .populate("supplier", "name code email phone") */
export interface SupplierRef {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export const SUPPLIER_STATES = [
  { value: "true", label: "Active", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "false", label: "Inactive", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
] as const satisfies readonly OptionMeta[];