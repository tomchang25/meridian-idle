import type { SupplyId } from "@/game/domain/models/game";

export type ProductCategory = "food" | "textile" | "metal" | "luxury" | "livestock";
export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  specialtyOriginPortId?: string;
};
export type PortCatalogEntry = { productId: string; unlockLevel: 1 | 20 | 50 | 75 };
export type Port = {
  id: string;
  name: string;
  regionId: string;
  catalog: PortCatalogEntry[];
  supplyPrices: Record<SupplyId, number>;
};

export const PRODUCTS: Product[] = [
  { id: "cod", name: "Cod", category: "food", basePrice: 30 },
  { id: "olive-oil", name: "Olive Oil", category: "food", basePrice: 40 },
  { id: "wool-cloth", name: "Wool Cloth", category: "textile", basePrice: 75 },
  { id: "iron-ingot", name: "Iron Ingot", category: "metal", basePrice: 110 },
  { id: "salt", name: "Salt", category: "food", basePrice: 15 },
  { id: "wine", name: "Wine", category: "food", basePrice: 60 },
  { id: "rope", name: "Rope", category: "textile", basePrice: 35 },
  { id: "lisbon-cork", name: "Lisbon Cork", category: "luxury", basePrice: 150, specialtyOriginPortId: "lisbon" },
  { id: "ceramic", name: "Ceramic", category: "luxury", basePrice: 65 },
  { id: "glassware", name: "Glassware", category: "luxury", basePrice: 90 },
];

const lisbonCatalog: PortCatalogEntry[] = [
  ...["cod", "olive-oil", "wool-cloth", "iron-ingot"].map((productId) => ({ productId, unlockLevel: 1 as const })),
  ...["salt", "wine", "rope"].map((productId) => ({ productId, unlockLevel: 20 as const })),
  { productId: "lisbon-cork", unlockLevel: 50 },
  ...["ceramic", "glassware"].map((productId) => ({ productId, unlockLevel: 75 as const })),
];

export const PORTS: Port[] = [
  {
    id: "lisbon",
    name: "Lisbon",
    regionId: "iberian-atlantic",
    catalog: lisbonCatalog,
    supplyPrices: { food: 8, water: 4, medicine: 30, rope: 18, sails: 24 },
  },
];

export function getPort(portId: string): Port | undefined {
  return PORTS.find((port) => port.id === portId);
}
export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId);
}
