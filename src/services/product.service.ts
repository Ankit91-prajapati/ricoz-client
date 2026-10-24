import { api } from "./api";
import type { Product, ProductInput } from "@/types/product";

// Your backend mounts products at /api/v1/products and api.ts already ends with /api
const BASE = "/api/v1/products";

interface DataResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const productService = {
  list: () => api.get<DataResponse<Product[]>>(BASE).then((r) => r.data.data),

  get: (id: string) => api.get<DataResponse<Product>>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (payload: ProductInput) =>
    api.post<DataResponse<Product>>(BASE, payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<ProductInput>) =>
    api.patch<DataResponse<Product>>(`${BASE}/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`${BASE}/${id}`).then((r) => r.data),
};