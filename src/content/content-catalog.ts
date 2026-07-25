/**
 * The single entry point for authored world data. Consumers import from here
 * rather than from a per-domain module, so cross-domain resolution has one home
 * and the authored modules stay plain data.
 */
export { PRODUCT_FAMILIES, PRODUCTS, type Product, type ProductFamily } from "@/content/product-definitions";
export { PORTS, STARTING_PORT_ID, type Port, type PortCatalogEntry } from "@/content/port-definitions";
export { ROUTES, type Route } from "@/content/route-definitions";
export { SUPPLY_PRICES } from "@/content/supply-definitions";
export { REGIONS, SUB_REGIONS, type Region, type SubRegion } from "@/content/region-definitions";
export {
  NAV_EDGES,
  DEBUG_TIME_SCALE,
  NAVIGATION_CONSTANTS,
  NAV_POINTS,
  SUPPLY_CONSUMPTION_PER_SECOND,
  TIME_PER_DISTANCE_UNIT_MS,
  type NavEdge,
  type NavigationConstants,
  type NavPoint,
} from "@/content/navigation-definitions";

import { NAV_EDGES, NAVIGATION_CONSTANTS, NAV_POINTS } from "@/content/navigation-definitions";
import { PORTS } from "@/content/port-definitions";
import { PRODUCT_FAMILIES, PRODUCTS } from "@/content/product-definitions";
import { REGIONS, SUB_REGIONS } from "@/content/region-definitions";
import { ROUTES } from "@/content/route-definitions";
import { SUPPLY_PRICES } from "@/content/supply-definitions";
import type { WorldContent } from "@/core/content/world-content";

export function getPort(id: string) {
  return PORTS.find((port) => port.id === id);
}
export function getRegion(id: string) {
  return REGIONS.find((region) => region.id === id);
}
export function getSubRegion(id: string) {
  return SUB_REGIONS.find((subRegion) => subRegion.id === id);
}
export function getNavPoint(id: string) {
  return NAV_POINTS.find((point) => point.id === id);
}
export function getNavEdge(id: string) {
  return NAV_EDGES.find((edge) => edge.id === id);
}
export function getOutgoingNavEdges(nodeId: string) {
  return NAV_EDGES.filter((edge) => edge.originNodeId === nodeId);
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

/**
 * The shipped world, as core rules consume it. Rules never import this module;
 * whoever calls a rule hands this in, which is what keeps core free of any
 * particular world.
 */
export const WORLD_CONTENT: WorldContent = {
  getPort,
  getRegion,
  getSubRegion,
  getNavPoint,
  getNavEdge,
  getOutgoingNavEdges,
  getProduct,
  getProductFamilyForProduct,
  getRoute,
  supplyPrices: SUPPLY_PRICES,
  navigationConstants: NAVIGATION_CONSTANTS,
};
