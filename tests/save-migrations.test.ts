import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/game/infrastructure/persistence/save-migrations";

describe("V5 save migration", () => {
  it("creates one legal Lisbon world", () => {
    const state = createInitialGameState(100);
    expect(state.fleet.locationPortId).toBe("lisbon");
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
    expect(loadSave({ version: 1, state: { resources: { gold: Number.NaN } } }, 300)).toEqual({ kind: "corrupt" });
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
    expect(result.envelope).toMatchObject({ version: 3, savedAt: 300 });
    expect(result.envelope.state.fleet.supplies.munitions).toEqual({ quantity: 4, totalCostBasis: 72 });
    expect(result.envelope.state.fleet.supplies.spares).toEqual({ quantity: 5, totalCostBasis: 120 });
    expect(result.envelope.state.activity[0].message).toContain("renamed without changing");
  });
});
