"use client";

import { ChevronRight, Pencil, Plus, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PurchaseOrderForm, {
  emptyPurchaseOrderForm,
  purchaseOrderToForm,
} from "@/components/purchase/PurchaseOrderForm";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useAuth } from "@/hooks/useAuth";
import { useList } from "@/hooks/useList";
import { productService } from "@/services/product.service";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { supplierService } from "@/services/supplier.service";
import { findMeta } from "@/types/common";
import {
  orderTotal,
  PO_STATUSES,
  type PurchaseOrder,
  type PurchaseOrderInput,
  type PurchaseOrderStatus,
} from "@/types/purchase";
import { formatDate, formatMoney, isOverdue, nextNumber } from "@/utils/format";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** One-click "next step" per status. Partial receipts and cancelling are done from Edit. */
const NEXT_STEP: Partial<Record<PurchaseOrderStatus, { label: string; to: PurchaseOrderStatus }>> = {
  DRAFT: { label: "Place order", to: "ORDERED" },
  ORDERED: { label: "Mark received", to: "RECEIVED" },
  PARTIAL: { label: "Mark received", to: "RECEIVED" },
};

const LOCKED_FOR_DELETE: PurchaseOrderStatus[] = ["RECEIVED", "PARTIAL"]; // backend refuses these

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const orders = useList(purchaseOrderService.list, "Could not load purchase orders.");
  const suppliers = useList(supplierService.list, "Could not load suppliers.");
  const products = useList(productService.list, "Could not load products.");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"new" | PurchaseOrder | null>(null);
  const [toDelete, setToDelete] = useState<PurchaseOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ready = !orders.loading && !suppliers.loading && !products.loading;

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
          o.poNumber.toLowerCase().includes(q) ||
          (o.supplier?.name ?? "").toLowerCase().includes(q) ||
          (o.supplier?.code ?? "").toLowerCase().includes(q) ||
          o.items.some((i) => (i.product?.name ?? "").toLowerCase().includes(q))) &&
        (!statusFilter || o.status === statusFilter),
    );
  }, [orders.items, search, statusFilter]);

  const suggestedNumber = useMemo(() => nextNumber("PO", orders.items.map((o) => o.poNumber)), [orders.items]);

  async function handleSave(values: PurchaseOrderInput) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        await purchaseOrderService.update(editing._id, values);
        toast.success(`${values.poNumber} updated`);
      } else {
        await purchaseOrderService.create({ ...values, createdBy: user?._id });
        toast.success(`${values.poNumber} created`);
      }
      setModal(null);
      orders.reload(); // reload so supplier and product names come back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save purchase order."));
    }
  }

  async function advance(order: PurchaseOrder, to: PurchaseOrderStatus) {
    setBusyId(order._id);
    try {
      await purchaseOrderService.update(order._id, { status: to });
      toast.success(`${order.poNumber} → ${findMeta(PO_STATUSES, to).label}`);
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
      await purchaseOrderService.remove(toDelete._id);
      orders.setItems((list) => list.filter((o) => o._id !== toDelete._id));
      toast.success(`${toDelete.poNumber} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete purchase order."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="mt-1 text-sm text-slate-400">
            {orders.loading ? "Loading…" : `${filtered.length} of ${orders.items.length} orders`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={orders.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${orders.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New Purchase Order
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={PO_STATUSES} counts={counts} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4">
        <Input label="" aria-label="Search purchase orders" icon={Search} placeholder="Search by PO number, supplier or product…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <ShoppingCart className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{orders.items.length ? "No purchase orders match your filters." : "No purchase orders yet."}</p>
            {!orders.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Create your first purchase order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-3 py-3 font-medium">PO</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 text-right font-medium">Items</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Ordered</th>
                  <th className="px-5 py-3 font-medium">Expected</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((o) => {
                  const open = expanded === o._id;
                  const overdue = isOverdue(o.expectedDate, o.status);
                  const next = NEXT_STEP[o.status];
                  const locked = LOCKED_FOR_DELETE.includes(o.status);
                  return (
                    <Fragment key={o._id}>
                      <tr className="hover:bg-slate-800/40">
                        <td className="px-3 py-3.5">
                          <button onClick={() => setExpanded(open ? null : o._id)} aria-label={open ? "Hide items" : "Show items"}
                            aria-expanded={open} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                          </button>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-slate-300">{o.poNumber}</td>
                        <td className="px-5 py-3.5">
                          {o.supplier ? (
                            <>
                              <p className="font-medium">{o.supplier.name}</p>
                              <p className="font-mono text-xs text-slate-500">{o.supplier.code}</p>
                            </>
                          ) : (
                            <span className="text-slate-500">Deleted supplier</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">{o.items.length}</td>
                        <td className="px-5 py-3.5 text-right font-medium tabular-nums">{formatMoney(orderTotal(o.items))}</td>
                        <td className="px-5 py-3.5 text-slate-300">{formatDate(o.orderDate)}</td>
                        <td className={`px-5 py-3.5 ${overdue ? "font-medium text-red-400" : "text-slate-300"}`}>
                          {formatDate(o.expectedDate)}
                          {overdue && <span className="ml-2 text-xs">overdue</span>}
                        </td>
                        <td className="px-5 py-3.5"><Badge meta={findMeta(PO_STATUSES, o.status)} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {next && (
                              <button onClick={() => advance(o, next.to)} disabled={busyId === o._id}
                                className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                                {busyId === o._id && <Spinner className="h-3 w-3" />}
                                {next.label}
                              </button>
                            )}
                            <button onClick={() => setModal(o)} aria-label={`Edit ${o.poNumber}`}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setToDelete(o)} disabled={locked} aria-label={`Delete ${o.poNumber}`}
                              title={locked ? "Received orders can't be deleted" : "Delete"}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-950/50">
                          <td />
                          <td colSpan={8} className="px-3 py-4">
                            <table className="w-full max-w-2xl text-sm">
                              <thead className="text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                  <th className="pb-2 text-left font-medium">Product</th>
                                  <th className="pb-2 text-right font-medium">Qty</th>
                                  <th className="pb-2 text-right font-medium">Unit price</th>
                                  <th className="pb-2 text-right font-medium">Line total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/70">
                                {o.items.map((i, idx) => (
                                  <tr key={i._id ?? idx}>
                                    <td className="py-2">
                                      {i.product ? (
                                        <>
                                          {i.product.name} <span className="font-mono text-xs text-slate-500">{i.product.code}</span>
                                        </>
                                      ) : (
                                        <span className="text-slate-500">Deleted product</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {i.quantity.toLocaleString()} <span className="text-xs text-slate-500">{i.product?.unit}</span>
                                    </td>
                                    <td className="py-2 text-right tabular-nums">{formatMoney(i.unitPrice)}</td>
                                    <td className="py-2 text-right tabular-nums">{formatMoney(i.quantity * i.unitPrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal !== null} wide title={modal === "new" ? "New Purchase Order" : "Edit Purchase Order"} onClose={() => setModal(null)}>
        {modal !== null && (
          <PurchaseOrderForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyPurchaseOrderForm(suggestedNumber) : purchaseOrderToForm(modal)}
            suppliers={suppliers.items}
            products={products.items}
            submitLabel={modal === "new" ? "Create order" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete purchase order?"
        message={`${toDelete?.poNumber} will be permanently removed. This can't be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}