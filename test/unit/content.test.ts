import { describe, expect, it } from "vitest";
import {
  getProduct,
  getProductFamilyForProduct,
  PORTS,
  PRODUCTS,
  PRODUCT_FAMILIES,
  ROUTES,
  STARTING_PORT_ID,
  SUPPLY_PRICES,
} from "@/content/content-catalog";
import { validateCatalog, type ContentCatalog } from "@/content/catalog-validation";

const shippedCatalog: ContentCatalog = {
  productFamilies: PRODUCT_FAMILIES,
  products: PRODUCTS,
  ports: PORTS,
  routes: ROUTES,
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
  it("names the offending entry rather than only the failure", () => {
    const [diagnostic] = validateCatalog(
      withCatalog({ routes: [{ ...ROUTES[0], id: "broken-route", destinationPortId: "atlantis" }] }),
    );

    expect(diagnostic).toMatchObject({ code: "unknown-route-destination", entry: "broken-route" });
    expect(diagnostic.message).toContain("atlantis");
  });

  it("rejects unknown Route endpoints, self-routes, and duplicate Route identities", () => {
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], originPortId: "atlantis" }] }))).toContain(
      "unknown-route-origin",
    );
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], destinationPortId: "lisbon" }] }))).toContain("self-route");
    expect(codesFor(withCatalog({ routes: [...ROUTES, { ...ROUTES[0] }] }))).toContain("duplicate-route");
  });

  it("rejects impossible Route measurements", () => {
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], distance: 0 }] }))).toContain("invalid-distance");
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], durationMilliseconds: 0 }] }))).toContain(
      "invalid-duration",
    );
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], staticRisk: 1.5 }] }))).toContain("invalid-risk");
    expect(codesFor(withCatalog({ routes: [{ ...ROUTES[0], requiredSupplies: { food: -1, water: 1 } }] }))).toContain(
      "invalid-required-supplies",
    );
  });

  it("rejects a Port that no Route path can reach from the start", () => {
    const withoutTangierRoutes = ROUTES.filter((route) => route.destinationPortId !== "tangier");
    const diagnostics = validateCatalog(withCatalog({ routes: withoutTangierRoutes }));

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: "unreachable-port", entry: "tangier" }));
  });

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
});
