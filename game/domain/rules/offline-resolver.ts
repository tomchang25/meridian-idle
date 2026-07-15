import { getActionDefinition } from "@/game/domain/content/actions";
import type { GameLogEntry, GameState } from "@/game/domain/models/game";

const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
const MAX_LOG_ENTRIES = 24;

export type OfflineResolution = {
  state: GameState;
  completedCycles: number;
  elapsedMs: number;
};

export function resolveElapsedAction(state: GameState, now: number): OfflineResolution {
  const running = state.currentAction;
  if (!running) return { state, completedCycles: 0, elapsedMs: 0 };

  const action = getActionDefinition(running.actionId);
  if (!action) return { state: { ...state, currentAction: null }, completedCycles: 0, elapsedMs: 0 };

  const cappedNow = Math.min(now, state.lastSavedAt + MAX_OFFLINE_MS);
  const elapsedMs = Math.max(0, cappedNow - state.lastSavedAt);
  const cycleMs = action.durationSec * 1000;
  const completedCycles = Math.max(0, Math.floor((cappedNow - running.cycleStartedAt) / cycleMs));
  if (completedCycles === 0) return { state, completedCycles, elapsedMs };

  const goldReward = action.rewards.find((reward) => reward.type === "gold")?.minAmount ?? 0;
  const fameReward = action.rewards.find((reward) => reward.type === "fame")?.minAmount ?? 0;
  const nextCycleStartedAt = running.cycleStartedAt + completedCycles * cycleMs;
  const message = `${action.name}完成 ${completedCycles} 輪，獲得 ${goldReward * completedCycles} 金幣。`;
  const logEntry: GameLogEntry = {
    id: `resolve-${now}-${completedCycles}`,
    at: now,
    message,
    tone: "success",
  };

  return {
    completedCycles,
    elapsedMs,
    state: {
      ...state,
      resources: {
        gold: state.resources.gold + goldReward * completedCycles,
        fame: state.resources.fame + fameReward * completedCycles,
      },
      mastery: {
        ...state.mastery,
        [action.id]: (state.mastery[action.id] ?? 0) + completedCycles,
      },
      currentAction: {
        ...running,
        cycleStartedAt: nextCycleStartedAt,
        cycleEndsAt: nextCycleStartedAt + cycleMs,
      },
      eventLog: [logEntry, ...state.eventLog].slice(0, MAX_LOG_ENTRIES),
    },
  };
}
