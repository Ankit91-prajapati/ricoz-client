export const MACHINE_STATUSES = [
  { value: "RUNNING", label: "Running", badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  { value: "IDLE", label: "Idle", badge: "bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  { value: "STOPPED", label: "Stopped", badge: "bg-orange-500/10 text-orange-300", dot: "bg-orange-400" },
  { value: "MAINTENANCE", label: "Maintenance", badge: "bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { value: "BREAKDOWN", label: "Breakdown", badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
  { value: "OFFLINE", label: "Offline", badge: "bg-slate-500/10 text-slate-300", dot: "bg-slate-500" },
] as const;

export type MachineStatus = (typeof MACHINE_STATUSES)[number]["value"];

export const getStatusMeta = (status: MachineStatus) =>
  MACHINE_STATUSES.find((s) => s.value === status) ?? MACHINE_STATUSES[MACHINE_STATUSES.length - 1];

export interface Machine {
  _id: string;
  name: string;
  code: string;
  status: MachineStatus;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the create / edit form sends to the API. */
export interface MachineInput {
  name: string;
  code: string;
  status: MachineStatus;
  location: string;
  isActive: boolean;
}