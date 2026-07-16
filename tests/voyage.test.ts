import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { buySupply } from "@/game/domain/rules/cargo";
import { departVoyage, resolveVoyage } from "@/game/domain/rules/voyage";
describe("voyage", () => {
  it("commits supplies once and resolves an arrival idempotently", () => {
    let state = buySupply(createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(state, "water", 1, 2).state;
    const departed = departVoyage(state, "lisbon-faro", 100, 3).state;
    expect(departed.fleet.supplies.food.quantity).toBe(0);
    const arrived = resolveVoyage(departed, 2_100).state;
    expect(arrived.fleet.locationPortId).toBe("faro");
    expect(resolveVoyage(arrived, 9_000).state).toBe(arrived);
  });
});
