import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import type { CargoStack, V5GameState } from "@/game/domain/models/game";

export const CURRENT_SAVE_VERSION = 3;

export type SaveEnvelope = { version: 3; savedAt: number; state: V5GameState };
export type SaveLoadResult =
  { kind: "current"; envelope: SaveEnvelope } | { kind: "migrated"; envelope: SaveEnvelope } | { kind: "corrupt" };
type V2GameState = Omit<V5GameState, "schemaVersion" | "fleet"> & {
  schemaVersion: 2;
  fleet: Omit<V5GameState["fleet"], "supplies"> & {
    supplies: Record<"food" | "water" | "medicine" | "rope" | "sails", CargoStack>;
  };
};

const DROPPED_V1_FIELDS = [
  "Captain",
  "Fame",
  "Knowledge",
  "Skills",
  "Action Mastery",
  "selected Action presentation",
  "V3 logs",
  "running Action",
];

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isV5State(value: unknown): value is V5GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<V5GameState>;
  return (
    candidate.schemaVersion === 3 &&
    !!candidate.fleet &&
    typeof candidate.fleet.locationPortId === "string" &&
    !!candidate.marketSession &&
    isFiniteNonNegative(candidate.fleet.gold)
  );
}

function isCargoStack(value: unknown): value is CargoStack {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CargoStack>;
  return isFiniteNonNegative(candidate.quantity) && isFiniteNonNegative(candidate.totalCostBasis);
}

function isV2State(value: unknown): value is V2GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    schemaVersion?: unknown;
    fleet?: { locationPortId?: unknown; gold?: unknown; supplies?: unknown };
    marketSession?: unknown;
  };
  if (
    candidate.schemaVersion !== 2 ||
    !candidate.fleet ||
    typeof candidate.fleet.locationPortId !== "string" ||
    !candidate.marketSession ||
    !isFiniteNonNegative(candidate.fleet.gold) ||
    !candidate.fleet.supplies ||
    typeof candidate.fleet.supplies !== "object"
  )
    return false;
  const supplies = candidate.fleet.supplies as Record<string, unknown>;
  return ["food", "water", "medicine", "rope", "sails"].every((id) => isCargoStack(supplies[id]));
}

function migrateV2State(state: V2GameState, now: number): V5GameState {
  const { rope, sails, ...supplies } = state.fleet.supplies;
  return {
    ...state,
    schemaVersion: 3,
    fleet: { ...state.fleet, supplies: { ...supplies, munitions: rope, spares: sails } },
    activity: [
      {
        id: `v2-supplies-migrated-${now}`,
        at: now,
        message: "Munitions and Spares stores were renamed without changing their quantities or cost basis.",
        tone: "info",
      },
      ...state.activity,
    ],
  };
}

export function createSaveEnvelope(state: V5GameState, now: number): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt: now, state };
}

export function loadSave(value: unknown, now: number): SaveLoadResult {
  if (!value || typeof value !== "object") return { kind: "corrupt" };
  const candidate = value as { version?: unknown; savedAt?: unknown; state?: unknown };
  if (candidate.version === 3 && isFiniteNonNegative(candidate.savedAt) && isV5State(candidate.state)) {
    return { kind: "current", envelope: { version: 3, savedAt: candidate.savedAt, state: candidate.state } };
  }
  if (candidate.version === 2 && isFiniteNonNegative(candidate.savedAt) && isV2State(candidate.state))
    return { kind: "migrated", envelope: createSaveEnvelope(migrateV2State(candidate.state, now), now) };
  if (candidate.version !== 1 || !candidate.state || typeof candidate.state !== "object") return { kind: "corrupt" };
  const legacyGold = (candidate.state as { resources?: { gold?: unknown } }).resources?.gold;
  if (!isFiniteNonNegative(legacyGold)) return { kind: "corrupt" };
  const state = createInitialGameState(now);
  state.fleet.gold = legacyGold;
  state.migrationReport = { fromVersion: 1, migratedAt: now, droppedFields: DROPPED_V1_FIELDS, acknowledged: false };
  state.activity = [
    { id: `v1-migrated-${now}`, at: now, message: "V3 save migrated. Review the migration report.", tone: "warning" },
  ];
  return { kind: "migrated", envelope: createSaveEnvelope(state, now) };
}
