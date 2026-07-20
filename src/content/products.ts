import type { CategoryId } from "@/core/models/game";

export type ProductFamily = {
  id: string;
  name: string;
  category: CategoryId;
  basePrice: number;
};
export type Product = {
  id: string;
  name: string;
  familyId: string;
  specialtyOriginPortId?: string;
};

export const PRODUCT_FAMILIES: ProductFamily[] = [
  { id: "cod", name: "Cod", category: "food", basePrice: 30 },
  { id: "tuna", name: "Tuna", category: "food", basePrice: 35 },
  { id: "barley", name: "Barley", category: "food", basePrice: 20 },
  { id: "olive-oil", name: "Olive Oil", category: "food", basePrice: 40 },
  { id: "salt", name: "Salt", category: "food", basePrice: 15 },
  { id: "wine", name: "Wine", category: "food", basePrice: 60 },
  { id: "wool-cloth", name: "Wool Cloth", category: "textile", basePrice: 75 },
  { id: "rope", name: "Rope", category: "textile", basePrice: 35 },
  { id: "leather", name: "Leather", category: "textile", basePrice: 70 },
  { id: "iron-ingot", name: "Iron Ingot", category: "metal", basePrice: 110 },
  { id: "copper-ingot", name: "Copper Ingot", category: "metal", basePrice: 95 },
  { id: "ceramic", name: "Ceramic", category: "luxury", basePrice: 65 },
  { id: "glassware", name: "Glassware", category: "luxury", basePrice: 90 },
  { id: "lisbon-cork", name: "Lisbon Cork", category: "luxury", basePrice: 150 },
  { id: "faro-pig", name: "Faro Pig", category: "livestock", basePrice: 100 },
  {
    id: "tangier-dyed-leather",
    name: "Tangier Dyed Leather",
    category: "textile",
    basePrice: 140,
  },
];

export const PRODUCTS: Product[] = [
  { id: "cod", name: "Cod", familyId: "cod" },
  { id: "tuna", name: "Tuna", familyId: "tuna" },
  { id: "barley", name: "Barley", familyId: "barley" },
  { id: "olive-oil", name: "Olive Oil", familyId: "olive-oil" },
  { id: "salt", name: "Salt", familyId: "salt" },
  { id: "wine", name: "Wine", familyId: "wine" },
  { id: "wool-cloth", name: "Wool Cloth", familyId: "wool-cloth" },
  { id: "rope", name: "Rope", familyId: "rope" },
  { id: "leather", name: "Leather", familyId: "leather" },
  { id: "iron-ingot", name: "Iron Ingot", familyId: "iron-ingot" },
  { id: "copper-ingot", name: "Copper Ingot", familyId: "copper-ingot" },
  { id: "ceramic", name: "Ceramic", familyId: "ceramic" },
  { id: "glassware", name: "Glassware", familyId: "glassware" },
  { id: "lisbon-cork", name: "Lisbon Cork", familyId: "lisbon-cork", specialtyOriginPortId: "lisbon" },
  { id: "faro-pig", name: "Faro Pig", familyId: "faro-pig", specialtyOriginPortId: "faro" },
  {
    id: "tangier-dyed-leather",
    name: "Tangier Dyed Leather",
    familyId: "tangier-dyed-leather",
    specialtyOriginPortId: "tangier",
  },
];
