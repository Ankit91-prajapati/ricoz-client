import type { OptionMeta, ProductRef } from "./common";

export const QUALITY_TYPES = [
  { value: "INSPECTION", label: "Inspection", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "NON_CONFORMANCE", label: "Non-conformance", badge: "bg-orange-500/10 text-orange-300", dot: "bg-orange-400" },
] as const satisfies readonly OptionMeta[];

export const SEVERITIES = [
  { value: "LOW", label: "Low", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
  { value: "MEDIUM", label: "Medium", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "HIGH", label: "High", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "CRITICAL", label: "Critical", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
] as const satisfies readonly OptionMeta[];

export const ISSUE_STATUSES = [
  { value: "OPEN", label: "Open", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "UNDER_REVIEW", label: "Under review", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "PASSED", label: "Passed", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "FAILED", label: "Failed", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
  { value: "CLOSED", label: "Closed", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-400" },
] as const satisfies readonly OptionMeta[];

export type QualityType = (typeof QUALITY_TYPES)[number]["value"];
export type Severity = (typeof SEVERITIES)[number]["value"];
export type IssueStatus = (typeof ISSUE_STATUSES)[number]["value"];

export interface QualityIssue {
  _id: string;
  issueNumber: string;
  workOrder: { _id: string; workOrderNumber: string } | null; // null if the work order was deleted
  product?: ProductRef | null;
  type: QualityType;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType?: string;
  description?: string;
  severity: Severity;
  status: IssueStatus;
  // The API populates this from the User model; show whichever name field comes back
  inspector?: { _id: string; username?: string; name?: string; email?: string } | null;
  correctiveAction?: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityIssueInput {
  issueNumber: string;
  workOrder: string;
  product: string | null;
  type: QualityType;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType: string;
  description: string;
  severity: Severity;
  status: IssueStatus;
  correctiveAction: string;
  inspector?: string;
  closedAt?: string | null;
}

/** closedAt follows the status: stamped when an issue is closed, cleared if it is reopened. */
export function withClosedAt<T extends { status: IssueStatus }>(values: T, existing?: string | null) {
  return {
    ...values,
    closedAt: values.status === "CLOSED" ? (existing ?? new Date().toISOString()) : null,
  };
}

export const inspectorName = (i: QualityIssue["inspector"]) => i?.username ?? i?.name ?? i?.email ?? "—";