import { describe, expect, it } from "vitest";
import {
  getProduct,
  getProductFamilyForProduct,
  PORTS,
  NAV_EDGES,
  NAVIGATION_CONSTANTS,
  NAV_POINTS,
  PRODUCTS,
  PRODUCT_FAMILIES,
  REGIONS,
  STARTING_PORT_ID,
  SUB_REGIONS,
  SUPPLY_PRICES,
} from "@/content/content-catalog";
import { validateCatalog, type ContentCatalog } from "@/content/catalog-validation";

const shippedCatalog: ContentCatalog = {
  productFamilies: PRODUCT_FAMILIES,
  products: PRODUCTS,
  ports: PORTS,
  regions: REGIONS,
  subRegions: SUB_REGIONS,
  navPoints: NAV_POINTS,
  navEdges: NAV_EDGES,
  navigationConstants: NAVIGATION_CONSTANTS,
  supplyPrices: SUPPLY_PRICES,
  startingPortId: STARTING_PORT_ID,
};

/** Validates a deliberately broken world without mutating shipped content. */
function withCatalog(overrides: Partial<ContentCatalog>): ContentCatalog {
  return { ...shippedCatalog, ...overrides };
}
function codesFor(catalog: ContentCatalog): string[] {
  return validateCatalog(catalog).map((diagnostic) => diagnostic.code);
}

describe("core content", () => {
  it("provides every playable port with a valid ten-product catalog", () => {
    expect(PORTS).toHaveLength(3);
    expect(validateCatalog(shippedCatalog)).toEqual([]);
  });

  it("authors a complete, clean navigation graph as the only passage authority", () => {
    expect(NAV_POINTS).toHaveLength(4);
    expect(NAV_EDGES).toHaveLength(12);
    expect(validateCatalog(shippedCatalog)).toEqual([]);
  });

  it("keeps Category and Base Price on Product Family rather than Cargo identity", () => {
    expect(getProduct("cod")).toEqual({ id: "cod", name: "Cod", familyId: "cod" });
    expect(getProductFamilyForProduct("cod")).toMatchObject({ category: "food", basePrice: 30 });
  });

  it("defines one fixed global price for each Supply", () => {
    expect(SUPPLY_PRICES).toEqual({ food: 8, water: 4, medicine: 30, munitions: 18, spares: 24 });
    expect(PORTS.every((port) => !("supplyPrices" in port))).toBe(true);
  });
});

