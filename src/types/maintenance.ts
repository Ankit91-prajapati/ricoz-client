import type { OptionMeta, UserRef } from "./common";

export const MAINTENANCE_TYPES = [
  { value: "PREVENTIVE", label: "Preventive", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "CORRECTIVE", label: "Corrective", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "BREAKDOWN", label: "Breakdown", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export const MAINTENANCE_PRIORITIES = [
  { value: "LOW", label: "Low", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "MEDIUM", label: "Medium", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "HIGH", label: "High", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "CRITICAL", label: "Critical", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export const MAINTENANCE_STATUSES = [
  { value: "OPEN", label: "Open", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "ASSIGNED", label: "Assigned", badge: "bg-violet-500/10 text-violet-300", dot: "bg-violet-400" },
  { value: "IN_PROGRESS", label: "In progress", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
] as const satisfies readonly OptionMeta[];

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]["value"];
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number]["value"];
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]["value"];

export interface MaintenanceWorkOrder {
  _id: string;
  maintenanceNumber: string;
  machine: { _id: string; name: string; code: string; status?: string } | null; // null if the machine was deleted
  type: MaintenanceType;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: UserRef | null;
  scheduledDate?: string | null;
  completedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceInput {
  maintenanceNumber: string;
  machine: string;
  type: MaintenanceType;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string | null;
  scheduledDate: string | null;
  notes: string;
  completedAt?: string | null;
}

/** completedAt follows the status: stamped on completion, cleared if the order is reopened. Call from a handler. */
export function withCompletedAt<T extends { status: MaintenanceStatus }>(values: T, existing?: string | null) {
  return {
    ...values,
    completedAt: values.status === "COMPLETED" ? (existing ?? new Date().toISOString()) : null,
  };
}