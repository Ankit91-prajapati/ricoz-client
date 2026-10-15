"use client";

import { ClipboardList, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import toast from "react-hot-toast";
import WorkOrderForm, {
  emptyWorkOrderForm,
  planToWorkOrderForm,
  workOrderToForm,
} from "@/components/production/WorkOrderForm";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useAuth } from "@/hooks/useAuth";
import { useList } from "@/hooks/useList";
import { productService } from "@/services/product.service";
import { productionPlanService } from "@/services/productionPlan.service";
import { workOrderService } from "@/services/workOrder.service";
import { findMeta } from "@/types/common";
import {
  PRIORITIES,
  WORK_ORDER_STATUSES,
  type WorkOrder,
  type WorkOrderInput,
  type WorkOrderStatus,
} from "@/types/production";
import { formatDate, isOverdue, nextNumber } from "@/utils/format";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** One-click "next step" button per status. Anything else (pause, cancel…) is done from Edit. */
const NEXT_STEP: Partial<Record<WorkOrderStatus, { label: string; to: WorkOrderStatus }>> = {
  CREATED: { label: "Release", to: "RELEASED" },
  RELEASED: { label: "Start", to: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Complete", to: "COMPLETED" },
  PAUSED: { label: "Resume", to: "IN_PROGRESS" },
};

const LOCKED_FOR_DELETE: WorkOrderStatus[] = ["IN_PROGRESS", "COMPLETED"]; // backend refuses these

function WorkOrdersContent() {
  const router = useRouter();
  const fromPlan = useSearchParams().get("fromPlan"); // set by "Create work order" on the plans page
  const { user } = useAuth();

  const orders = useList(workOrderService.list, "Could not load work orders.");
  const plans = useList(productionPlanService.list, "Could not load production plans.");
  const products = useList(productService.list, "Could not load products.");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [adding, setAdding] = useState(Boolean(fromPlan));
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [toDelete, setToDelete] = useState<WorkOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ready = !orders.loading && !plans.loading && !products.loading;

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
          o.workOrderNumber.toLowerCase().includes(q) ||
          (o.product?.name ?? "").toLowerCase().includes(q) ||
          (o.product?.code ?? "").toLowerCase().includes(q) ||
          (o.productionPlan?.planNumber ?? "").toLowerCase().includes(q)) &&
        (!statusFilter || o.status === statusFilter) &&
        (!priorityFilter || o.priority === priorityFilter),
    );
  }, [orders.items, search, statusFilter, priorityFilter]);

  const suggestedNumber = useMemo(
    () => nextNumber("WO", orders.items.map((o) => o.workOrderNumber)),
    [orders.items],
  );

  const addInitial = useMemo(() => {
    const plan = fromPlan ? plans.items.find((p) => p._id === fromPlan) : undefined;
    return plan ? planToWorkOrderForm(plan, suggestedNumber) : emptyWorkOrderForm(suggestedNumber);
  }, [fromPlan, plans.items, suggestedNumber]);

  function closeAdd() {
    setAdding(false);
    if (fromPlan) router.replace("/production/work-orders"); // drop ?fromPlan= from the URL
  }

  async function handleCreate(values: WorkOrderInput) {
    try {
      await workOrderService.create({ ...values, createdBy: user?._id });
      toast.success(`${values.workOrderNumber} created`);
      closeAdd();
      orders.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create work order."));
    }
  }

  async function handleUpdate(values: WorkOrderInput) {
    if (!editing) return;
    try {
      await workOrderService.update(editing._id, values);
      toast.success(`${values.workOrderNumber} updated`);
      setEditing(null);
      orders.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update work order."));
    }
  }

  async function advance(order: WorkOrder, to: WorkOrderStatus) {
    setBusyId(order._id);
    try {
      await workOrderService.update(order._id, { status: to });
      toast.success(`${order.workOrderNumber} → ${findMeta(WORK_ORDER_STATUSES, to).label}`);
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
      await workOrderService.remove(toDelete._id);
      orders.setItems((list) => list.filter((o) => o._id !== toDelete._id));
      toast.success(`${toDelete.workOrderNumber} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete work order."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="mt-1 text-sm text-slate-400">
            {orders.loading ? "Loading…" : `${filtered.length} of ${orders.items.length} work orders`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={orders.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${orders.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setAdding(true)} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New Work Order
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={WORK_ORDER_STATUSES} counts={counts} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input label="" aria-label="Search work orders" icon={Search} placeholder="Search by number, product or plan…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
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
            <ClipboardList className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{orders.items.length ? "No work orders match your filters." : "No work orders yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Work order</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((o) => {
                  const percent = Math.min(100, Math.round((o.producedQuantity / o.plannedQuantity) * 100));
                  const overdue = isOverdue(o.dueDate, o.status);
                  const next = NEXT_STEP[o.status];
                  const locked = LOCKED_FOR_DELETE.includes(o.status);
                  return (
                    <tr key={o._id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs text-slate-300">{o.workOrderNumber}</p>
                        {o.productionPlan && <p className="text-xs text-slate-500">Plan {o.productionPlan.planNumber}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {o.product ? (
                          <>
                            <p className="font-medium">{o.product.name}</p>
                            <p className="font-mono text-xs text-slate-500">{o.product.code}</p>
                          </>
                        ) : (
                          <span className="text-slate-500">Deleted product</span>
                        )}
                      </td>
                      <td className="min-w-45 px-5 py-3.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">
                          {o.producedQuantity.toLocaleString()} / {o.plannedQuantity.toLocaleString()} ({percent}%)
                          {o.rejectedQuantity > 0 && <span className="ml-2 text-red-400">{o.rejectedQuantity} rejected</span>}
                        </p>
                      </td>
                      <td className={`px-5 py-3.5 ${overdue ? "font-medium text-red-400" : "text-slate-300"}`}>
                        {formatDate(o.dueDate)}
                        {overdue && <span className="ml-2 text-xs">overdue</span>}
                      </td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(PRIORITIES, o.priority)} /></td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(WORK_ORDER_STATUSES, o.status)} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <button onClick={() => advance(o, next.to)} disabled={busyId === o._id}
                              className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                              {busyId === o._id && <Spinner className="h-3 w-3" />}
                              {next.label}
                            </button>
                          )}
                          <button onClick={() => setEditing(o)} aria-label={`Edit ${o.workOrderNumber}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setToDelete(o)} disabled={locked} aria-label={`Delete ${o.workOrderNumber}`}
                            title={locked ? "Can't delete after production has started" : "Delete"}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
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

      <Modal open={adding && ready} wide title="New Work Order" onClose={closeAdd}>
        <WorkOrderForm
          initial={addInitial}
          products={products.items}
          plans={plans.items}
          submitLabel="Create work order"
          onSubmit={handleCreate}
          onCancel={closeAdd}
        />
      </Modal>

      <Modal open={Boolean(editing)} wide title="Edit Work Order" onClose={() => setEditing(null)}>
        {editing && (
          <WorkOrderForm
            key={editing._id}
            initial={workOrderToForm(editing)}
            products={products.items}
            plans={plans.items}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete work order?"
        message={`${toDelete?.workOrderNumber} will be permanently removed. This can't be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={null}>
      <WorkOrdersContent />
    </Suspense>
  );
}