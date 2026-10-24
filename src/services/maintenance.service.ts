import type { MaintenanceInput, MaintenanceWorkOrder } from "@/types/maintenance";
import { createCrudService } from "./crud";

export const maintenanceService = createCrudService<MaintenanceWorkOrder, MaintenanceInput>("/api/v1/maintenance-work-orders");