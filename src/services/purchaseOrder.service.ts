import type { PurchaseOrder, PurchaseOrderInput } from "@/types/purchase";
import { createCrudService } from "./crud";

export const purchaseOrderService = createCrudService<PurchaseOrder, PurchaseOrderInput>("/api/v1/purchase-orders");