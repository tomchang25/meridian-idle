import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/content-catalog";
import { buySupply, setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import { departVoyage, previewVoyagePassage, resolveVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

function departForFaro(state: ReturnType<typeof createInitialGameState>, now = 100, pacingMultiplier = 20) {
  const preview = previewVoyagePassage(WORLD_CONTENT, state, "faro", pacingMultiplier);
  if (!preview.quoteId) throw new Error("Expected Lisbon-to-Faro quote.");
  return departVoyage(WORLD_CONTENT, state, "faro", preview.quoteId, now, 3, pacingMultiplier);
}

function createDepartedVoyage() {
  let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
  state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
  return departForFaro(state).state;
}

describe("voyage", () => {
  it("arrives at a holdable NavPoint without settling a Port and can continue to a known Port", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 2, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 2, 2).state;
    const toCape = previewVoyagePassage(WORLD_CONTENT, state, "cape-st-vincent", 20);
    const departed = departVoyage(WORLD_CONTENT, state, "cape-st-vincent", toCape.quoteId!, 100, 3, 20).state;
    const held = resolveVoyage(WORLD_CONTENT, departed, 1_100).state;

    expect(held.voyage).toBeNull();
    expect(held.fleet.holdingNavPointId).toBe("cape-st-vincent");
    expect(held.fleet.locationPortId).toBe("lisbon");
    expect(held.marketSession.portId).toBe("lisbon");
    expect(held.fleet.supplies.food.quantity).toBe(1);
    expect(resolveVoyage(WORLD_CONTENT, held, 900_000).state).toBe(held);

    const toFaro = previewVoyagePassage(WORLD_CONTENT, held, "faro", 20);
    expect(toFaro.error).toBeNull();
    const returned = departVoyage(WORLD_CONTENT, held, "faro", toFaro.quoteId!, 1_200, 4, 20).state;
    expect(resolveVoyage(WORLD_CONTENT, returned, 2_200).state.fleet.locationPortId).toBe("faro");
  });

  it("reserves Supplies at departure and consumes their quantity and cost basis on arrival", () => {
    const departed = createDepartedVoyage();
    expect(departed.fleet.supplies.food).toEqual({ quantity: 1, totalCostBasis: 8 });
    expect(departed.fleet.supplies.water).toEqual({ quantity: 1, totalCostBasis: 4 });
    expect(departed.voyage?.supplyCost).toBe(0);
    expect(departed.voyage?.progress.supplyLedger.consumedSupplies).toEqual({ food: 0, water: 0 });

    const arrived = resolveVoyage(WORLD_CONTENT, departed, 2_100).state;
    expect(arrived.fleet.supplies.food).toEqual({ quantity: 0, totalCostBasis: 0 });
    expect(arrived.fleet.supplies.water).toEqual({ quantity: 0, totalCostBasis: 0 });
    expect(arrived.latestVoyageResult?.supplyCost).toBe(12);
  });

  it("keeps simulation costs constant while pacing only compresses the arrival schedule", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    const x1 = departForFaro(state, 100, 1).state.voyage!;
    const x20 = departForFaro(state, 100, 20).state.voyage!;
    if (x1.passage.kind !== "planned" || x20.passage.kind !== "planned") throw new Error("Expected planned passages.");

    expect(x1.passage).toMatchObject({ plannedSailingDurationMilliseconds: 40_000 });
    expect(x20.passage).toMatchObject({ plannedSailingDurationMilliseconds: 40_000 });
    expect(x1.plannedArrivesAt - x1.departedAt).toBe(40_000);
    expect(x20.plannedArrivesAt - x20.departedAt).toBe(2_000);
    expect(x20.passage.requiredSupplies).toEqual(x1.passage.requiredSupplies);
    expect(x20.passage.edges).toEqual(x1.passage.edges);
    expect(x1.passage.edges.map((edge) => edge.simulationEndOffsetMilliseconds)).toEqual([
      4_000, 20_000, 36_000, 40_000,
    ]);
    expect(x1.passage.edges[1].spans.map((span) => span.simulationEndOffsetMilliseconds)).toEqual([12_000, 20_000]);
    expect(x1.passage.edges[0]).not.toHaveProperty("distance");
    expect(x1.passage.edges[0]).not.toHaveProperty("traversalModifier");
    expect(x1.passage).not.toHaveProperty("effectiveFleetSpeed");
    expect(x1.passage).not.toHaveProperty("scheduledDurationMilliseconds");
  });

  it("rejects a stale planner quote without consuming Supplies", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    const preview = previewVoyagePassage(WORLD_CONTENT, state, "faro");
    state = { ...state, fleet: { ...state.fleet, speed: 200 } };

    const result = departVoyage(WORLD_CONTENT, state, "faro", preview.quoteId!, 100, 3);

    expect(result.error).toBe("This passage quote is stale. Review the latest departure details.");
    expect(result.state).toBe(state);
    expect(result.state.fleet.supplies.food).toEqual({ quantity: 1, totalCostBasis: 8 });
    expect(result.state.fleet.supplies.water).toEqual({ quantity: 1, totalCostBasis: 4 });
  });

  it("treats clock rollback as a no-op and completes at the exact boundary", () => {
    const departed = createDepartedVoyage();
    expect(resolveVoyage(WORLD_CONTENT, departed, 99).state).toBe(departed);
    const beforeArrival = resolveVoyage(WORLD_CONTENT, departed, 2_099).state;
    expect(beforeArrival.voyage?.progress).toMatchObject({
      resolvedSimulationOffsetMilliseconds: 36_000,
      position: { kind: "node", nodeId: "faro-approach" },
    });
    expect(beforeArrival.fleet.supplies).toEqual(departed.fleet.supplies);
    expect(resolveVoyage(WORLD_CONTENT, departed, 2_100).state.fleet.locationPortId).toBe("faro");
  });

  it("deducts whole Supply units at fixed-point elapsed thresholds", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 2, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 2, 2).state;
    state = { ...state, fleet: { ...state.fleet, speed: 50 } };
    const preview = previewVoyagePassage(WORLD_CONTENT, state, "faro", 20);
    const departed = departVoyage(WORLD_CONTENT, state, "faro", preview.quoteId!, 100, 3, 20).state;

    const firstUnit = resolveVoyage(WORLD_CONTENT, departed, 2_600).state;
    expect(firstUnit.voyage?.progress.supplyLedger.consumedSupplies).toEqual({ food: 1, water: 1 });
    expect(firstUnit.fleet.supplies.food.quantity).toBe(1);
    expect(firstUnit.fleet.supplies.water.quantity).toBe(1);

    const arrived = resolveVoyage(WORLD_CONTENT, firstUnit, 4_100).state;
    expect(arrived.fleet.supplies.food.quantity).toBe(0);
    expect(arrived.fleet.supplies.water.quantity).toBe(0);
    expect(arrived.latestVoyageResult?.supplyCost).toBe(24);
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
    const resolution = resolveVoyage(WORLD_CONTENT, departForFaro(state).state, 2_100);
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
    expect(resolveVoyage(WORLD_CONTENT, departForFaro(state).state, 900_000).state).toEqual(arrived);
  });

  it("keeps a completed arrival when automatic restock cannot afford every deficit", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    state = setSupplyTarget(state, "food", 2).state;
    state = setSupplyTarget(state, "water", 2).state;
    state = setAutoRestockOnArrival(state, true).state;
    state.fleet.gold = 0;
    const resolution = resolveVoyage(WORLD_CONTENT, departForFaro(state).state, 2_100);
    const arrived = resolution.state;

    expect(arrived.fleet.locationPortId).toBe("faro");
    expect(arrived.voyage).toBeNull();
    expect(arrived.fleet.supplies.food.quantity).toBe(0);
    expect(arrived.fleet.supplies.water.quantity).toBe(0);
    // The failure precedes arrival so the rendered arrival entry stays newest.
    expect(resolution.events.map((event) => event.kind)).toEqual(["voyage-auto-restock-failed", "voyage-arrived"]);
  });
});