describe("catalog validation", () => {
  it("rejects an unknown starting Port", () => {
    expect(codesFor(withCatalog({ startingPortId: "atlantis" }))).toContain("unknown-starting-port");
  });

  it("rejects duplicate and dangling Product references", () => {
    expect(codesFor(withCatalog({ products: [...PRODUCTS, { ...PRODUCTS[0] }] }))).toContain("duplicate-product");
    expect(codesFor(withCatalog({ products: [{ ...PRODUCTS[0], familyId: "nonexistent" }] }))).toContain(
      "unknown-product-family",
    );
    expect(
      codesFor(
        withCatalog({
          products: PRODUCTS.map((product) =>
            product.id === "faro-pig" ? { ...product, specialtyOriginPortId: "atlantis" } : product,
          ),
        }),
      ),
    ).toContain("unknown-specialty-origin");
  });

  it("rejects a Port catalog with the wrong size, tiers, or Specialty", () => {
    const [lisbon] = PORTS;
    expect(codesFor(withCatalog({ ports: [{ ...lisbon, catalog: lisbon.catalog.slice(0, 9) }] }))).toContain(
      "invalid-catalog-size",
    );
    expect(
      codesFor(
        withCatalog({
          ports: [{ ...lisbon, catalog: lisbon.catalog.map((entry) => ({ ...entry, unlockLevel: 1 as const })) }],
        }),
      ),
    ).toContain("invalid-catalog-tiers");
    expect(
      codesFor(
        withCatalog({
          ports: [
            {
              ...lisbon,
              catalog: lisbon.catalog.map((entry) =>
                entry.unlockLevel === 50 ? { ...entry, productId: "faro-pig" } : entry,
              ),
            },
          ],
        }),
      ),
    ).toContain("invalid-specialty");
  });

  it("rejects an invalid Supply price", () => {
    expect(codesFor(withCatalog({ supplyPrices: { ...SUPPLY_PRICES, food: 0 } }))).toContain("invalid-supply-price");
  });

  it("reports navigation graph identity, endpoint, and measurement failures", () => {
    expect(codesFor(withCatalog({ regions: [...REGIONS, { ...REGIONS[0] }] }))).toContain("duplicate-region");
    expect(codesFor(withCatalog({ subRegions: [...SUB_REGIONS, { ...SUB_REGIONS[0] }] }))).toContain(
      "duplicate-sub-region",
    );
    expect(codesFor(withCatalog({ navPoints: [...NAV_POINTS, { ...NAV_POINTS[0] }] }))).toContain(
      "duplicate-nav-point",
    );
    expect(codesFor(withCatalog({ navEdges: [...NAV_EDGES, { ...NAV_EDGES[0] }] }))).toContain("duplicate-nav-edge");
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], originNodeId: "atlantis" }] }))).toContain(
      "unknown-edge-origin",
    );
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], destinationNodeId: "atlantis" }] }))).toContain(
      "unknown-edge-destination",
    );
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], distance: 0 }] }))).toContain("invalid-edge-distance");
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], staticRisk: 2 }] }))).toContain("invalid-edge-risk");
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], traversalModifier: 0 }] }))).toContain(
      "invalid-traversal-modifier",
    );
  });

  it("reports navigation topology, chart, and graph reachability failures", () => {
    expect(codesFor(withCatalog({ subRegions: [{ ...SUB_REGIONS[0], regionId: "atlantis" }] }))).toContain(
      "unknown-sub-region-region",
    );
    expect(codesFor(withCatalog({ ports: [{ ...PORTS[0], subRegionId: "atlantis" }] }))).toContain(
      "unknown-port-sub-region",
    );
    expect(codesFor(withCatalog({ ports: [{ ...PORTS[0], chartPosition: { x: 1_001, y: 0 } }] }))).toContain(
      "invalid-port-chart-position",
    );
    expect(
      codesFor(
        withCatalog({ ports: [{ ...PORTS[0], chartPosition: undefined } as unknown as (typeof PORTS)[number]] }),
      ),
    ).toContain("missing-port-chart-position");
    expect(
      codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], spans: [{ subRegionId: "atlantis", distance: 1 }] }] })),
    ).toContain("unknown-edge-span-sub-region");
    expect(
      codesFor(
        withCatalog({ navEdges: [{ ...NAV_EDGES[0], spans: [{ subRegionId: "tagus-approaches", distance: 1 }] }] }),
      ),
    ).toContain("invalid-edge-span-distance");
    expect(
      codesFor(withCatalog({ navEdges: NAV_EDGES.filter((edge) => !edge.id.startsWith("lisbon-berth")) })),
    ).toContain("invalid-berth-edge-pair");
    expect(
      codesFor(withCatalog({ navEdges: NAV_EDGES.filter((edge) => edge.destinationNodeId !== "tangier-approach") })),
    ).toContain("unreachable-graph-port");
  });

  it("requires every navigation edge to belong to a mirrored two-edge corridor", () => {
    expect(codesFor(withCatalog({ navEdges: [{ ...NAV_EDGES[0], corridorId: "" }] }))).toContain("missing-corridor-id");
    const [outbound, inbound] = NAV_EDGES.filter((edge) => edge.corridorId === "lisbon-cape");
    expect(codesFor(withCatalog({ navEdges: [outbound] }))).toContain("invalid-corridor-size");
    expect(codesFor(withCatalog({ navEdges: [outbound, { ...inbound, distance: inbound.distance + 1 }] }))).toContain(
      "mismatched-corridor",
    );
    expect(
      codesFor(withCatalog({ navEdges: [outbound, { ...inbound, spans: [...inbound.spans].reverse() }] })),
    ).toContain("mismatched-corridor");
  });
});
