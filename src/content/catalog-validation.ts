import { CATEGORY_IDS, SUPPLY_IDS, type SupplyId } from "@/core/models/game";
import type { Port } from "@/content/ports";
import type { Product, ProductFamily } from "@/content/products";
import type { Route } from "@/content/routes";

/**
 * Test-time proof that authored content is internally consistent. Content is
 * compiled into the bundle and cannot change after build, so this is a check on
 * the authored source rather than a runtime guard — nothing in production
 * imports it, which is what keeps it out of the shipped bundle.
 */
export type ContentDiagnostic = {
  /** Stable identifier for the failure class; tests assert this, not the message. */
  code: string;
  /** The offending entry, so a failure names what to fix. */
  entry: string;
  message: string;
};

export type ContentCatalog = {
  productFamilies: readonly ProductFamily[];
  products: readonly Product[];
  ports: readonly Port[];
  routes: readonly Route[];
  supplyPrices: Record<SupplyId, number>;
  startingPortId: string;
};

const TIER_SIZES: ReadonlyArray<readonly [number, number]> = [
  [1, 4],
  [20, 3],
  [50, 1],
  [75, 2],
];

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) repeated.add(id);
    seen.add(id);
  }
  return [...repeated];
}

function isWholeAtLeast(value: unknown, minimum: number): boolean {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

/** Ports reachable from the start by following directed routes. */
function reachablePorts(catalog: ContentCatalog): Set<string> {
  const reached = new Set<string>([catalog.startingPortId]);
  const queue = [catalog.startingPortId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const route of catalog.routes) {
      if (route.originPortId !== current || reached.has(route.destinationPortId)) continue;
      reached.add(route.destinationPortId);
      queue.push(route.destinationPortId);
    }
  }
  return reached;
}

export function validateCatalog(catalog: ContentCatalog): ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const report = (code: string, entry: string, message: string) => diagnostics.push({ code, entry, message });

  const familyIds = new Set(catalog.productFamilies.map((family) => family.id));
  const productIds = new Set(catalog.products.map((product) => product.id));
  const portIds = new Set(catalog.ports.map((port) => port.id));

  for (const id of duplicates(catalog.productFamilies.map((family) => family.id)))
    report("duplicate-product-family", id, "Product Family identity is used more than once.");
  for (const id of duplicates(catalog.products.map((product) => product.id)))
    report("duplicate-product", id, "Product identity is used more than once.");
  for (const id of duplicates(catalog.ports.map((port) => port.id)))
    report("duplicate-port", id, "Port identity is used more than once.");
  for (const id of duplicates(catalog.routes.map((route) => route.id)))
    report("duplicate-route", id, "Route identity is used more than once.");

  for (const family of catalog.productFamilies) {
    if (!CATEGORY_IDS.includes(family.category))
      report("unknown-category", family.id, `Product Family names unknown Category "${family.category}".`);
    if (!(family.basePrice > 0))
      report("invalid-base-price", family.id, "Product Family Base Price must be greater than zero.");
  }

  for (const product of catalog.products) {
    if (!familyIds.has(product.familyId))
      report("unknown-product-family", product.id, `Product names unknown Product Family "${product.familyId}".`);
    if (product.specialtyOriginPortId !== undefined && !portIds.has(product.specialtyOriginPortId))
      report(
        "unknown-specialty-origin",
        product.id,
        `Product names unknown Specialty origin Port "${product.specialtyOriginPortId}".`,
      );
  }

  for (const port of catalog.ports) {
    if (!port.regionId) report("missing-region", port.id, "Port has no Region.");
    const entryIds = port.catalog.map((entry) => entry.productId);
    if (entryIds.length !== 10 || new Set(entryIds).size !== 10)
      report("invalid-catalog-size", port.id, "Port catalog must contain ten unique Products.");
    for (const [tier, size] of TIER_SIZES) {
      if (port.catalog.filter((entry) => entry.unlockLevel === tier).length !== size)
        report("invalid-catalog-tiers", port.id, `Port catalog must hold ${size} Products at unlock tier ${tier}.`);
    }
    for (const productId of entryIds) {
      if (!productIds.has(productId))
        report("unknown-catalog-product", port.id, `Port catalog names unknown Product "${productId}".`);
    }
    const specialty = port.catalog.find((entry) => entry.unlockLevel === 50);
    const specialtyOrigin = specialty
      ? catalog.products.find((product) => product.id === specialty.productId)?.specialtyOriginPortId
      : undefined;
    if (!specialty || specialtyOrigin !== port.id)
      report("invalid-specialty", port.id, "Port Specialty must be a Product whose Specialty origin is this Port.");
  }

  for (const route of catalog.routes) {
    if (!portIds.has(route.originPortId))
      report("unknown-route-origin", route.id, `Route names unknown origin Port "${route.originPortId}".`);
    if (!portIds.has(route.destinationPortId))
      report(
        "unknown-route-destination",
        route.id,
        `Route names unknown destination Port "${route.destinationPortId}".`,
      );
    if (route.originPortId === route.destinationPortId)
      report("self-route", route.id, "Route origin and destination are the same Port.");
    if (!(route.distance > 0)) report("invalid-distance", route.id, "Route distance must be greater than zero.");
    if (!(route.durationMilliseconds > 0))
      report("invalid-duration", route.id, "Route duration must be greater than zero.");
    if (!(route.staticRisk >= 0 && route.staticRisk <= 1))
      report("invalid-risk", route.id, "Route static risk must be between zero and one.");
    if (!isWholeAtLeast(route.requiredSupplies.food, 0) || !isWholeAtLeast(route.requiredSupplies.water, 0))
      report("invalid-required-supplies", route.id, "Route required Supplies must be non-negative whole numbers.");
  }

  if (!portIds.has(catalog.startingPortId))
    report("unknown-starting-port", catalog.startingPortId, "The starting Port is not an authored Port.");
  else {
    const reached = reachablePorts(catalog);
    for (const port of catalog.ports) {
      if (!reached.has(port.id))
        report("unreachable-port", port.id, "No Route path reaches this Port from the starting Port.");
    }
  }

  for (const id of SUPPLY_IDS) {
    const price = catalog.supplyPrices[id];
    if (!Number.isFinite(price) || price <= 0)
      report("invalid-supply-price", id, "Supply price must be a finite number greater than zero.");
  }

  return diagnostics;
}
