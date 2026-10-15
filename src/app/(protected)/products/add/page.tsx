"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProductForm from "@/components/products/ProductForm";
import { productService } from "@/services/product.service";
import type { ProductInput } from "@/types/product";
import { getErrorMessage } from "@/utils/getErrorMessage";


export default function AddProductPage() {
  const router = useRouter();

  async function handleCreate(values: ProductInput) {
    try {
      const product = await productService.create(values);
      toast.success(`${product.code} created`);
      router.push("/products");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create product."));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Add Product</h1>
      <ProductForm submitLabel="Create product" onSubmit={handleCreate} />
    </div>
  );
}