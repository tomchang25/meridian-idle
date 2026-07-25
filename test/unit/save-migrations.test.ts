import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

describe("V9 save migration", () => {
  it("creates one legal Lisbon world", () => {
    const state = createInitialGameState(100);
    expect(state.fleet.locationPortId).toBe("lisbon");
    expect(state.fleet.speed).toBe(100);
    expect(state.fleet.gold).toBe(2_000);
    expect(state.migrationReport).toBeNull();
  });

  it("preserves V1 Gold and drops V3 progression", () => {
    const result = loadSave({ version: 1, savedAt: 10, state: { resources: { gold: 99 } } }, 200);
    expect(result.kind).toBe("migrated");
    if (result.kind !== "migrated") return;
    expect(result.envelope.state.fleet.gold).toBe(99);
    expect(result.envelope.state.migrationReport?.acknowledged).toBe(false);
    expect(result.envelope.state.migrationReport?.droppedFields).toContain("running Action");
  });

  it("round-trips a current V9 payload, migrates V8, and rejects malformed saves", () => {
    const state = createInitialGameState(100);
    expect(loadSave(createSaveEnvelope(state, 200), 300)).toMatchObject({
      kind: "current",
      envelope: { savedAt: 200 },
    });
    const v8Fleet: Record<string, unknown> = structuredClone(state.fleet);
    delete v8Fleet.holdingNavPointId;
    delete v8Fleet.holdingOriginNodeId;
    const v8State = { ...state, schemaVersion: 8 as const, fleet: v8Fleet };
    expect(loadSave({ version: 8, savedAt: 200, state: v8State }, 300)).toMatchObject({
      kind: "migrated",
      envelope: {
        version: 9,
        savedAt: 300,
        state: { fleet: { holdingNavPointId: null, holdingOriginNodeId: null } },
      },
    });
    const malformedCurrent = createSaveEnvelope(state, 200);
    malformedCurrent.state.fleet.supplyTargets.food = 0.5;
    expect(loadSave(malformedCurrent, 300)).toEqual({ kind: "corrupt" });
    expect(loadSave({ version: 1, state: { resources: { gold: Number.NaN } } }, 300)).toEqual({ kind: "corrupt" });
  });

  it("migrates a valid active V6 Passage without duplicating its scheduled wait", () => {
    const state = createInitialGameState(100);
    const v6State = {
      ...state,
      schemaVersion: 6 as const,
      voyage: {
        id: "voyage-lisbon-faro-100",
        departedAt: 100,
        plannedArrivesAt: 2_100,
        passage: {
          kind: "planned" as const,
          originPortId: "lisbon",
          destinationPortId: "faro",
          simulationDurationMilliseconds: 40_000,
          scheduledDurationMilliseconds: 2_000,
          pacingMultiplier: 20,
          requiredSupplies: { food: 1, water: 1 },
          staticRisk: 0.1,
          totalDistance: 20,
          edges: [
            {
              id: "lisbon-approach-to-cape-st-vincent",
              originNodeId: "lisbon-approach",
              destinationNodeId: "cape-st-vincent",
              simulationEndOffsetMilliseconds: 40_000,
              staticRisk: 0.1,
              spans: [{ subRegionId: "iberian-atlantic", simulationEndOffsetMilliseconds: 40_000 }],
            },
          ],
        },
        supplyCost: 12,
        seed: 3,
      },
    };

    const result = loadSave({ version: 6, savedAt: 500, state: v6State }, 800);

    expect(result).toMatchObject({
      kind: "migrated",
      envelope: {
        version: 9,
        savedAt: 800,
        state: {
          voyage: {
            departedAt: 100,
            plannedArrivesAt: 2_100,
            passage: {
              kind: "planned",
              plannedSailingDurationMilliseconds: 40_000,
            },
          },
        },
      },
    });
    if (result.kind !== "migrated") return;
    expect(result.envelope.state.voyage?.passage).not.toHaveProperty("scheduledDurationMilliseconds");
    expect(result.envelope.state.voyage?.progress.supplyLedger).toMatchObject({
      accountingMode: "prepaid",
      consumedSupplies: { food: 1, water: 1 },
    });

    const migratedV9 = structuredClone(result.envelope);
    const migratedPassage = migratedV9.state.voyage?.passage;
    if (migratedPassage?.kind !== "planned") throw new Error("Expected a migrated planned Passage.");
    migratedPassage.edges[0].simulationEndOffsetMilliseconds = 39_999;
    expect(loadSave(migratedV9, 800)).toEqual({ kind: "corrupt" });

    const malformed = structuredClone(v6State);
    malformed.voyage.plannedArrivesAt = 2_101;
    expect(loadSave({ version: 6, savedAt: 500, state: malformed }, 800)).toEqual({ kind: "corrupt" });
  });

  it("migrates an active V7 Voyage into prepaid boundary progress", () => {
    const current = createInitialGameState(100);
    const v7State = {
      ...current,
      schemaVersion: 7 as const,
      voyage: {
        id: "voyage-lisbon-faro-100",
        departedAt: 100,
        plannedArrivesAt: 2_100,
        passage: {
          kind: "legacy-route" as const,
          legacyRouteId: "lisbon-faro",
          originPortId: "lisbon",
          destinationPortId: "faro",
          plannedSailingDurationMilliseconds: 2_000,
          pacingMultiplier: 1,
          requiredSupplies: { food: 1, water: 1 },
          staticRisk: 0.1,
        },
        supplyCost: 12,
        seed: 3,
      },
    };

    const result = loadSave({ version: 7, savedAt: 500, state: v7State }, 800);

    expect(result).toMatchObject({
      kind: "migrated",
      envelope: {
        version: 9,
        state: {
          voyage: {
            progress: {
              kind: "legacy-route",
              supplyLedger: { accountingMode: "prepaid", consumedSupplies: { food: 1, water: 1 } },
            },
          },
        },
      },
    });
  });

  it("migrates V3 Supply quantities into targets without enabling arrival automation", () => {
    const current = createInitialGameState(100);
    const { supplyTargets, autoRestockOnArrival, ...fleet } = current.fleet;
    expect(supplyTargets.food).toBe(0);
    expect(autoRestockOnArrival).toBe(false);
    const v3State = {
      ...current,
      schemaVersion: 3 as const,
      fleet: {
        ...fleet,
        supplies: { ...fleet.supplies, food: { quantity: 3, totalCostBasis: 24 } },
      },
    };

    const result = loadSave({ version: 3, savedAt: 200, state: v3State }, 300);

    expect(result.kind).toBe("migrated");
    if (result.kind !== "migrated") return;
    expect(result.envelope).toMatchObject({ version: 9, savedAt: 300 });
    expect(result.envelope.state.fleet.supplyTargets.food).toBe(3);
    expect(result.envelope.state.fleet.autoRestockOnArrival).toBe(false);
  });

  it("migrates V2 Rope and Sails stacks to Munitions and Spares without losing their cost basis", () => {
    const state = createInitialGameState(100);
    const v2State = {
      ...state,
      schemaVersion: 2 as const,
      fleet: {
        ...state.fleet,
        supplies: {
          food: { quantity: 1, totalCostBasis: 8 },
          water: { quantity: 2, totalCostBasis: 8 },
          medicine: { quantity: 3, totalCostBasis: 90 },
          rope: { quantity: 4, totalCostBasis: 72 },
          sails: { quantity: 5, totalCostBasis: 120 },
        },
      },
    };

    const result = loadSave({ version: 2, savedAt: 200, state: v2State }, 300);

    expect(result.kind).toBe("migrated");
    if (result.kind !== "migrated") return;
    expect(result.envelope).toMatchObject({ version: 9, savedAt: 300 });
    expect(result.envelope.state.fleet.supplies.munitions).toEqual({ quantity: 4, totalCostBasis: 72 });
    expect(result.envelope.state.fleet.supplies.spares).toEqual({ quantity: 5, totalCostBasis: 120 });
    expect(result.envelope.state.fleet.supplyTargets).toMatchObject({ munitions: 4, spares: 5 });
    expect(result.envelope.state.activity[0].message).toContain("renamed without changing");
  });

  it("backfills Fleet speed when loading the prior V4 schema", () => {
    const current = createInitialGameState(100);
    const { speed, ...fleet } = current.fleet;
    expect(speed).toBe(100);
    const v4State = { ...current, schemaVersion: 4 as const, fleet };

    const result = loadSave({ version: 4, savedAt: 200, state: v4State }, 300);

    expect(result).toMatchObject({ kind: "migrated", envelope: { version: 9, savedAt: 300 } });
    if (result.kind !== "migrated") return;
    expect(result.envelope.state.fleet.speed).toBe(100);
  });

  it("preserves a valid active V5 Voyage as a frozen legacy passage", () => {
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

    const result = loadSave({ version: 5, savedAt: 500, state: legacyV5 }, 800);

    expect(result).toMatchObject({
      kind: "migrated",
      envelope: {
        version: 9,
        state: {
          voyage: {
            departedAt: 100,
            plannedArrivesAt: 2_100,
            supplyCost: 12,
            seed: 3,
            passage: {
              kind: "legacy-route",
              legacyRouteId: "lisbon-faro",
              originPortId: "lisbon",
              destinationPortId: "faro",
              plannedSailingDurationMilliseconds: 2_000,
            },
          },
        },
      },
    });
  });

  it("rejects an active V5 Voyage whose frozen route payload is inconsistent", () => {
    const state = createInitialGameState(100);
    const malformed = {
      ...state,
      schemaVersion: 5 as const,
      voyage: {
        id: "voyage-bad",
        routeId: "lisbon-faro",
        originPortId: "lisbon",
        destinationPortId: "tangier",
        departedAt: 100,
        plannedArrivesAt: 2_100,
        staticRisk: 0.1,
        requiredSupplies: { food: 1, water: 1 },
        supplyCost: 12,
        seed: 3,
      },
    };

    expect(loadSave({ version: 5, savedAt: 500, state: malformed }, 800)).toEqual({ kind: "corrupt" });
  });
});
