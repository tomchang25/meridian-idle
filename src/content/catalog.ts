/**
 * The single entry point for authored world data. Consumers import from here
 * rather than from a per-domain module, so cross-domain resolution has one home
 * and the authored modules stay plain data.
 */
export { PRODUCT_FAMILIES, PRODUCTS, type Product, type ProductFamily } from "@/content/products";
export { PORTS, STARTING_PORT_ID, type Port, type PortCatalogEntry } from "@/content/ports";
export { ROUTES, type Route } from "@/content/routes";
export { SUPPLY_PRICES } from "@/content/supplies";

import { PORTS } from "@/content/ports";
import { PRODUCT_FAMILIES, PRODUCTS } from "@/content/products";
import { ROUTES } from "@/content/routes";

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
