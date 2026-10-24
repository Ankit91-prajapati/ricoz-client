import type { InventoryInput, InventoryItem } from "@/types/inventory";
import { createCrudService } from "./crud";

export const inventoryService = createCrudService<InventoryItem, InventoryInput>("/api/v1/inventory");