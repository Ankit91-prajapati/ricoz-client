import type { InventoryInput, InventoryItem } from "@/types/inventory";
import { createCrudService } from "./crud";

export const inventoryService = createCrudService<InventoryItem, InventoryInput>("/v1/inventory");