import { api } from "./api";

interface DataResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Builds list / get / create / update / remove calls for any of your REST resources. */
export function createCrudService<T, I>(base: string) {
  return {
    list: () => api.get<DataResponse<T[]>>(base).then((r) => r.data.data),
    get: (id: string) => api.get<DataResponse<T>>(`${base}/${id}`).then((r) => r.data.data),
    create: (payload: I) => api.post<DataResponse<T>>(base, payload).then((r) => r.data.data),
    update: (id: string, payload: Partial<I>) =>
      api.patch<DataResponse<T>>(`${base}/${id}`, payload).then((r) => r.data.data),
    remove: (id: string) =>
      api.delete<{ success: boolean; message: string }>(`${base}/${id}`).then((r) => r.data),
  };
}