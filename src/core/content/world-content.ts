import type { CategoryId, SupplyId } from "@/core/model/game";

/**
 * The shapes core understands. Core defines what a Port or navigation edge is; the
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

export type ChartPosition = { x: number; y: number };

export type Region = {
  id: string;
  name: string;
};

export type SubRegion = {
  id: string;
  name: string;
  regionId: string;
};

export type Port = {
  id: string;
  name: string;
  regionId: string;
  subRegionId: string;
  chartPosition: ChartPosition;
  catalog: PortCatalogEntry[];
};

export type NavPointKind = "harbor-approach" | "headland";

export type NavPoint = {
  id: string;
  name: string;
  kind: NavPointKind;
  /** Present only on a harbor approach, identifying the Port it serves. */
  harborPortId?: string;
  subRegionId: string;
  chartPosition: ChartPosition;
};

export type NavEdgeSpan = { subRegionId: string; distance: number };

export type NavEdge = {
  id: string;
  originNodeId: string;
  destinationNodeId: string;
  distance: number;
  staticRisk: number;
  traversalModifier: number;
  spans: NavEdgeSpan[];
};

export type NavigationConstants = {
  timePerDistanceUnitMilliseconds: number;
  supplyConsumptionPerSecond: { food: number; water: number };
  debugTimeScale: number;
};

/**
 * How a rule reaches authored data. Deliberately lookups rather than arrays:
 * rules only ever resolve by identifier, and handing over the collections would
 * let a rule iterate the world and re-acquire content knowledge in a new form.
 */
export type WorldContent = {
  getPort(id: string): Port | undefined;
  getRegion(id: string): Region | undefined;
  getSubRegion(id: string): SubRegion | undefined;
  getNavPoint(id: string): NavPoint | undefined;
  getNavEdge(id: string): NavEdge | undefined;
  getOutgoingNavEdges(nodeId: string): readonly NavEdge[];
  getProduct(id: string): Product | undefined;
  getProductFamilyForProduct(productId: string): ProductFamily | undefined;
  readonly supplyPrices: Record<SupplyId, number>;
  readonly navigationConstants: NavigationConstants;
};
