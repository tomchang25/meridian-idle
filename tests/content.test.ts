import { describe, expect, it } from "vitest";
import { getProduct, getProductFamilyForProduct, PORTS, validateContent } from "@/game/domain/content/core-content";
describe("core content", () => {
  it("provides every playable port with a valid ten-product catalog", () => {
    expect(PORTS).toHaveLength(3);
    expect(validateContent()).toEqual([]);
  });

  it("keeps Category and Base Price on Product Family rather than Cargo identity", () => {
    expect(getProduct("cod")).toEqual({ id: "cod", name: "Cod", familyId: "cod" });
    expect(getProductFamilyForProduct("cod")).toMatchObject({ category: "food", basePrice: 30 });
  });
});
