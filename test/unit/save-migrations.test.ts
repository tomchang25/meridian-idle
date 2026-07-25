import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

describe("V5 save migration", () => {
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

  it("round-trips a current V5 payload and rejects malformed saves", () => {
    const state = createInitialGameState(100);
    expect(loadSave(createSaveEnvelope(state, 200), 300)).toMatchObject({
      kind: "current",
      envelope: { savedAt: 200 },
    });
    const malformedCurrent = createSaveEnvelope(state, 200);
    malformedCurrent.state.fleet.supplyTargets.food = 0.5;
    expect(loadSave(malformedCurrent, 300)).toEqual({ kind: "corrupt" });
    expect(loadSave({ version: 1, state: { resources: { gold: Number.NaN } } }, 300)).toEqual({ kind: "corrupt" });
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
    expect(result.envelope).toMatchObject({ version: 5, savedAt: 300 });
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
    expect(result.envelope).toMatchObject({ version: 5, savedAt: 300 });
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

    expect(result).toMatchObject({ kind: "migrated", envelope: { version: 5, savedAt: 300 } });
    if (result.kind !== "migrated") return;
    expect(result.envelope.state.fleet.speed).toBe(100);
  });
});
