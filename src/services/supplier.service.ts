import type { Supplier, SupplierInput } from "@/types/supplier";
import { createCrudService } from "./crud";

export const supplierService = createCrudService<Supplier, SupplierInput>("/api/v1/suppliers");