import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import type { V5GameState } from "@/game/domain/models/game";

export const CURRENT_SAVE_VERSION = 2;

export type SaveEnvelope = { version: 2; savedAt: number; state: V5GameState };
export type SaveLoadResult =
  { kind: "current"; envelope: SaveEnvelope } | { kind: "migrated"; envelope: SaveEnvelope } | { kind: "corrupt" };

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
    candidate.schemaVersion === 2 &&
    !!candidate.fleet &&
    candidate.fleet.locationPortId === "lisbon" &&
    isFiniteNonNegative(candidate.fleet.gold)
  );
}

export function createSaveEnvelope(state: V5GameState, now: number): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt: now, state };
}

export function loadSave(value: unknown, now: number): SaveLoadResult {
  if (!value || typeof value !== "object") return { kind: "corrupt" };
  const candidate = value as { version?: unknown; savedAt?: unknown; state?: unknown };
  if (candidate.version === 2 && isFiniteNonNegative(candidate.savedAt) && isV5State(candidate.state)) {
    return { kind: "current", envelope: { version: 2, savedAt: candidate.savedAt, state: candidate.state } };
  }
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
