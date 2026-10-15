export const PRODUCT_TYPES = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "COMPONENT", label: "Component" },
  { value: "FINISHED_GOOD", label: "Finished Good" },
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number]["value"];

export const productTypeLabel = (type: ProductType) =>
  PRODUCT_TYPES.find((t) => t.value === type)?.label ?? type;

export const UNIT_SUGGESTIONS = ["PCS", "KG", "G", "L", "ML", "M", "CM", "BOX", "SET"];

export interface Product {
  _id: string;
  name: string;
  code: string;
  type: ProductType;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the create / edit form sends to the API. */
export interface ProductInput {
  name: string;
  code: string;
  type: ProductType;
  unit: string;
  isActive: boolean;
}