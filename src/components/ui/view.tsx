"use client";

import { Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { useProducts } from "@/hooks/useProducts";
import { productService } from "@/services/product.service";
import { PRODUCT_TYPES, productTypeLabel, type Product } from "@/types/product";
import { getErrorMessage } from "@/utils/getErrorMessage";

const typeStyles: Record<Product["type"], string> = {
  RAW_MATERIAL: "bg-amber-500/10 text-amber-300",
  COMPONENT: "bg-sky-500/10 text-sky-300",
  FINISHED_GOOD: "bg-emerald-500/10 text-emerald-300",
};

export default function ProductListPage() {
  const { products, setProducts, loading, error, reload } = useProducts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
        (!typeFilter || p.type === typeFilter) &&
        (!statusFilter || String(p.isActive) === statusFilter),
    );
  }, [products, search, typeFilter, statusFilter]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productService.remove(toDelete._id);
      setProducts((list) => list.filter((p) => p._id !== toDelete._id));
      toast.success(`${toDelete.code} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete product."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-400">
            {loading ? "Loading…" : `${filtered.length} of ${products.length} products`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={reload} aria-label="Refresh"
            className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/products/add"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_200px_160px]">
        <Input label="" aria-label="Search products" icon={Search} placeholder="Search by name or code…"
          value={search} onChange={(e) => setSearch(e.target.value)} className="mt-0" />
        <Select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={reload} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-16 text-center">
            <Package className="h-10 w-10 text-slate-600" />
            <p className="mt-4 text-slate-300">{products.length ? "No products match your filters." : "No products yet."}</p>
            {!products.length && (
              <Link href="/products/add" className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{p.code}</td>
                    <td className="px-5 py-3.5 font-medium">{p.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeStyles[p.type]}`}>
                        {productTypeLabel(p.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{p.unit}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${p.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Link href={`/products/edit?id=${p._id}`} aria-label={`Edit ${p.code}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setToDelete(p)} aria-label={`Delete ${p.code}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete product?"
        message={`“${toDelete?.name}” (${toDelete?.code}) will be permanently removed. This can't be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}