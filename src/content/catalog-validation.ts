import { CATEGORY_IDS, SUPPLY_IDS, type SupplyId } from "@/core/model/game";
import type { Port } from "@/content/port-definitions";
import type { Product, ProductFamily } from "@/content/product-definitions";
import type { NavEdge, NavPoint, NavigationConstants } from "@/content/navigation-definitions";
import type { Region, SubRegion } from "@/content/region-definitions";

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
  regions: readonly Region[];
  subRegions: readonly SubRegion[];
  navPoints: readonly NavPoint[];
  navEdges: readonly NavEdge[];
  navigationConstants: NavigationConstants;
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

/** Ports reachable while treating every Port other than the origin as terminal. */
function reachableGraphPorts(catalog: ContentCatalog): Set<string> {
  const portIds = new Set(catalog.ports.map((port) => port.id));
  const reached = new Set<string>([catalog.startingPortId]);
  const queue = [catalog.startingPortId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of catalog.navEdges) {
      if (edge.originNodeId !== current || reached.has(edge.destinationNodeId)) continue;
      reached.add(edge.destinationNodeId);
      if (!portIds.has(edge.destinationNodeId)) queue.push(edge.destinationNodeId);
    }
  }

  return reached;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hasChartPosition(position: unknown): boolean {
  if (!position || typeof position !== "object") return false;
  const candidate = position as { x?: unknown; y?: unknown };
  return (
    typeof candidate.x === "number" &&
    Number.isFinite(candidate.x) &&
    candidate.x >= 0 &&
    candidate.x <= 1_000 &&
    typeof candidate.y === "number" &&
    Number.isFinite(candidate.y) &&
    candidate.y >= 0 &&
    candidate.y <= 1_000
  );
}

