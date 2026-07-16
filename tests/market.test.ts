import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import {
  buyPrice,
  buyProduct,
  createMarketSession,
  productPurchaseError,
  sellPrice,
  sellProduct,
} from "@/game/domain/rules/market";
describe("market", () => {
  it("persists deterministic factors and applies producer prices", () => {
    const session = createMarketSession("lisbon", 1, 7);
    expect(session.categoryFactors.food).toBeGreaterThanOrEqual(0.85);
    expect(session.categoryFactors.food).toBeLessThanOrEqual(1.2);
    const state = createInitialGameState(0);
    state.marketSession = session;
    expect(buyPrice(state, "cod")?.unitPrice).toBe(Math.floor(30 * session.categoryFactors.food * 0.8 + 0.5));
  });
  it("buys and partially sells atomically with actual cost basis", () => {
    const state = createInitialGameState(0);
    const bought = buyProduct(state, "cod", 2, 1).state;
    const sale = sellProduct(bought, "cod", 1, 2).state;
    expect(sale.fleet.products.cod).toEqual({
      quantity: 1,
      totalCostBasis: bought.fleet.products.cod.totalCostBasis / 2,
    });
    expect(sale.marketSession.netTrade.cod).toBe(1);
  });
  it("uses exclusive specialty sale classification", () => {
    const state = createInitialGameState(0);
    state.fleet.locationPortId = "tangier";
    state.marketSession = createMarketSession("tangier", 1, 5);
    expect(sellPrice(state, "lisbon-cork")?.modifier).toBe(3);
  });
  it("shares actionable unlock, Gold, capacity, and Specialty eligibility", () => {
    const locked = createInitialGameState(0);
    expect(productPurchaseError(locked, "lisbon-cork", 1)).toBe("Unlocks at Port Level 50.");

    const noGold = createInitialGameState(0);
    noGold.fleet.gold = 0;
    expect(productPurchaseError(noGold, "cod", 1)).toBe("Requires 20 Gold; only 0 is available.");

    const full = createInitialGameState(0);
    full.fleet.supplies.food.quantity = full.fleet.cargoCapacity;
    expect(productPurchaseError(full, "cod", 1)).toBe("Requires 1 Cargo Capacity; only 0 remains.");

    const noSpecialty = createInitialGameState(0);
    noSpecialty.portProgress.lisbon.xp = 7_900;
    noSpecialty.marketSession = createMarketSession("lisbon", 50, 1);
    noSpecialty.marketSession.specialtySupply = 0;
    expect(productPurchaseError(noSpecialty, "lisbon-cork", 1)).toBe("Only 0 Specialty units remain.");
  });
});
