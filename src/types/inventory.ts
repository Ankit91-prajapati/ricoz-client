import type { OptionMeta, ProductRef } from "./common";

export interface InventoryItem {
  _id: string;
  product: ProductRef | null; // null if the product was deleted
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryInput {
  product: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export const STOCK_LEVELS = [
  { value: "OK", label: "In stock", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "LOW", label: "Low stock", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "OUT", label: "Out of stock", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export type StockLevel = (typeof STOCK_LEVELS)[number]["value"];

export const getAvailable = (i: InventoryItem) => i.quantity - i.reservedQuantity;

export function getStockLevel(i: InventoryItem): StockLevel {
  const available = getAvailable(i);
  if (available <= 0) return "OUT";
  if (i.reorderLevel > 0 && available <= i.reorderLevel) return "LOW";
  return "OK";
}