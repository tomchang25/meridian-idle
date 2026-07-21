import type { CategoryId, SupplyId } from "@/core/model/game";

/**
 * The shapes core understands. Core defines what a Port or a Route is; the
 * content layer authors particular ones and is checked against these.
 */
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

/**
 * How a rule reaches authored data. Deliberately lookups rather than arrays:
 * rules only ever resolve by identifier, and handing over the collections would
 * let a rule iterate the world and re-acquire content knowledge in a new form.
 */
export type WorldContent = {
  getPort(id: string): Port | undefined;
  getProduct(id: string): Product | undefined;
  getProductFamilyForProduct(productId: string): ProductFamily | undefined;
  getRoute(id: string): Route | undefined;
  readonly supplyPrices: Record<SupplyId, number>;
};
