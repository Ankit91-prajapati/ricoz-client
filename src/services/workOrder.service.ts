import type { WorkOrder, WorkOrderInput } from "@/types/production";
import { createCrudService } from "./crud";

export const workOrderService = createCrudService<WorkOrder, WorkOrderInput>("/api/v1/work-orders");