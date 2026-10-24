import { api } from "./api";
import type { Machine, MachineInput } from "@/types/machine";

const BASE = "/api/v1/machines";

interface DataResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const machineService = {
  list: () => api.get<DataResponse<Machine[]>>(BASE).then((r) => r.data.data),

  get: (id: string) => api.get<DataResponse<Machine>>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (payload: MachineInput) =>
    api.post<DataResponse<Machine>>(BASE, payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<MachineInput>) =>
    api.patch<DataResponse<Machine>>(`${BASE}/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`${BASE}/${id}`).then((r) => r.data),
};