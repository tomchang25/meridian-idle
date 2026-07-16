import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { buySupply, discardSupply, supplyPurchaseError, usedCargo } from "@/game/domain/rules/cargo";

describe("supply provisioning", () => {
  it("atomically adds supply quantity and cost basis", () => {
    const state = createInitialGameState(0);
    const result = buySupply(state, "food", 2, 1);
    expect(result.error).toBeUndefined();
    expect(result.state.fleet.gold).toBe(1_984);
    expect(result.state.fleet.supplies.food).toEqual({ quantity: 2, totalCostBasis: 16 });
    expect(usedCargo(result.state)).toBe(2);
  });

  it("does not mutate state for invalid quantities or capacity", () => {
    const state = createInitialGameState(0);
    expect(buySupply(state, "food", 0, 1).state).toBe(state);
    state.fleet.supplies.food.quantity = 60;
    expect(buySupply(state, "water", 1, 1).state).toBe(state);
  });

  it("removes proportional cost basis without a refund", () => {
    const purchased = buySupply(createInitialGameState(0), "food", 2, 1).state;
    const discarded = discardSupply(purchased, "food", 1).state;
    expect(discarded.fleet.gold).toBe(purchased.fleet.gold);
    expect(discarded.fleet.supplies.food).toEqual({ quantity: 1, totalCostBasis: 8 });
  });

  it("returns actionable Gold and Cargo eligibility reasons", () => {
    const noGold = createInitialGameState(0);
    noGold.fleet.gold = 0;
    expect(supplyPurchaseError(noGold, "food", 1)).toBe("Requires 8 Gold; only 0 is available.");

    const full = createInitialGameState(0);
    full.fleet.supplies.food.quantity = full.fleet.cargoCapacity;
    expect(supplyPurchaseError(full, "water", 1)).toBe("Requires 1 Cargo Capacity; only 0 remains.");
  });
});
