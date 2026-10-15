"use client";

import { PackageOpen, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import InventoryForm, { emptyInventoryForm, inventoryToForm } from "@/components/inventory/InventoryForm";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useList } from "@/hooks/useList";
import { inventoryService } from "@/services/inventory.service";
import { productService } from "@/services/product.service";
import { findMeta } from "@/types/common";
import {
  getAvailable,
  getStockLevel,
  STOCK_LEVELS,
  type InventoryInput,
  type InventoryItem,
} from "@/types/inventory";
import { getErrorMessage } from "@/utils/getErrorMessage";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 3 });

export default function StockPage() {
  const stock = useList(inventoryService.list, "Could not load stock.");
  const products = useList(productService.list, "Could not load products.");

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [modal, setModal] = useState<"new" | InventoryItem | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    stock.items.forEach((i) => {
      const level = getStockLevel(i);
      map[level] = (map[level] ?? 0) + 1;
    });
    return map;
  }, [stock.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stock.items.filter(
      (i) =>
        (!q || (i.product?.name ?? "").toLowerCase().includes(q) || (i.product?.code ?? "").toLowerCase().includes(q)) &&
        (!levelFilter || getStockLevel(i) === levelFilter),
    );
  }, [stock.items, search, levelFilter]);

  // Inventory.product is unique, so only offer active products that don't have a record yet.
  const availableProducts = useMemo(() => {
    const used = new Set(stock.items.map((i) => i.product?._id));
    return products.items.filter((p) => p.isActive && !used.has(p._id));
  }, [products.items, stock.items]);

  const ready = !stock.loading && !products.loading;

  async function handleSave(values: InventoryInput) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        // product can't change on an existing record, so don't send it
        const { quantity, reservedQuantity, reorderLevel } = values;
        await inventoryService.update(editing._id, { quantity, reservedQuantity, reorderLevel });
        toast.success("Stock updated");
      } else {
        await inventoryService.create(values);
        toast.success("Stock record created");
      }
      setModal(null);
      stock.reload(); // reload so the product comes back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save stock."));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await inventoryService.remove(toDelete._id);
      stock.setItems((list) => list.filter((i) => i._id !== toDelete._id));
      toast.success("Stock record deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete stock record."));
    } finally {
      setDeleting(false);
    }
  }

  const productLabel = (i: InventoryItem) => (i.product ? `${i.product.code} — ${i.product.name}` : "Deleted product");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="mt-1 text-sm text-slate-400">
            {stock.loading ? "Loading…" : `${filtered.length} of ${stock.items.length} items`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={stock.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${stock.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> Add Stock
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={STOCK_LEVELS} counts={counts} active={levelFilter} onChange={setLevelFilter} />
      </div>

      <div className="mt-4">
        <Input label="" aria-label="Search stock" icon={Search} placeholder="Search by product name or code…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {stock.loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : stock.error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{stock.error}</p>
            <button onClick={stock.reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <PackageOpen className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{stock.items.length ? "No items match your filters." : "No stock records yet."}</p>
            {!stock.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Add your first stock record
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 text-right font-medium">On hand</th>
                  <th className="px-5 py-3 text-right font-medium">Reserved</th>
                  <th className="px-5 py-3 text-right font-medium">Available</th>
                  <th className="px-5 py-3 text-right font-medium">Reorder at</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((i) => {
                  const available = getAvailable(i);
                  const unit = i.product?.unit ?? "";
                  return (
                    <tr key={i._id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        {i.product ? (
                          <>
                            <p className="font-medium">{i.product.name}</p>
                            <p className="font-mono text-xs text-slate-500">{i.product.code}</p>
                          </>
                        ) : (
                          <span className="text-slate-500">Deleted product</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">{fmt(i.quantity)} <span className="text-xs text-slate-500">{unit}</span></td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-400">{fmt(i.reservedQuantity)}</td>
                      <td className={`px-5 py-3.5 text-right font-medium tabular-nums ${available <= 0 ? "text-red-400" : ""}`}>{fmt(available)}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-400">{fmt(i.reorderLevel)}</td>
                      <td className="px-5 py-3.5"><Badge meta={findMeta(STOCK_LEVELS, getStockLevel(i))} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setModal(i)} aria-label="Edit stock"
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setToDelete(i)} aria-label="Delete stock record"
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

      <Modal open={modal !== null} title={modal === "new" ? "Add Stock" : "Edit Stock"} onClose={() => setModal(null)}>
        {modal !== null && (
          <InventoryForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyInventoryForm : inventoryToForm(modal)}
            products={modal === "new" ? availableProducts : undefined}
            lockedProduct={modal === "new" ? undefined : productLabel(modal)}
            submitLabel={modal === "new" ? "Create record" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete stock record?"
        message={toDelete ? `The stock record for ${productLabel(toDelete)} will be permanently removed.` : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}