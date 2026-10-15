import type { OptionMeta, ProductRef } from "./common";

export const PRIORITIES = [
  { value: "LOW", label: "Low", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "NORMAL", label: "Normal", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "HIGH", label: "High", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "URGENT", label: "Urgent", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export const PLAN_STATUSES = [
  { value: "DRAFT", label: "Draft", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "PLANNED", label: "Planned", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "IN_PROGRESS", label: "In progress", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export const WORK_ORDER_STATUSES = [
  { value: "CREATED", label: "Created", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "RELEASED", label: "Released", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "IN_PROGRESS", label: "In progress", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "PAUSED", label: "Paused", badge: "bg-orange-500/10 text-orange-300", dot: "bg-orange-400" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export type Priority = (typeof PRIORITIES)[number]["value"];
export type PlanStatus = (typeof PLAN_STATUSES)[number]["value"];
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number]["value"];

export interface ProductionPlan {
  _id: string;
  planNumber: string;
  product: ProductRef | null; // null if the product was deleted
  plannedQuantity: number;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: PlanStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlanInput {
  planNumber: string;
  product: string;
  plannedQuantity: number;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: PlanStatus;
  createdBy?: string;
}

export interface WorkOrder {
  _id: string;
  workOrderNumber: string;
  productionPlan?: { _id: string; planNumber: string } | null;
  product: ProductRef | null;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  startDate?: string;
  dueDate?: string;
  priority: Priority;
  status: WorkOrderStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderInput {
  workOrderNumber: string;
  productionPlan: string | null;
  product: string;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  startDate: string | null;
  dueDate: string | null;
  priority: Priority;
  status: WorkOrderStatus;
  createdBy?: string;
}