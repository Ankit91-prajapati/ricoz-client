import type { OperationExecution, OperationInput } from "@/types/operation";
import { createCrudService } from "./crud";

// Assumed mount: app.use("/api/v1/operation-executions", operationExecutionRoutes)
// Your router has no DELETE route, so remove() isn't used.
export const operationService = createCrudService<OperationExecution, OperationInput>("/api/v1/operation-executions");