import type { Bom, BomInput } from "@/types/bom";
import { createCrudService } from "./crud";

// Assumed mount: app.use("/api/v1/boms", bomRoutes)
export const bomService = createCrudService<Bom, BomInput>("/api/v1/boms");