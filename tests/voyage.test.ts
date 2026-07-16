import { describe, expect, it } from "vitest";
import { buySupply } from "@/game/domain/rules/cargo";
import { departVoyage, resolveVoyage } from "@/game/domain/rules/voyage";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/game/infrastructure/persistence/save-migrations";

function createDepartedVoyage() {
  let state = buySupply(createInitialGameState(0), "food", 1, 1).state;
  state = buySupply(state, "water", 1, 2).state;
  return departVoyage(state, "lisbon-faro", 100, 3).state;
}

describe("voyage", () => {
  it("commits Supply quantity and cost basis exactly once", () => {
    const departed = createDepartedVoyage();
    expect(departed.fleet.supplies.food).toEqual({ quantity: 0, totalCostBasis: 0 });
    expect(departed.fleet.supplies.water).toEqual({ quantity: 0, totalCostBasis: 0 });
    expect(departed.voyage?.supplyCost).toBe(12);
  });

  it("treats clock rollback as a no-op and completes at the exact boundary", () => {
    const departed = createDepartedVoyage();
    expect(resolveVoyage(departed, 99).state).toBe(departed);
    expect(resolveVoyage(departed, 2_099).state).toBe(departed);
    expect(resolveVoyage(departed, 2_100).state.fleet.locationPortId).toBe("faro");
  });

  it("produces the same persisted result at exact and long-offline resolution times", () => {
    const departed = createDepartedVoyage();
    const exact = resolveVoyage(departed, 2_100).state;
    const offline = resolveVoyage(departed, 900_000).state;
    expect(offline).toEqual(exact);
    expect(exact.latestVoyageResult?.arrivedAt).toBe(2_100);
    expect(resolveVoyage(exact, 901_000).state).toBe(exact);
  });

  it("round-trips an in-progress Voyage before offline arrival", () => {
    const departed = createDepartedVoyage();
    const loaded = loadSave(createSaveEnvelope(departed, 500), 800);
    expect(loaded.kind).toBe("current");
    if (loaded.kind !== "current") return;
    expect(loaded.envelope.state.voyage).toEqual(departed.voyage);
    const arrived = resolveVoyage(loaded.envelope.state, 10_000).state;
    expect(arrived.fleet.locationPortId).toBe("faro");
    expect(arrived.latestVoyageResult?.supplyCost).toBe(12);
  });
});
