"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductForm from "@/components/products/ProductForm";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useProducts } from "@/hooks/useProducts";
import { productService } from "@/services/product.service";
import { productTypeLabel, type Product, type ProductInput } from "@/types/product";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** /products/edit  -> pick a product.   /products/edit?id=<id> -> edit it. */
function ProductPicker() {
  const { products, loading, error } = useProducts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
      <p className="mb-6 mt-1 text-sm text-slate-400">Choose the product you want to edit.</p>

      <Input label="" aria-label="Search products" icon={Search} placeholder="Search by name or code…"
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="mt-4 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex justify-center p-12"><Spinner /></div>
        ) : error ? (
          <p className="p-8 text-center text-red-400">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-400">No products found.</p>
        ) : (
          filtered.map((p) => (
            <Link key={p._id} href={`/products/edit?id=${p._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="font-mono text-xs text-slate-400">{p.code}</p>
              </div>
              <span className="text-xs text-slate-400">{productTypeLabel(p.type)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function EditProduct({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    productService
      .get(id)
      .then((data) => active && setProduct(data))
      .catch((err) => active && setError(getErrorMessage(err, "Could not load product.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleUpdate(values: ProductInput) {
    try {
      const updated = await productService.update(id, values);
      toast.success(`${updated.code} updated`);
      router.push("/products");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update product."));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Edit Product</h1>

      {loading ? (
        <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
      ) : error || !product ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          {error ?? "Product not found."}{" "}
          <Link href="/products/edit" className="font-medium underline">Choose another product</Link>
        </div>
      ) : (
        <ProductForm
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          initial={{
            name: product.name,
            code: product.code,
            type: product.type,
            unit: product.unit,
            isActive: product.isActive,
          }}
        />
      )}
    </div>
  );
}

function EditRouter() {
  const id = useSearchParams().get("id");
  return id ? <EditProduct key={id} id={id} /> : <ProductPicker />;
}

export default function EditProductPage() {
  return (
    <Suspense fallback={null}>
      <EditRouter />
    </Suspense>
  );
}