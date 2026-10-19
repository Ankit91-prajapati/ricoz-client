import type { OptionMeta, ProductRef } from "./common";

export interface BomItem {
  _id?: string;
  product: ProductRef | null; // null if the component was deleted
  quantity: number;
  unit: string;
}

export interface Bom {
  _id: string;
  product: ProductRef | null; // the finished product; null if it was deleted
  items: BomItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BomItemInput {
  product: string;
  quantity: number;
  unit: string;
}

export interface BomInput {
  product: string;
  items: BomItemInput[];
  isActive: boolean;
}

export const BOM_STATES = [
  { value: "true", label: "Active", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "false", label: "Inactive", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
] as const satisfies readonly OptionMeta[];