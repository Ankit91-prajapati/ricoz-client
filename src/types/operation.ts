import type { OptionMeta, UserRef } from "./common";

export const OPERATION_STATUSES = [
  { value: "NOT_STARTED", label: "Not started", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "RUNNING", label: "Running", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "PAUSED", label: "Paused", badge: "bg-orange-500/10 text-orange-300", dot: "bg-orange-400" },
  { value: "COMPLETED", label: "Completed", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
] as const satisfies readonly OptionMeta[];

export type OperationStatus = (typeof OPERATION_STATUSES)[number]["value"];

export interface OperationExecution {
  _id: string;
  workOrder: { _id: string; workOrderNumber: string } | null; // null if the work order was deleted
  machine?: { _id: string; name: string; code: string; status?: string } | null;
  operator?: UserRef | null;
  operationName: string;
  status: OperationStatus;
  plannedQuantity: number;
  goodQuantity: number;
  rejectedQuantity: number;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationInput {
  workOrder: string;
  machine: string | null;
  operator?: string;
  operationName: string;
  status: OperationStatus;
  plannedQuantity: number;
  goodQuantity: number;
  rejectedQuantity: number;
  notes: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

/**
 * Stamps the timestamps that follow the status (the API doesn't):
 * startedAt on the first start, completedAt when completed, cleared again if it is reopened.
 * Call this from an event handler: it reads the clock.
 */
export function withTimestamps<T extends { status: OperationStatus }>(
  values: T,
  existing?: { startedAt?: string | null; completedAt?: string | null },
) {
  const now = new Date().toISOString();
  const started = values.status !== "NOT_STARTED";
  return {
    ...values,
    startedAt: started ? (existing?.startedAt ?? now) : null,
    completedAt: values.status === "COMPLETED" ? (existing?.completedAt ?? now) : null,
  };
}