"use client";

import { ClipboardList, FilePlus2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductionPlanForm, { emptyPlanForm, planToForm } from "@/components/production/ProductionPlanForm";
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
import { findMeta } from "@/types/common";
import { PLAN_STATUSES, PRIORITIES, type ProductionPlan, type ProductionPlanInput } from "@/types/production";
import { formatDate, isOverdue, nextNumber } from "@/utils/format";
import { getErrorMessage } from "@/utils/getErrorMessage";

export default function ProductionPlansPage() {
  const { user } = useAuth();
  const plans = useList(productionPlanService.list, "Could not load production plans.");
  const products = useList(productService.list, "Could not load products.");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [modal, setModal] = useState<"new" | ProductionPlan | null>(null);
  const [toDelete, setToDelete] = useState<ProductionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    plans.items.forEach((p) => (map[p.status] = (map[p.status] ?? 0) + 1));
    return map;
  }, [plans.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.items.filter(
      (p) =>
        (!q ||
          p.planNumber.toLowerCase().includes(q) ||
          (p.product?.name ?? "").toLowerCase().includes(q) ||
          (p.product?.code ?? "").toLowerCase().includes(q)) &&
        (!statusFilter || p.status === statusFilter) &&
        (!priorityFilter || p.priority === priorityFilter),
    );
  }, [plans.items, search, statusFilter, priorityFilter]);

  const suggestedNumber = useMemo(() => nextNumber("PP", plans.items.map((p) => p.planNumber)), [plans.items]);
  const ready = !plans.loading && !products.loading;

  async function handleSave(values: ProductionPlanInput) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        await productionPlanService.update(editing._id, values);
        toast.success(`${values.planNumber} updated`);
      } else {
        await productionPlanService.create({ ...values, createdBy: user?._id });
        toast.success(`${values.planNumber} created`);
      }
      setModal(null);
      plans.reload(); // reload so the product name comes back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save production plan."));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productionPlanService.remove(toDelete._id);
      plans.setItems((list) => list.filter((p) => p._id !== toDelete._id));
      toast.success(`${toDelete.planNumber} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete production plan."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Plans</h1>
          <p className="mt-1 text-sm text-slate-400">
            {plans.loading ? "Loading…" : `${filtered.length} of ${plans.items.length} plans`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={plans.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${plans.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={PLAN_STATUSES} counts={counts} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input label="" aria-label="Search plans" icon={Search} placeholder="Search by plan number or product…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {plans.loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : plans.error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{plans.error}</p>
            <button onClick={plans.reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <ClipboardList className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{plans.items.length ? "No plans match your filters." : "No production plans yet."}</p>
            {!plans.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Create your first plan
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-215 text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 text-right font-medium">Qty</th>
                  <th className="px-5 py-3 font-medium">Start</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => {
                  const overdue = isOverdue(p.dueDate, p.status);
                  return (
                    <tr key={p._id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{p.planNumber}</td>
                      <td className="px-5 py-3.5">
                        {p.product ? (
                          <>
                            <p className="font-medium">{p.product.name}</p>
                            <p className="font-mono text-xs text-slate-500">{p.product.code}</p>
                          </>
                        ) : (
                          <span className="text-slate-500">Deleted product</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">{p.plannedQuantity.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-300">{formatDate(p.startDate)}</td>
                      <td className={`px-5 py-3.5 ${overdue ? "font-medium text-red-400" : "text-slate-300"}`}>
                        {formatDate(p.dueDate)}
                        {overdue && <span className="ml-2 text-xs">overdue</span>}
                      </td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(PRIORITIES, p.priority)} /></td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(PLAN_STATUSES, p.status)} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Link href={`/production/work-orders?fromPlan=${p._id}`} aria-label={`Create work order for ${p.planNumber}`}
                            title="Create work order" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <FilePlus2 className="h-4 w-4" />
                          </Link>
                          <button onClick={() => setModal(p)} aria-label={`Edit ${p.planNumber}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setToDelete(p)} aria-label={`Delete ${p.planNumber}`}
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

      <Modal open={modal !== null} wide onClose={() => setModal(null)}
        title={modal === "new" ? "New Production Plan" : "Edit Production Plan"}>
        {modal !== null && (
          <ProductionPlanForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyPlanForm(suggestedNumber) : planToForm(modal)}
            products={products.items}
            submitLabel={modal === "new" ? "Create plan" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete production plan?"
        message={`${toDelete?.planNumber} will be permanently removed. Work orders created from it are kept.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}