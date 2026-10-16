import type { Supplier, SupplierInput } from "@/types/supplier";
import { createCrudService } from "./crud";

export const supplierService = createCrudService<Supplier, SupplierInput>("/v1/suppliers");