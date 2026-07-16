import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { buySupply, usedCargo } from "@/game/domain/rules/cargo";

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
});
