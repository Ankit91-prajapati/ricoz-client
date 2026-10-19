"use client";

import { ChevronRight, Network, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BomForm, { bomToForm, emptyBomForm } from "@/components/bom/BomForm";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusFilterCards from "@/components/ui/StatusFilterCards";
import { useList } from "@/hooks/useList";
import { bomService } from "@/services/bom.service";
import { productService } from "@/services/product.service";
import { BOM_STATES, type Bom, type BomInput } from "@/types/bom";
import { findMeta } from "@/types/common";
import { getErrorMessage } from "@/utils/getErrorMessage";

export default function BomPage() {
  const boms = useList(bomService.list, "Could not load bills of materials.");
  const products = useList(productService.list, "Could not load products.");

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [modal, setModal] = useState<"new" | Bom | null>(null);
  const [toDelete, setToDelete] = useState<Bom | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ready = !boms.loading && !products.loading;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    boms.items.forEach((b) => (map[String(b.isActive)] = (map[String(b.isActive)] ?? 0) + 1));
    return map;
  }, [boms.items]);

  const takenProductIds = useMemo(
    () => boms.items.map((b) => b.product?._id).filter((id): id is string => Boolean(id)),
    [boms.items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return boms.items.filter(
      (b) =>
        (!q ||
          (b.product?.name ?? "").toLowerCase().includes(q) ||
          (b.product?.code ?? "").toLowerCase().includes(q) ||
          b.items.some((i) => (i.product?.name ?? "").toLowerCase().includes(q))) &&
        (!stateFilter || String(b.isActive) === stateFilter),
    );
  }, [boms.items, search, stateFilter]);

  async function handleSave(values: BomInput) {
    const editing = modal !== null && modal !== "new" ? modal : null;
    try {
      if (editing) {
        await bomService.update(editing._id, values);
        toast.success("BOM updated");
      } else {
        await bomService.create(values);
        toast.success("BOM created");
      }
      setModal(null);
      boms.reload(); // reload so product names come back populated
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save BOM."));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await bomService.remove(toDelete._id);
      boms.setItems((list) => list.filter((b) => b._id !== toDelete._id));
      toast.success("BOM deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete BOM."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bill of Materials</h1>
          <p className="mt-1 text-sm text-slate-400">
            {boms.loading ? "Loading…" : `${filtered.length} of ${boms.items.length} BOMs`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={boms.reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${boms.loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setModal("new")} disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> New BOM
          </button>
        </div>
      </div>

      <div className="mt-6">
        <StatusFilterCards options={BOM_STATES} counts={counts} active={stateFilter} onChange={setStateFilter} />
      </div>

      <div className="mt-4">
        <Input label="" aria-label="Search BOMs" icon={Search} placeholder="Search by product or component…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {boms.loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : boms.error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{boms.error}</p>
            <button onClick={boms.reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <Network className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{boms.items.length ? "No BOMs match your filters." : "No bills of materials yet."}</p>
            {!boms.items.length && ready && (
              <button onClick={() => setModal("new")} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Create your first BOM
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-3 py-3 font-medium">Finished product</th>
                  <th className="px-5 py-3 text-right font-medium">Components</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((b) => {
                  const open = expanded === b._id;
                  return (
                    <Fragment key={b._id}>
                      <tr className="hover:bg-slate-800/40">
                        <td className="px-3 py-3.5">
                          <button onClick={() => setExpanded(open ? null : b._id)} aria-label={open ? "Hide components" : "Show components"}
                            aria-expanded={open} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                            <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          {b.product ? (
                            <>
                              <p className="font-medium">{b.product.name}</p>
                              <p className="font-mono text-xs text-slate-500">{b.product.code}</p>
                            </>
                          ) : (
                            <span className="text-slate-500">Deleted product</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">{b.items.length}</td>
                        <td className="px-5 py-3.5"><Badge meta={findMeta(BOM_STATES, String(b.isActive))} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setModal(b)} aria-label="Edit BOM"
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setToDelete(b)} aria-label="Delete BOM"
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-950/50">
                          <td />
                          <td colSpan={4} className="px-3 py-4">
                            <table className="w-full max-w-xl text-sm">
                              <thead className="text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                  <th className="pb-2 text-left font-medium">Component</th>
                                  <th className="pb-2 text-right font-medium">Quantity</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/70">
                                {b.items.map((i, idx) => (
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
                                      {i.quantity.toLocaleString()} <span className="text-xs text-slate-500">{i.unit}</span>
                                    </td>
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

      <Modal open={modal !== null} wide title={modal === "new" ? "New Bill of Materials" : "Edit Bill of Materials"} onClose={() => setModal(null)}>
        {modal !== null && (
          <BomForm
            key={modal === "new" ? "new" : modal._id}
            initial={modal === "new" ? emptyBomForm() : bomToForm(modal)}
            products={products.items}
            takenProductIds={takenProductIds}
            submitLabel={modal === "new" ? "Create BOM" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete bill of materials?"
        message={`The BOM for ${toDelete?.product?.name ?? "this product"} will be permanently removed. This can't be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}