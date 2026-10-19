"use client";

import { Pencil, Plus, RefreshCw, Search, Trash2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import MaintenanceForm, {
  emptyMaintenanceForm,
  maintenanceToForm,
  type AssigneeOption,
} from "@/components/maintenance/MaintenanceForm";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useAuth } from "@/hooks/useAuth";
import { useList } from "@/hooks/useList";
import { machineService } from "@/services/machine.service";
import { maintenanceService } from "@/services/maintenance.service";
import { findMeta, userName } from "@/types/common";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  withCompletedAt,
  type MaintenanceInput,
  type MaintenanceStatus,
  type MaintenanceWorkOrder,
} from "@/types/maintenance";
import { formatDate, isOverdue, nextNumber } from "@/utils/format";
import { getErrorMessage } from "@/utils/getErrorMessage";

const NEXT_STEP: Partial<Record<MaintenanceStatus, { label: string; to: MaintenanceStatus }>> = {
  OPEN: { label: "Start work", to: "IN_PROGRESS" },
  ASSIGNED: { label: "Start work", to: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Complete", to: "COMPLETED" },
};

export default function MaintenanceWorkOrdersPage() {
  const { user } = useAuth();
  const orders = useList(maintenanceService.list, "Could not load maintenance work orders.");
  const machines = useList(machineService.list, "Could not load machines.");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState<"new" | MaintenanceWorkOrder | null>(null);
  const [toDelete, setToDelete] = useState<MaintenanceWorkOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ready = !orders.loading && !machines.loading;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    orders.items.forEach((o) => (map[o.status] = (map[o.status] ?? 0) + 1));
    return map;
  }, [orders.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.items.filter(
      (o) =>
        (!q ||
          o.maintenanceNumber.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          (o.machine?.name ?? "").toLowerCase().includes(q) ||
          (o.machine?.code ?? "").toLowerCase().includes(q)) &&
        (!statusFilter || o.status === statusFilter) &&
        (!priorityFilter || o.priority === priorityFilter) &&
        (!typeFilter || o.type === typeFilter),
    );
  }, [orders.items, search, statusFilter, priorityFilter, typeFilter]);

  const suggestedNumber = useMemo(
    () => nextNumber("MW", orders.items.map((o) => o.maintenanceNumber)),
    [orders.items],
  );

  // There is no users API: offer "me", plus whoever is already assigned on the order being edited.
  const assignees = useMemo<AssigneeOption[]>(() => {
    const list: AssigneeOption[] = [];
    if (user) list.push({ id: user._id, label: `Me (${user.username || user.email})` });
    if (modal !== null && modal !== "new" && modal.assignedTo && modal.assignedTo._id !== user?._id) {
      list.push({ id: modal.assignedTo._id, label: userName(modal.assignedTo) });
    }
    return list;
  }, [user, modal]);

  async function handleSave(values: Omit<MaintenanceInput, "completedAt">) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        await maintenanceService.update(editing._id, withCompletedAt(values, editing.completedAt));
        toast.success(`${values.maintenanceNumber} updated`);
      } else {
        await maintenanceService.create(withCompletedAt(values));
        toast.success(`${values.maintenanceNumber} created`);
      }
      setModal(null);
      orders.reload(); // reload so machine and assignee names come back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save maintenance work order."));
    }
  }

  async function advance(order: MaintenanceWorkOrder, to: MaintenanceStatus) {
    setBusyId(order._id);
    try {
      await maintenanceService.update(order._id, withCompletedAt({ status: to }, order.completedAt));
      toast.success(`${order.maintenanceNumber} → ${findMeta(MAINTENANCE_STATUSES, to).label}`);
      orders.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change status."));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await maintenanceService.remove(toDelete._id);
      orders.setItems((list) => list.filter((o) => o._id !== toDelete._id));
      toast.success(`${toDelete.maintenanceNumber} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete maintenance work order."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Work Orders</h1>
          <p className="mt-1 text-sm text-slate-400">
            {orders.loading ? "Loading…" : `${filtered.length} of ${orders.items.length} work orders`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={orders.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${orders.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New Work Order
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={MAINTENANCE_STATUSES} counts={counts} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px_170px]">
        <Input label="" aria-label="Search maintenance" icon={Search} placeholder="Search by number, title or machine…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {MAINTENANCE_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
        <Select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {orders.loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : orders.error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{orders.error}</p>
            <button onClick={orders.reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <Wrench className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{orders.items.length ? "No work orders match your filters." : "No maintenance work orders yet."}</p>
            {!orders.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Create your first work order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Number</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Machine</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Assigned</th>
                  <th className="px-5 py-3 font-medium">Scheduled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((o) => {
                  const next = NEXT_STEP[o.status];
                  const overdue = isOverdue(o.scheduledDate, o.status);
                  return (
                    <tr key={o._id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{o.maintenanceNumber}</td>
                      <td className="max-w-[220px] px-5 py-3.5">
                        <p className="truncate font-medium" title={o.title}>{o.title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {o.machine ? (
                          <>
                            {o.machine.name} <span className="font-mono text-xs text-slate-500">{o.machine.code}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">Deleted machine</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(MAINTENANCE_TYPES, o.type)} /></td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(MAINTENANCE_PRIORITIES, o.priority)} /></td>
                      <td className="px-5 py-3.5 text-slate-300">{o.assignedTo ? userName(o.assignedTo) : <span className="text-slate-500">Unassigned</span>}</td>
                      <td className={`px-5 py-3.5 ${overdue ? "font-medium text-red-400" : "text-slate-300"}`}>
                        {formatDate(o.scheduledDate)}
                        {overdue && <span className="ml-2 text-xs">overdue</span>}
                      </td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(MAINTENANCE_STATUSES, o.status)} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <button onClick={() => advance(o, next.to)} disabled={busyId === o._id}
                              className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                              {busyId === o._id && <Spinner className="h-3 w-3" />}
                              {next.label}
                            </button>
                          )}
                          <button onClick={() => setModal(o)} aria-label={`Edit ${o.maintenanceNumber}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setToDelete(o)} aria-label={`Delete ${o.maintenanceNumber}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
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

      <Modal open={modal !== null} wide title={modal === "new" ? "New Maintenance Work Order" : "Edit Maintenance Work Order"} onClose={() => setModal(null)}>
        {modal !== null && (
          <MaintenanceForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyMaintenanceForm(suggestedNumber) : maintenanceToForm(modal)}
            machines={machines.items}
            assignees={assignees}
            submitLabel={modal === "new" ? "Create work order" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete maintenance work order?"
        message={`${toDelete?.maintenanceNumber} will be permanently removed. This can't be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}