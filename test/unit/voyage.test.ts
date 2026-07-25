import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/content-catalog";
import { buySupply, setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import {
  breakOffAtNode,
  breakOffVoyage,
  departVoyage,
  previewBreakOff,
  previewVoyagePassage,
  resolveVoyage,
} from "@/core/rules/voyage";
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

describe("break-off", () => {
  function stockedFleet(quantity: number) {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", quantity, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", quantity, 2).state;
    return state;
  }

  it("quotes both exits mid-edge, holds at a non-chart-destination NavPoint, and can continue from it", () => {
    const departed = departForFaro(stockedFleet(2), 100, 20).state;

    const preview = previewBreakOff(WORLD_CONTENT, departed, 600, 20);
    expect(preview.kind).toBe("mid-edge");
    if (preview.kind !== "mid-edge") return;
    expect(preview.prior).toMatchObject({ exit: "prior", nodeId: "lisbon-approach", error: null });
    expect(preview.next).toMatchObject({ exit: "next", nodeId: "cape-st-vincent", error: null });

    const result = breakOffVoyage(WORLD_CONTENT, departed, 600, "prior", preview.prior.quoteId!, 5, 20);
    expect(result.error).toBeUndefined();
    expect(result.events).toEqual([
      { kind: "voyage-broke-off", at: 600, voyageId: result.state.voyage!.id, destinationPortId: "lisbon-approach" },
    ]);
    expect(result.state.fleet.supplies).toEqual(departed.fleet.supplies);
    const connector = result.state.voyage!;
    expect(connector.progress.supplyLedger).toMatchObject({
      remainderMicroUnitMilliseconds: { food: 200_000_000, water: 200_000_000 },
    });

    const held = resolveVoyage(WORLD_CONTENT, result.state, connector.plannedArrivesAt).state;
    expect(held.voyage).toBeNull();
    expect(held.fleet.holdingNavPointId).toBe("lisbon-approach");
    expect(held.fleet.locationPortId).toBe("lisbon");
    expect(held.fleet.supplies.food.quantity).toBe(1);
    expect(held.fleet.supplies.water.quantity).toBe(1);

    const toFaro = previewVoyagePassage(WORLD_CONTENT, held, "faro", 20);
    expect(toFaro.error).toBeNull();
    const returned = departVoyage(WORLD_CONTENT, held, "faro", toFaro.quoteId!, 1_700, 6, 20).state;
    expect(resolveVoyage(WORLD_CONTENT, returned, 10_000).state.fleet.locationPortId).toBe("faro");
  });

  it("completes an immediate hold when the resolved position lands exactly on a node", () => {
    const departed = departForFaro(stockedFleet(2), 100, 20).state;

    const preview = previewBreakOff(WORLD_CONTENT, departed, 300, 20);
    expect(preview).toMatchObject({ kind: "at-node", nodeId: "lisbon-approach" });
    if (preview.kind !== "at-node") return;

    const result = breakOffAtNode(WORLD_CONTENT, departed, 300, preview.quoteId, 5);
    expect(result.error).toBeUndefined();
    expect(result.events.map((event) => event.kind)).toEqual(["voyage-broke-off", "voyage-reached-nav-point"]);
    expect(result.state.voyage).toBeNull();
    expect(result.state.fleet.holdingNavPointId).toBe("lisbon-approach");
    expect(result.state.fleet.supplies).toEqual(departed.fleet.supplies);
  });

  it("refuses break-off with an explicit reason when not underway, arrived, or supplies are short", () => {
    const idleState = stockedFleet(2);
    expect(previewBreakOff(WORLD_CONTENT, idleState, 600)).toEqual({
      kind: "unavailable",
      error: "The Fleet is not underway.",
    });

    const departed = departForFaro(stockedFleet(2), 100, 20).state;
    expect(previewBreakOff(WORLD_CONTENT, departed, 2_100, 20)).toEqual({
      kind: "unavailable",
      error: "The Voyage has already arrived; resolve arrival before breaking off.",
    });

    const short = departForFaro(stockedFleet(2), 100, 20).state;
    short.fleet.supplies.food.quantity = 0;
    short.fleet.supplies.water.quantity = 0;
    const preview = previewBreakOff(WORLD_CONTENT, short, 600, 20);
    expect(preview.kind).toBe("mid-edge");
    if (preview.kind !== "mid-edge") return;
    expect(preview.prior.error).toMatch(/Requires Food/);
    expect(preview.next.error).toMatch(/Requires Food/);
    const result = breakOffVoyage(WORLD_CONTENT, short, 600, "prior", preview.prior.quoteId!, 5, 20);
    expect(result.error).toMatch(/Requires Food/);
    expect(result.state).toBe(short);
  });

  it("keeps a quote valid while the Fleet moves along the same edge, and rejects it once the exit node changes", () => {
    const departed = departForFaro(stockedFleet(3), 100, 20).state;
    const quotedAt = 500;
    const preview = previewBreakOff(WORLD_CONTENT, departed, quotedAt, 20);
    if (preview.kind !== "mid-edge") throw new Error("Expected a mid-edge preview.");
    const quoteId = preview.next.quoteId!;
    expect(preview.next.nodeId).toBe("cape-st-vincent");

    // The panel repaints on a timer while the Fleet keeps sailing, so a click is
    // always some milliseconds behind the quote it was rendered from.
    for (const clickAt of [quotedAt, quotedAt + 50, quotedAt + 250, quotedAt + 400]) {
      const result = breakOffVoyage(WORLD_CONTENT, departed, clickAt, "next", quoteId, 5, 20);
      expect(result.error).toBeUndefined();
      expect(result.state.voyage?.passage.destinationPortId).toBe("cape-st-vincent");
    }

    // Crossing into the next edge changes what "continue onward" means, so the
    // same confirmation must now be refused.
    const afterBoundary = previewBreakOff(WORLD_CONTENT, departed, 1_400, 20);
    if (afterBoundary.kind !== "mid-edge") throw new Error("Expected a mid-edge preview.");
    expect(afterBoundary.next.nodeId).toBe("faro-approach");
    const crossed = breakOffVoyage(WORLD_CONTENT, departed, 1_400, "next", quoteId, 5, 20);
    expect(crossed.error).toBe("This break-off quote is stale. Review the latest exit details.");
    expect(crossed.state).toBe(departed);
  });

  it("rejects a stale break-off quote without mutating state", () => {
    const departed = departForFaro(stockedFleet(2), 100, 20).state;
    const preview = previewBreakOff(WORLD_CONTENT, departed, 600, 20);
    if (preview.kind !== "mid-edge") throw new Error("Expected a mid-edge preview.");

    const staleState = { ...departed, fleet: { ...departed.fleet, speed: 50 } };
    const result = breakOffVoyage(WORLD_CONTENT, staleState, 600, "next", preview.next.quoteId!, 5, 20);

    expect(result.error).toBe("This break-off quote is stale. Review the latest exit details.");
    expect(result.state).toBe(staleState);
  });

  it("refuses break-off for a legacy-route Voyage", () => {
    const state = createInitialGameState(100);
    const legacyV5 = {
      ...state,
      schemaVersion: 5 as const,
      voyage: {
        id: "voyage-lisbon-faro-100",
        routeId: "lisbon-faro",
        originPortId: "lisbon",
        destinationPortId: "faro",
        departedAt: 100,
        plannedArrivesAt: 2_100,
        staticRisk: 0.1,
        requiredSupplies: { food: 1, water: 1 },
        supplyCost: 12,
        seed: 3,
      },
    };
    const loaded = loadSave({ version: 5, savedAt: 500, state: legacyV5 }, 800);
    if (loaded.kind !== "migrated") throw new Error("Expected a migrated legacy-route Voyage.");

    expect(previewBreakOff(WORLD_CONTENT, loaded.envelope.state, 900)).toEqual({
      kind: "unavailable",
      error: "Break-off is unavailable for this Voyage.",
    });
  });
});
