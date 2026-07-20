import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/state/initial-game-state";
import {
  buySupply,
  discardSupply,
  restockSupplies,
  setSupplyTarget,
  supplyPurchaseError,
  supplyRestockPlan,
  usedCargo,
} from "@/core/rules/cargo";

describe("supply provisioning", () => {
  it("atomically adds supply quantity and cost basis", () => {
    const state = createInitialGameState(0);
    const result = buySupply(state, "food", 2, 1);
    expect(result.error).toBeUndefined();
    expect(result.state.fleet.gold).toBe(1_984);
    expect(result.state.fleet.supplies.food).toEqual({ quantity: 2, totalCostBasis: 16 });
    expect(usedCargo(result.state)).toBe(2);
  });

  it("uses fixed Supply prices at every Port", () => {
    const state = createInitialGameState(0);
    state.fleet.locationPortId = "faro";

    const result = buySupply(state, "food", 2, 1);
    expect(result.state.fleet.gold).toBe(1_984);
    expect(result.state.fleet.supplies.food).toEqual({ quantity: 2, totalCostBasis: 16 });
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

  it("persists targets without changing inventory and restocks every deficit atomically", () => {
    let state = createInitialGameState(0);
    state = setSupplyTarget(state, "food", 2).state;
    state = setSupplyTarget(state, "water", 3).state;

    expect(state.fleet.supplies.food.quantity).toBe(0);
    expect(supplyRestockPlan(state)).toMatchObject({ totalQuantity: 5, totalCost: 28, error: null });

    const restocked = restockSupplies(state, 10).state;
    expect(restocked.fleet.gold).toBe(1_972);
    expect(restocked.fleet.supplies.food).toEqual({ quantity: 2, totalCostBasis: 16 });
    expect(restocked.fleet.supplies.water).toEqual({ quantity: 3, totalCostBasis: 12 });
    expect(restocked.activity[0].message).toBe("Restocked 5 Supply units.");
  });

  it("never discards over-target supplies and rejects aggregate partial purchases", () => {
    let state = buySupply(createInitialGameState(0), "food", 3, 1).state;
    state = setSupplyTarget(state, "food", 1).state;
    expect(restockSupplies(state, 2)).toMatchObject({ state, error: "Targets already met." });

    state = setSupplyTarget(state, "water", 1).state;
    state.fleet.gold = 0;
    const failed = restockSupplies(state, 3);
    expect(failed.error).toBe("Requires 4 Gold; only 0 is available.");
    expect(failed.state).toBe(state);
    expect(failed.state.fleet.supplies.food).toEqual({ quantity: 3, totalCostBasis: 24 });
    expect(failed.state.fleet.supplies.water).toEqual({ quantity: 0, totalCostBasis: 0 });
  });

  it("rejects a target that exceeds capacity after other targets", () => {
    let state = createInitialGameState(0);
    state = setSupplyTarget(state, "food", 60).state;
    const failed = setSupplyTarget(state, "water", 1);

    expect(failed.error).toBe("Supply target requires 1 Cargo Capacity; only 0 remains after other targets.");
    expect(failed.state).toBe(state);
  });
});