export function validateCatalog(catalog: ContentCatalog): ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const report = (code: string, entry: string, message: string) => diagnostics.push({ code, entry, message });

  const familyIds = new Set(catalog.productFamilies.map((family) => family.id));
  const productIds = new Set(catalog.products.map((product) => product.id));
  const portIds = new Set(catalog.ports.map((port) => port.id));
  const regionIds = new Set(catalog.regions.map((region) => region.id));
  const subRegionIds = new Set(catalog.subRegions.map((subRegion) => subRegion.id));
  const navPointIds = new Set(catalog.navPoints.map((point) => point.id));
  const nodeIds = new Set([...portIds, ...navPointIds]);

  for (const id of duplicates(catalog.productFamilies.map((family) => family.id)))
    report("duplicate-product-family", id, "Product Family identity is used more than once.");
  for (const id of duplicates(catalog.products.map((product) => product.id)))
    report("duplicate-product", id, "Product identity is used more than once.");
  for (const id of duplicates(catalog.ports.map((port) => port.id)))
    report("duplicate-port", id, "Port identity is used more than once.");
  for (const id of duplicates(catalog.regions.map((region) => region.id)))
    report("duplicate-region", id, "Region identity is used more than once.");
  for (const id of duplicates(catalog.subRegions.map((subRegion) => subRegion.id)))
    report("duplicate-sub-region", id, "SubRegion identity is used more than once.");
  for (const id of duplicates(catalog.navPoints.map((point) => point.id)))
    report("duplicate-nav-point", id, "Navigation point identity is used more than once.");
  for (const id of duplicates(catalog.navEdges.map((edge) => edge.id)))
    report("duplicate-nav-edge", id, "Navigation edge identity is used more than once.");

  for (const point of catalog.navPoints) {
    if (portIds.has(point.id))
      report("duplicate-navigation-node", point.id, "Port and navigation point identities share one namespace.");
    if (!subRegionIds.has(point.subRegionId))
      report(
        "unknown-nav-point-sub-region",
        point.id,
        `Navigation point names unknown SubRegion "${point.subRegionId}".`,
      );
    if (point.kind === "harbor-approach" && (!point.harborPortId || !portIds.has(point.harborPortId)))
      report("unknown-approach-port", point.id, "Harbor approach must name an authored Port.");
    if (!hasChartPosition(point.chartPosition))
      report("invalid-nav-point-chart-position", point.id, "Navigation point chart position must be within 0–1000.");
  }

  for (const subRegion of catalog.subRegions) {
    if (!regionIds.has(subRegion.regionId))
      report("unknown-sub-region-region", subRegion.id, `SubRegion names unknown Region "${subRegion.regionId}".`);
  }

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
    if (!regionIds.has(port.regionId))
      report("unknown-port-region", port.id, `Port names unknown Region "${port.regionId}".`);
    if (!subRegionIds.has(port.subRegionId))
      report("unknown-port-sub-region", port.id, `Port names unknown SubRegion "${port.subRegionId}".`);
    if (port.chartPosition === undefined)
      report("missing-port-chart-position", port.id, "Port needs a chart position.");
    else if (!hasChartPosition(port.chartPosition))
      report("invalid-port-chart-position", port.id, "Port chart position must be within 0–1000.");
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

  for (const edge of catalog.navEdges) {
    if (!nodeIds.has(edge.originNodeId))
      report("unknown-edge-origin", edge.id, `Navigation edge names unknown origin node "${edge.originNodeId}".`);
    if (!nodeIds.has(edge.destinationNodeId))
      report(
        "unknown-edge-destination",
        edge.id,
        `Navigation edge names unknown destination node "${edge.destinationNodeId}".`,
      );
    if (!(edge.distance > 0))
      report("invalid-edge-distance", edge.id, "Navigation edge distance must be greater than zero.");
    if (!(edge.staticRisk >= 0 && edge.staticRisk <= 1))
      report("invalid-edge-risk", edge.id, "Navigation edge static risk must be between zero and one.");
    if (!(edge.traversalModifier > 0))
      report("invalid-traversal-modifier", edge.id, "Navigation edge traversal modifier must be greater than zero.");
    const spanDistance = edge.spans.reduce((total, span) => total + span.distance, 0);
    if (spanDistance !== edge.distance)
      report("invalid-edge-span-distance", edge.id, "Navigation edge span distances must sum to its distance.");
    for (const span of edge.spans) {
      if (!subRegionIds.has(span.subRegionId))
        report(
          "unknown-edge-span-sub-region",
          edge.id,
          `Navigation edge names unknown SubRegion "${span.subRegionId}".`,
        );
    }

    const portNodeId = portIds.has(edge.originNodeId)
      ? edge.originNodeId
      : portIds.has(edge.destinationNodeId)
        ? edge.destinationNodeId
        : undefined;
    if (portNodeId) {
      const otherNodeId = edge.originNodeId === portNodeId ? edge.destinationNodeId : edge.originNodeId;
      const otherNode = catalog.navPoints.find((point) => point.id === otherNodeId);
      if (otherNode?.kind !== "harbor-approach" || otherNode.harborPortId !== portNodeId)
        report("invalid-berth-edge", edge.id, "Berth edges must connect a Port and its harbor approach.");
    }
    if (!isNonEmptyString(edge.corridorId))
      report("missing-corridor-id", edge.id, "Navigation edge must name an authored corridor identity.");
  }

  const edgesByCorridor = new Map<string, NavEdge[]>();
  for (const edge of catalog.navEdges) {
    if (!isNonEmptyString(edge.corridorId)) continue;
    const group = edgesByCorridor.get(edge.corridorId) ?? [];
    group.push(edge);
    edgesByCorridor.set(edge.corridorId, group);
  }
  for (const [corridorId, edges] of edgesByCorridor) {
    if (edges.length !== 2) {
      report("invalid-corridor-size", corridorId, "Navigation corridor must contain exactly two directed edges.");
      continue;
    }
    const [outbound, inbound] = edges;
    const mirroredSpans =
      outbound.spans.length === inbound.spans.length &&
      outbound.spans.every((span, index) => {
        const mirror = inbound.spans[inbound.spans.length - 1 - index];
        return !!mirror && span.subRegionId === mirror.subRegionId && span.distance === mirror.distance;
      });
    const mirrored =
      outbound.originNodeId === inbound.destinationNodeId &&
      outbound.destinationNodeId === inbound.originNodeId &&
      outbound.distance === inbound.distance &&
      outbound.staticRisk === inbound.staticRisk &&
      outbound.traversalModifier === inbound.traversalModifier &&
      mirroredSpans;
    if (!mirrored)
      report(
        "mismatched-corridor",
        corridorId,
        "Navigation corridor's two directed edges must mirror endpoints, distance, risk, and reversed span order.",
      );
  }

  for (const port of catalog.ports) {
    const approaches = catalog.navPoints.filter(
      (point) => point.kind === "harbor-approach" && point.harborPortId === port.id,
    );
    if (approaches.length !== 1) {
      report(
        "invalid-berth-edge-pair",
        port.id,
        "Port must have exactly one directed berth edge pair to its harbor approach.",
      );
      continue;
    }
    const approachId = approaches[0].id;
    const outbound = catalog.navEdges.filter(
      (edge) => edge.originNodeId === port.id && edge.destinationNodeId === approachId,
    );
    const inbound = catalog.navEdges.filter(
      (edge) => edge.originNodeId === approachId && edge.destinationNodeId === port.id,
    );
    if (outbound.length !== 1 || inbound.length !== 1)
      report(
        "invalid-berth-edge-pair",
        port.id,
        "Port must have exactly one directed berth edge pair to its harbor approach.",
      );
  }

  if (!portIds.has(catalog.startingPortId))
    report("unknown-starting-port", catalog.startingPortId, "The starting Port is not an authored Port.");

  if (portIds.has(catalog.startingPortId)) {
    const reached = reachableGraphPorts(catalog);
    for (const port of catalog.ports) {
      if (!reached.has(port.id))
        report(
          "unreachable-graph-port",
          port.id,
          "No legal navigation graph path reaches this Port from the starting Port.",
        );
    }
  }

  for (const id of SUPPLY_IDS) {
    const price = catalog.supplyPrices[id];
    if (!Number.isFinite(price) || price <= 0)
      report("invalid-supply-price", id, "Supply price must be a finite number greater than zero.");
  }

  if (!(catalog.navigationConstants.timePerDistanceUnitMilliseconds > 0))
    report("invalid-navigation-time", "navigation-constants", "Time per distance unit must be greater than zero.");
  if (!(catalog.navigationConstants.debugTimeScale > 0))
    report("invalid-debug-time-scale", "navigation-constants", "Debug time scale must be greater than zero.");
  for (const supplyId of ["food", "water"] as const) {
    if (!(catalog.navigationConstants.supplyConsumptionPerSecond[supplyId] >= 0))
      report("invalid-supply-consumption", supplyId, "Supply consumption rate must be non-negative.");
  }

  return diagnostics;
}
