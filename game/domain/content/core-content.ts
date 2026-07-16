import { CATEGORY_IDS, SUPPLY_IDS, type CategoryId, type SupplyId } from "@/game/domain/models/game";

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
export type PortCatalogEntry = { productId: string; unlockLevel: 1 | 20 | 50 | 75 };
export type Port = {
  id: string;
  name: string;
  regionId: string;
  catalog: PortCatalogEntry[];
  supplyPrices: Record<SupplyId, number>;
};
export type Route = {
  id: string;
  originPortId: string;
  destinationPortId: string;
  distance: number;
  durationMilliseconds: number;
  staticRisk: number;
  requiredSupplies: { food: number; water: number };
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
const catalog = (basic: string[], advanced: string[], specialty: string, final: string[]): PortCatalogEntry[] => [
  ...basic.map((productId) => ({ productId, unlockLevel: 1 as const })),
  ...advanced.map((productId) => ({ productId, unlockLevel: 20 as const })),
  { productId: specialty, unlockLevel: 50 },
  ...final.map((productId) => ({ productId, unlockLevel: 75 as const })),
];
export const PORTS: Port[] = [
  {
    id: "lisbon",
    name: "Lisbon",
    regionId: "iberian-atlantic",
    catalog: catalog(["cod", "olive-oil", "wool-cloth", "iron-ingot"], ["salt", "wine", "rope"], "lisbon-cork", [
      "ceramic",
      "glassware",
    ]),
    supplyPrices: { food: 8, water: 4, medicine: 30, rope: 18, sails: 24 },
  },
  {
    id: "faro",
    name: "Faro",
    regionId: "iberian-atlantic",
    catalog: catalog(["tuna", "olive-oil", "wool-cloth", "salt"], ["wine", "rope", "copper-ingot"], "faro-pig", [
      "iron-ingot",
      "glassware",
    ]),
    supplyPrices: { food: 7, water: 4, medicine: 28, rope: 17, sails: 23 },
  },
  {
    id: "tangier",
    name: "Tangier",
    regionId: "maghreb-coast",
    catalog: catalog(
      ["barley", "olive-oil", "wool-cloth", "copper-ingot"],
      ["salt", "wine", "leather"],
      "tangier-dyed-leather",
      ["iron-ingot", "ceramic"],
    ),
    supplyPrices: { food: 9, water: 5, medicine: 32, rope: 20, sails: 27 },
  },
];
export const ROUTES: Route[] = [
  {
    id: "lisbon-faro",
    originPortId: "lisbon",
    destinationPortId: "faro",
    distance: 20,
    durationMilliseconds: 2_000,
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  {
    id: "faro-lisbon",
    originPortId: "faro",
    destinationPortId: "lisbon",
    distance: 20,
    durationMilliseconds: 2_000,
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  {
    id: "lisbon-tangier",
    originPortId: "lisbon",
    destinationPortId: "tangier",
    distance: 50,
    durationMilliseconds: 5_000,
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  {
    id: "tangier-lisbon",
    originPortId: "tangier",
    destinationPortId: "lisbon",
    distance: 50,
    durationMilliseconds: 5_000,
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  {
    id: "faro-tangier",
    originPortId: "faro",
    destinationPortId: "tangier",
    distance: 35,
    durationMilliseconds: 4_000,
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
  {
    id: "tangier-faro",
    originPortId: "tangier",
    destinationPortId: "faro",
    distance: 35,
    durationMilliseconds: 4_000,
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
];
export function getPort(id: string) {
  return PORTS.find((port) => port.id === id);
}
export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}
export function getProductFamily(id: string) {
  return PRODUCT_FAMILIES.find((family) => family.id === id);
}
export function getProductFamilyForProduct(productId: string) {
  const product = getProduct(productId);
  return product ? getProductFamily(product.familyId) : undefined;
}
export function getRoute(id: string) {
  return ROUTES.find((route) => route.id === id);
}
export function validateContent(): string[] {
  const errors: string[] = [];
  if (new Set(PRODUCT_FAMILIES.map((family) => family.id)).size !== PRODUCT_FAMILIES.length)
    errors.push("duplicate Product Family identity");
  if (new Set(PRODUCTS.map((product) => product.id)).size !== PRODUCTS.length)
    errors.push("duplicate Product identity");
  for (const product of PRODUCTS) {
    if (!getProductFamily(product.familyId)) errors.push(`${product.id}: unknown Product Family`);
  }
  for (const port of PORTS) {
    const ids = port.catalog.map((entry) => entry.productId);
    if (ids.length !== 10 || new Set(ids).size !== 10)
      errors.push(`${port.id}: catalog must contain ten unique products`);
    if (
      [1, 20, 50, 75].some(
        (tier, index) => port.catalog.filter((entry) => entry.unlockLevel === tier).length !== [4, 3, 1, 2][index],
      )
    )
      errors.push(`${port.id}: invalid tiers`);
    if (ids.some((id) => !getProduct(id))) errors.push(`${port.id}: unknown Product`);
    const specialty = port.catalog.find((entry) => entry.unlockLevel === 50);
    if (!specialty || getProduct(specialty.productId)?.specialtyOriginPortId !== port.id)
      errors.push(`${port.id}: invalid specialty`);
    if (SUPPLY_IDS.some((id) => !Number.isFinite(port.supplyPrices[id]) || port.supplyPrices[id] <= 0))
      errors.push(`${port.id}: invalid supply price`);
  }
  if (PRODUCT_FAMILIES.some((family) => !CATEGORY_IDS.includes(family.category) || family.basePrice <= 0))
    errors.push("invalid Product Family metadata");
  return errors;
}
