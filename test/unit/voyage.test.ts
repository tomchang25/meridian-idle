import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/content-catalog";
import { buySupply, setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import { departVoyage, resolveVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

function createDepartedVoyage() {
  let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
  state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
  return departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, 3).state;
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
    expect(resolveVoyage(WORLD_CONTENT, departed, 99).state).toBe(departed);
    expect(resolveVoyage(WORLD_CONTENT, departed, 2_099).state).toBe(departed);
    expect(resolveVoyage(WORLD_CONTENT, departed, 2_100).state.fleet.locationPortId).toBe("faro");
  });

  it("produces the same persisted result at exact and long-offline resolution times", () => {
    const departed = createDepartedVoyage();
    const exact = resolveVoyage(WORLD_CONTENT, departed, 2_100).state;
    const offline = resolveVoyage(WORLD_CONTENT, departed, 900_000).state;
    expect(offline).toEqual(exact);
    expect(exact.latestVoyageResult?.arrivedAt).toBe(2_100);
    expect(resolveVoyage(WORLD_CONTENT, exact, 901_000).state).toBe(exact);
  });

  it("round-trips an in-progress Voyage before offline arrival", () => {
    const departed = createDepartedVoyage();
    const loaded = loadSave(createSaveEnvelope(departed, 500), 800);
    expect(loaded.kind).toBe("current");
    if (loaded.kind !== "current") return;
    expect(loaded.envelope.state.voyage).toEqual(departed.voyage);
    const arrived = resolveVoyage(WORLD_CONTENT, loaded.envelope.state, 10_000).state;
    expect(arrived.fleet.locationPortId).toBe("faro");
    expect(arrived.latestVoyageResult?.supplyCost).toBe(12);
  });

  it("restocks target deficits at fixed global prices after arrival", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    state = setSupplyTarget(state, "food", 2).state;
    state = setSupplyTarget(state, "water", 2).state;
    state = setAutoRestockOnArrival(state, true).state;
    const resolution = resolveVoyage(
      WORLD_CONTENT,
      departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, 3).state,
      2_100,
    );
    const arrived = resolution.state;

    expect(arrived.fleet.supplies.food).toEqual({ quantity: 2, totalCostBasis: 16 });
    expect(arrived.fleet.supplies.water).toEqual({ quantity: 2, totalCostBasis: 8 });
    expect(arrived.fleet.gold).toBe(1_964);
    expect(resolution.events).toEqual([
      {
        kind: "supplies-restocked",
        at: 2_100,
        quantity: 4,
        cause: { kind: "voyage-arrival", voyageId: "voyage-lisbon-faro-100" },
      },
      {
        kind: "voyage-arrived",
        at: 2_100,
        voyageId: "voyage-lisbon-faro-100",
        destinationPortId: "faro",
      },
    ]);
    expect(arrived.latestVoyageResult?.supplyCost).toBe(12);
    expect(
      resolveVoyage(WORLD_CONTENT, departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, 3).state, 900_000).state,
    ).toEqual(arrived);
  });

  it("keeps a completed arrival when automatic restock cannot afford every deficit", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    state = setSupplyTarget(state, "food", 2).state;
    state = setSupplyTarget(state, "water", 2).state;
    state = setAutoRestockOnArrival(state, true).state;
    state.fleet.gold = 0;
    const resolution = resolveVoyage(
      WORLD_CONTENT,
      departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, 3).state,
      2_100,
    );
    const arrived = resolution.state;

    expect(arrived.fleet.locationPortId).toBe("faro");
    expect(arrived.voyage).toBeNull();
    expect(arrived.fleet.supplies.food.quantity).toBe(0);
    expect(arrived.fleet.supplies.water.quantity).toBe(0);
    // The failure precedes arrival so the rendered arrival entry stays newest.
    expect(resolution.events.map((event) => event.kind)).toEqual(["voyage-auto-restock-failed", "voyage-arrived"]);
  });
});
