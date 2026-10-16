import type { ProductionPlan, ProductionPlanInput } from "@/types/production";
import { createCrudService } from "./crud";

export const productionPlanService = createCrudService<ProductionPlan, ProductionPlanInput>(
  "/v1/production-plans",
);