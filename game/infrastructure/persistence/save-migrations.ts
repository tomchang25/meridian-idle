import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import type { GameState } from "@/game/domain/models/game";

export const CURRENT_SAVE_VERSION = 1;

export type SaveEnvelope = {
  version: number;
  savedAt: number;
  state: GameState;
};

export function createSaveEnvelope(state: GameState, now = Date.now()): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt: now, state: { ...state, lastSavedAt: now } };
}

export function migrateSave(value: unknown, now = Date.now()): SaveEnvelope | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SaveEnvelope>;
  if (candidate.version !== CURRENT_SAVE_VERSION || !candidate.state) return null;

  const fallback = createInitialGameState(now);
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: typeof candidate.savedAt === "number" ? candidate.savedAt : now,
    state: {
      ...fallback,
      ...candidate.state,
      resources: { ...fallback.resources, ...candidate.state.resources },
      knowledge: { ...fallback.knowledge, ...candidate.state.knowledge },
      skills: { ...fallback.skills, ...candidate.state.skills },
      mastery: { ...fallback.mastery, ...candidate.state.mastery },
    },
  };
}
