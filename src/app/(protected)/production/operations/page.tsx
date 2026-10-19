"use client";

import { CirclePlay, Cog, Pause, Pencil, Plus, RefreshCw, Search, SquareCheckBig } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import OperationForm, { emptyOperationForm, operationToForm } from "@/components/operations/OperationForm";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useAuth } from "@/hooks/useAuth";
import { useList } from "@/hooks/useList";
import { machineService } from "@/services/machine.service";
import { operationService } from "@/services/operationExecution.service";
import { workOrderService } from "@/services/workOrder.service";
import { findMeta, userName } from "@/types/common";
import {
  OPERATION_STATUSES,
  withTimestamps,
  type OperationExecution,
  type OperationInput,
  type OperationStatus,
} from "@/types/operation";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** One-click actions per status. */
const ACTIONS: Partial<Record<OperationStatus, { label: string; to: OperationStatus; icon: typeof Pause }[]>> = {
  NOT_STARTED: [{ label: "Start", to: "RUNNING", icon: CirclePlay }],
  RUNNING: [
    { label: "Pause", to: "PAUSED", icon: Pause },
    { label: "Complete", to: "COMPLETED", icon: SquareCheckBig },
  ],
  PAUSED: [
    { label: "Resume", to: "RUNNING", icon: CirclePlay },
    { label: "Complete", to: "COMPLETED", icon: SquareCheckBig },
  ],
};

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function OperationExecutionPage() {
  const { user } = useAuth();
  const operations = useList(operationService.list, "Could not load operations.");
  const workOrders = useList(workOrderService.list, "Could not load work orders.");
  const machines = useList(machineService.list, "Could not load machines.");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [modal, setModal] = useState<"new" | OperationExecution | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ready = !operations.loading && !workOrders.loading && !machines.loading;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    operations.items.forEach((o) => (map[o.status] = (map[o.status] ?? 0) + 1));
    return map;
  }, [operations.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return operations.items.filter(
      (o) =>
        (!q ||
          o.operationName.toLowerCase().includes(q) ||
          (o.workOrder?.workOrderNumber ?? "").toLowerCase().includes(q) ||
          (o.machine?.name ?? "").toLowerCase().includes(q) ||
          (o.machine?.code ?? "").toLowerCase().includes(q)) &&
        (!statusFilter || o.status === statusFilter) &&
        (!machineFilter || o.machine?._id === machineFilter),
    );
  }, [operations.items, search, statusFilter, machineFilter]);

  async function handleSave(values: Omit<OperationInput, "startedAt" | "completedAt" | "operator">) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        await operationService.update(editing._id, withTimestamps(values, editing));
        toast.success(`${values.operationName} updated`);
      } else {
        await operationService.create({ ...withTimestamps(values), operator: user?._id });
        toast.success(`${values.operationName} created`);
      }
      setModal(null);
      operations.reload(); // reload so work order / machine names come back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save operation."));
    }
  }

  async function changeStatus(op: OperationExecution, to: OperationStatus) {
    setBusyId(op._id);
    try {
      await operationService.update(op._id, withTimestamps({ status: to }, op));
      toast.success(`${op.operationName} → ${findMeta(OPERATION_STATUSES, to).label}`);
      operations.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change status."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operation Execution</h1>
          <p className="mt-1 text-sm text-slate-400">
            {operations.loading ? "Loading…" : `${filtered.length} of ${operations.items.length} operations`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={operations.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${operations.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New Operation
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={OPERATION_STATUSES} counts={counts} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input label="" aria-label="Search operations" icon={Search} placeholder="Search by operation, work order or machine…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filter by machine" value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
          <option value="">All machines</option>
          {machines.items.map((m) => <option key={m._id} value={m._id}>{m.code} — {m.name}</option>)}
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {operations.loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : operations.error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{operations.error}</p>
            <button onClick={operations.reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <Cog className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{operations.items.length ? "No operations match your filters." : "No operations yet."}</p>
            {!operations.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Log your first operation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Operation</th>
                  <th className="px-5 py-3 font-medium">Work order</th>
                  <th className="px-5 py-3 font-medium">Machine</th>
                  <th className="px-5 py-3 font-medium">Operator</th>
                  <th className="w-48 px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Started</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((o) => {
                  const pct = o.plannedQuantity > 0 ? Math.min(100, Math.round((o.goodQuantity / o.plannedQuantity) * 100)) : 0;
                  const actions = ACTIONS[o.status] ?? [];
                  return (
                    <tr key={o._id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-medium">{o.operationName}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                        {o.workOrder?.workOrderNumber ?? <span className="text-slate-500">Deleted</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {o.machine ? (
                          <>
                            {o.machine.name} <span className="font-mono text-xs text-slate-500">{o.machine.code}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{userName(o.operator)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-between text-xs tabular-nums text-slate-400">
                          <span>{o.goodQuantity} / {o.plannedQuantity}</span>
                          {o.rejectedQuantity > 0 && <span className="text-red-400">{o.rejectedQuantity} rejected</span>}
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(OPERATION_STATUSES, o.status)} /></td>
                      <td className="px-5 py-3.5 text-slate-400">{fmtTime(o.startedAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {actions.map(({ label, to, icon: Icon }) => (
                            <button key={to} onClick={() => changeStatus(o, to)} disabled={busyId === o._id}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                              {busyId === o._id ? <Spinner className="h-3 w-3" /> : <Icon className="h-3.5 w-3.5" />}
                              {label}
                            </button>
                          ))}
                          <button onClick={() => setModal(o)} aria-label={`Edit ${o.operationName}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal !== null} wide title={modal === "new" ? "New Operation" : "Edit Operation"} onClose={() => setModal(null)}>
        {modal !== null && (
          <OperationForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyOperationForm : operationToForm(modal)}
            workOrders={workOrders.items}
            machines={machines.items}
            submitLabel={modal === "new" ? "Create operation" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}